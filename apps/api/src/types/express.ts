import type { UserRole } from '@delivery-commerce/shared';
import type { Types } from 'mongoose';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  sessionId?: string;
};

export type AuditActor = {
  userId?: Types.ObjectId;
  email?: string;
  role?: UserRole;
};
