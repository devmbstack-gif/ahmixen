import { connectToDatabase } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';

export async function logAudit(input: {
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      adminId: input.adminId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta ?? {},
    });
  } catch (err) {
    console.error('[audit]', err instanceof Error ? err.message : 'failed');
  }
}
