import type { InferSchemaType } from 'mongoose';
import { Schema, Types, model } from 'mongoose';

const refreshSessionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    userAgent: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

refreshSessionSchema.index({ userId: 1, createdAt: -1 });

export type RefreshSessionDocument = InferSchemaType<typeof refreshSessionSchema>;
export const RefreshSessionModel = model('RefreshSession', refreshSessionSchema);
