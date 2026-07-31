import { createHash, randomBytes } from 'node:crypto';

import argon2 from 'argon2';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { ACCESS_COOKIE_NAME, ACCESS_TOKEN_TTL_SECONDS, CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_SECONDS } from '../constants/auth';
import { buildCookieOptions, buildCsrfCookieOptions } from '../config/cookies';
import { env } from '../config/env';
import { HttpError } from '../lib/http-error';
import { RefreshSessionModel } from '../models/refresh-session.model';
import { UserModel } from '../models/user.model';
import { writeAuditLog } from './audit.service';

type TokenPayload = {
  id: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  sessionId: string;
};

export const hashPassword = async (password: string): Promise<string> =>
  argon2.hash(password, { type: argon2.argon2id });

export const verifyPassword = async (hash: string, password: string): Promise<boolean> =>
  argon2.verify(hash, password);

export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    jwtid: randomBytes(16).toString('hex'),
  });

const generateCsrfToken = (): string => randomBytes(32).toString('hex');

const sanitizeUser = (user: {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
}) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

export const setAuthCookies = ({
  res,
  accessToken,
  refreshToken,
  csrfToken,
}: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}): void => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, buildCookieOptions(ACCESS_TOKEN_TTL_SECONDS * 1000));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildCookieOptions(REFRESH_TOKEN_TTL_SECONDS * 1000));
  res.cookie(CSRF_COOKIE_NAME, csrfToken, buildCsrfCookieOptions(REFRESH_TOKEN_TTL_SECONDS * 1000));
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE_NAME, buildCookieOptions(0));
  res.clearCookie(REFRESH_COOKIE_NAME, buildCookieOptions(0));
  res.clearCookie(CSRF_COOKIE_NAME, buildCsrfCookieOptions(0));
};

export const registerUser = async ({
  firstName,
  lastName,
  email,
  password,
}: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserModel.findOne({ email: normalizedEmail }).lean();

  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT, 'Email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash,
  });

  await writeAuditLog({
    action: 'auth.register',
    entityType: 'User',
    entityId: user._id.toString(),
    actor: { userId: user._id, email: user.email, role: user.role },
  });

  return sanitizeUser(user);
};

export const createSession = async ({
  userId,
  email,
  role,
  isActive,
  userAgent,
  ipAddress,
  res,
}: {
  userId: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  res: Response;
}) => {
  const session = await RefreshSessionModel.create({
    userId,
    tokenHash: 'pending',
      ...(userAgent ? { userAgent } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  const payload: TokenPayload = {
    id: userId,
    email,
    role,
    isActive,
    sessionId: session._id.toString(),
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const csrfToken = generateCsrfToken();

  session.tokenHash = hashRefreshToken(refreshToken);
  await session.save();

  setAuthCookies({ res, accessToken, refreshToken, csrfToken });
};

export const authenticateUser = async ({
  email,
  password,
  userAgent,
  ipAddress,
  res,
}: {
  email: string;
  password: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  res: Response;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user || !user.isActive) {
    await writeAuditLog({
      action: 'auth.login.failed',
      entityType: 'User',
      entityId: normalizedEmail,
      actor: { email: normalizedEmail },
    });
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const passwordIsValid = await verifyPassword(user.passwordHash, password);

  if (!passwordIsValid) {
    await writeAuditLog({
      action: 'auth.login.failed',
      entityType: 'User',
      entityId: user._id.toString(),
      actor: { userId: user._id, email: user.email, role: user.role },
    });
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  await createSession({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    userAgent,
    ipAddress,
    res,
  });

  await writeAuditLog({
    action: 'auth.login.success',
    entityType: 'User',
    entityId: user._id.toString(),
    actor: { userId: user._id, email: user.email, role: user.role },
  });

  return sanitizeUser(user);
};

export const refreshSession = async ({
  refreshToken,
  userAgent,
  ipAddress,
  res,
}: {
  refreshToken: string;
  userAgent: string | undefined;
  ipAddress: string | undefined;
  res: Response;
}) => {
  let payload: TokenPayload & { type: 'refresh' };

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload & { type: 'refresh' };
  } catch {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid session');
  }

  const session = await RefreshSessionModel.findById(payload.sessionId).select('+tokenHash');

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    session.tokenHash !== hashRefreshToken(refreshToken)
  ) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid session');
  }

  const user = await UserModel.findById(payload.id).lean();

  if (!user || !user.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid session');
  }

  const nextPayload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    sessionId: session._id.toString(),
  };
  const nextAccessToken = signAccessToken(nextPayload);
  const nextRefreshToken = signRefreshToken(nextPayload);
  const csrfToken = generateCsrfToken();

  session.tokenHash = hashRefreshToken(nextRefreshToken);
  session.userAgent = userAgent ?? null;
  session.ipAddress = ipAddress ?? null;
  session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  await session.save();

  setAuthCookies({
    res,
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    csrfToken,
  });

  await writeAuditLog({
    action: 'auth.refresh',
    entityType: 'RefreshSession',
    entityId: session._id.toString(),
    actor: { userId: user._id, email: user.email, role: user.role },
  });

  return sanitizeUser(user);
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  await RefreshSessionModel.findByIdAndUpdate(sessionId, { revokedAt: new Date() });
};

export const revokeAllSessions = async (userId: string): Promise<void> => {
  await RefreshSessionModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
};
