import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { serializeAdminPlan } from '@/lib/plans/serialize';
import { ensurePlanIndexes } from '@/lib/plans/syncIndexes';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  version: z.number().int().positive(),
});

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    await ensurePlanIndexes();
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input');

    const existing = await Plan.findById(id);
    if (!existing) return notFound();
    if (parsed.data.version !== (existing.version ?? 1)) {
      return conflict('This plan was changed elsewhere, reload');
    }
    if (existing.status === 'archived') {
      return badRequest('Archived plans cannot be shown on the landing page');
    }
    if (existing.status !== 'active') {
      return badRequest('Only an active plan can be shown on the landing page');
    }
    if (existing.type !== 'one_time') {
      return badRequest('Only a one-time plan can be shown on the landing page');
    }

    try {
      await Plan.updateMany(
        { _id: { $ne: existing._id }, isLandingPlan: true },
        {
          $set: { isLandingPlan: false, updatedBy: gate.admin.sub },
          $inc: { version: 1 },
        }
      );

      const landingSession = await Session.findOne({ isLandingActive: true })
        .select({ _id: 1 })
        .lean();
      const landingSessionId = landingSession
        ? String(landingSession._id)
        : '';

      existing.isLandingPlan = true;
      // Mentorship landing plan must stay separate from workshop reserve CTAs.
      if (existing.isWorkshopPlan) {
        existing.isWorkshopPlan = false;
      }
      // Keep session binding aligned with the public landing session so
      // checkout filters and admin pills stay consistent.
      existing.sessionId = landingSessionId;
      existing.updatedBy = gate.admin.sub;
      existing.version = (existing.version ?? 1) + 1;
      await existing.save();
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code?: number }).code
          : undefined;
      if (code === 11000) {
        return badRequest(
          'Another plan is already marked for the landing page. Reload and try again.'
        );
      }
      throw err;
    }

    await logAudit({
      adminId: gate.admin.sub,
      action: 'plan.landing',
      entity: 'plan',
      entityId: id,
      meta: { name: existing.name },
    });

    const refreshed = await Plan.findById(id);
    if (!refreshed) return notFound();

    const title = refreshed.sessionId
      ? (
          await Session.findById(refreshed.sessionId).select({ title: 1 }).lean()
        )?.title ?? null
      : null;

    return NextResponse.json({
      plan: serializeAdminPlan(
        refreshed,
        title,
        new Date(),
        refreshed.sessionId || null
      ),
    });
  } catch (err) {
    console.error(
      '[plans landing]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
