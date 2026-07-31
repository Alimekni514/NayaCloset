import request from 'supertest';

import { OrderModel } from '../src/models/order.model';
import { ProductModel } from '../src/models/product.model';
import { RefreshSessionModel } from '../src/models/refresh-session.model';
import { UserModel } from '../src/models/user.model';
import {
  clearDatabase,
  connectTestDatabase,
  createAdminSession,
  disconnectTestDatabase,
  getApp,
} from './helpers';

describe('authentication and authorization flows', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('registers a user and prevents duplicate email registration', async () => {
    const response = await request(getApp()).post('/api/auth/register').send({
      firstName: 'Yasmine',
      lastName: 'Client',
      email: 'YASMINE@example.com',
      password: 'Password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('yasmine@example.com');

    const duplicate = await request(getApp()).post('/api/auth/register').send({
      firstName: 'Other',
      lastName: 'User',
      email: 'yasmine@example.com',
      password: 'Password123',
    });

    expect(duplicate.status).toBe(409);
  });

  it('logs in with generic errors and rotates refresh session data', async () => {
    await request(getApp()).post('/api/auth/register').send({
      firstName: 'Nora',
      lastName: 'Client',
      email: 'nora@example.com',
      password: 'Password123',
    });

    const failure = await request(getApp()).post('/api/auth/login').send({
      email: 'nora@example.com',
      password: 'wrong-password',
    });

    expect(failure.status).toBe(401);
    expect(failure.body.message).toBe('Invalid email or password');

    const agent = request.agent(getApp());
    const login = await agent.post('/api/auth/login').send({
      email: 'nora@example.com',
      password: 'Password123',
    });

    expect(login.status).toBe(200);
    expect(login.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('dc_access_token='),
        expect.stringContaining('dc_refresh_token='),
        expect.stringContaining('dc_csrf_token='),
      ]),
    );

    const previousSession = await RefreshSessionModel.findOne().select('+tokenHash').lean();
    const refresh = await agent.post('/api/auth/refresh').send({});

    expect(refresh.status).toBe(200);

    const nextSession = await RefreshSessionModel.findOne().select('+tokenHash').lean();
    expect(nextSession?.tokenHash).not.toBe(previousSession?.tokenHash);
  });

  it('requires csrf token for logout and logout-all', async () => {
    await request(getApp()).post('/api/auth/register').send({
      firstName: 'Lina',
      lastName: 'Client',
      email: 'lina@example.com',
      password: 'Password123',
    });

    const agent = request.agent(getApp());
    const login = await agent.post('/api/auth/login').send({
      email: 'lina@example.com',
      password: 'Password123',
    });
    const csrfCookies = Array.isArray(login.headers['set-cookie']) ? login.headers['set-cookie'] : [];
    const csrfToken = csrfCookies
      .find((cookie: string) => cookie.startsWith('dc_csrf_token='))
      ?.split(';')[0]
      ?.split('=')[1];

    const forbidden = await agent.post('/api/auth/logout').send({});
    expect(forbidden.status).toBe(403);

    const success = await agent.post('/api/auth/logout').set('x-csrf-token', csrfToken ?? '').send({});
    expect(success.status).toBe(200);
  });

  it('enforces rbac on admin routes and approves guest orders atomically', async () => {
    const clientAgent = request.agent(getApp());
    await clientAgent.post('/api/auth/register').send({
      firstName: 'Sara',
      lastName: 'Client',
      email: 'sara@example.com',
      password: 'Password123',
    });
    await clientAgent.post('/api/auth/login').send({
      email: 'sara@example.com',
      password: 'Password123',
    });

    const user = await UserModel.findOne({ email: 'sara@example.com' }).lean();
    const product = await ProductModel.create({
      name: 'Starter Product',
      slug: 'starter-product',
      description: 'A product used in tests',
      priceCents: 1200,
      inventory: 10,
      isActive: true,
    });

    const orderResponse = await clientAgent
      .post('/api/orders/guest')
      .set('Idempotency-Key', 'auth-test-order-1')
      .send({
        items: [{ productId: product._id.toString(), quantity: 2 }],
        delivery: {
          contactLastName: 'Client',
          contactFirstName: 'Sara',
          addressLine1: '12 rue de test',
          governorateId: '11',
          cityId: '1102',
          localityId: '110202',
          postalCode: '2026',
          mobile: '55111222',
          phone: '71222444',
        },
      });
    expect(orderResponse.status).toBe(201);

    const forbiddenAdminRead = await clientAgent.get('/api/admin/orders');
    expect(forbiddenAdminRead.status).toBe(403);

    const { agent: adminAgent } = await createAdminSession();
    const validateResponse = await adminAgent.post(`/api/admin/orders/${orderResponse.body.order.id}/approve`);

    expect(validateResponse.status).toBe(200);
    expect(validateResponse.body.order.status).toBe('ABM_CREATED');

    const order = await OrderModel.findById(orderResponse.body.order.id).lean();
    expect(order?.status).toBe('ABM_CREATED');
    expect(order?.customer?.userId?.toString()).toBe(user?._id.toString());
  });

  it('supports logout all sessions and denies me after logout', async () => {
    await request(getApp()).post('/api/auth/register').send({
      firstName: 'Mina',
      lastName: 'Client',
      email: 'mina@example.com',
      password: 'Password123',
    });

    const agent = request.agent(getApp());
    const login = await agent.post('/api/auth/login').send({
      email: 'mina@example.com',
      password: 'Password123',
    });
    const csrfCookies = Array.isArray(login.headers['set-cookie']) ? login.headers['set-cookie'] : [];
    const csrfToken = csrfCookies
      .find((cookie: string) => cookie.startsWith('dc_csrf_token='))
      ?.split(';')[0]
      ?.split('=')[1];

    const logoutAll = await agent
      .post('/api/auth/logout-all')
      .set('x-csrf-token', csrfToken ?? '')
      .send({});

    expect(logoutAll.status).toBe(200);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});
