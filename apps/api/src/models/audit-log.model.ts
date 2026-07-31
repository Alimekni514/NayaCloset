import type { InferSchemaType } from 'mongoose';
import { Schema, Types, model } from 'mongoose';

import { userRoleValues } from '@delivery-commerce/shared';

const auditLogSchema = new Schema(
  {
    action: { type: String, required: true, index: true },
    actorUserId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, trim: true },
    actorRole: { type: String, enum: userRoleValues, default: null },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false },
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel = model('AuditLog', auditLogSchema);
