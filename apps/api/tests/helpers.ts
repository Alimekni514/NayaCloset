import type { Express } from 'express';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { app } from '../src/app';
import { disconnectFromDatabase } from '../src/db/connect';
import { UserModel } from '../src/models/user.model';
import { hashPassword } from '../src/services/auth.service';

let mongoServer: MongoMemoryServer | undefined;

export const getApp = (): Express => app;

export const connectTestDatabase = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const { connectToDatabase } = await import('../src/db/connect');
  await connectToDatabase(mongoServer.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await disconnectFromDatabase();
  await mongoServer?.stop();
};

export const clearDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
};

export const createAdminSession = async () => {
  const passwordHash = await hashPassword('AdminPass123');
  await UserModel.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    passwordHash,
    role: 'ADMIN',
  });

  const agent = request.agent(getApp());
  const loginResponse = await agent.post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'AdminPass123',
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to create admin session: received ${loginResponse.status}`);
  }

  const setCookies = Array.isArray(loginResponse.headers['set-cookie'])
    ? loginResponse.headers['set-cookie']
    : [];
  const csrfCookie = setCookies
    ?.find((cookie: string) => cookie.startsWith('dc_csrf_token='))
    ?.split(';')[0]
    ?.split('=')[1];

  return { agent, csrfToken: csrfCookie };
};
