import type { AuditActor } from '../types/express';

import { AuditLogModel } from '../models/audit-log.model';

export const writeAuditLog = async ({
  action,
  actor,
  entityType,
  entityId,
  metadata,
}: {
  action: string;
  actor?: AuditActor;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  await AuditLogModel.create({
    action,
    actorUserId: actor?.userId,
    actorEmail: actor?.email,
    actorRole: actor?.role,
    entityType,
    entityId,
    metadata,
  });
};
