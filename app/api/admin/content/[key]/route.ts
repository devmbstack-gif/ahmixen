import { NextResponse } from 'next/server';
import { SiteContent } from '@/models/SiteContent';
import { MediaAsset } from '@/models/MediaAsset';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import {
  CONTENT_REGISTRY,
  instructorDataSchema,
  isContentKey,
  type InstructorContentData,
} from '@/lib/content/registry';
import { revalidateContentKey } from '@/lib/content/cache';
import type {
  IntroContentData,
  PreviewContentData,
  ProgramsContentData,
  StatsContentData,
} from '@/lib/content/landingSchemas';
import { applyTrainedStatFromInstructor } from '@/lib/content/landingPublic';
import { instructor as staticInstructor } from '@/data/instructor';
import { z } from 'zod';

async function instructorStatsForTrained() {
  const instructorDoc = await SiteContent.findOne({ key: 'instructor' }).lean();
  if (instructorDoc?.data) {
    const parsed = instructorDataSchema.safeParse(instructorDoc.data);
    if (parsed.success) return parsed.data.stats;
  }
  return staticInstructor.stats;
}

type Ctx = { params: Promise<{ key: string }> };

const putBodySchema = z.object({
  version: z.number().int().positive(),
  data: z.unknown(),
});

async function assertMediaExists(id: string | null | undefined) {
  if (!id) return true;
  const asset = await MediaAsset.findById(id);
  return Boolean(asset);
}

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { key } = await ctx.params;
    if (!isContentKey(key)) return notFound();

    const entry = CONTENT_REGISTRY[key];
    let doc = await SiteContent.findOne({ key });
    if (!doc) {
      doc = await SiteContent.create({
        key,
        data: entry.staticDefault,
        version: 1,
        updatedBy: '',
        updatedByName: '',
      });
    }

    let data = doc.data;
    if (key === 'stats') {
      const parsedStats = entry.schema.safeParse(doc.data);
      if (parsedStats.success) {
        data = applyTrainedStatFromInstructor(
          parsedStats.data as StatsContentData,
          await instructorStatsForTrained()
        );
      }
    }

    return NextResponse.json({
      key,
      label: entry.label,
      description: entry.description,
      version: doc.version ?? 1,
      data,
      updatedAt: doc.updatedAt?.toISOString?.() ?? null,
      updatedByName: doc.updatedByName || '',
    });
  } catch (err) {
    console.error('[admin content GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { key } = await ctx.params;
    if (!isContentKey(key)) return notFound();

    const entry = CONTENT_REGISTRY[key];
    const body = await request.json().catch(() => null);
    const envelope = putBodySchema.safeParse(body);
    if (!envelope.success) {
      return badRequest(envelope.error.issues[0]?.message || 'Invalid input');
    }

    const parsed = entry.schema.safeParse(envelope.data.data);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    if (key === 'instructor') {
      const data = parsed.data as InstructorContentData;
      if (data.photoAssetId && !(await assertMediaExists(data.photoAssetId))) {
        return badRequest('Choose a photo from the media library');
      }
    }
    if (key === 'intro') {
      const data = parsed.data as IntroContentData;
      if (data.photoAssetId && !(await assertMediaExists(data.photoAssetId))) {
        return badRequest('Choose a photo from the media library');
      }
    }
    if (key === 'preview') {
      const data = parsed.data as PreviewContentData;
      if (data.posterAssetId && !(await assertMediaExists(data.posterAssetId))) {
        return badRequest('Choose a poster from the media library');
      }
    }
    if (key === 'programs') {
      const data = parsed.data as ProgramsContentData;
      for (const card of data.cards) {
        if (
          card.posterAssetId &&
          !(await assertMediaExists(card.posterAssetId))
        ) {
          return badRequest('Choose a valid image from the media library');
        }
      }
    }

    let dataToSave = parsed.data;
    if (key === 'stats') {
      dataToSave = applyTrainedStatFromInstructor(
        parsed.data as StatsContentData,
        await instructorStatsForTrained()
      );
    }

    let doc = await SiteContent.findOne({ key });
    if (!doc) {
      doc = new SiteContent({
        key,
        data: entry.staticDefault,
        version: 1,
      });
    }

    if (envelope.data.version !== (doc.version ?? 1)) {
      return conflict('This was changed elsewhere, reload');
    }

    doc.data = dataToSave;
    doc.version = (doc.version ?? 1) + 1;
    doc.updatedBy = gate.admin.sub;
    doc.updatedByName = gate.admin.name;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'content.update',
      entity: 'siteContent',
      entityId: key,
      meta: { key },
    });

    revalidateContentKey(key);

    return NextResponse.json({
      key,
      label: entry.label,
      description: entry.description,
      version: doc.version,
      data: doc.data,
      updatedAt: doc.updatedAt?.toISOString?.() ?? null,
      updatedByName: doc.updatedByName || '',
    });
  } catch (err) {
    console.error('[admin content PUT]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
