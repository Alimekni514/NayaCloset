# delivery-commerce

Production-oriented MERN monorepo foundation with TypeScript everywhere, npm workspaces, a React storefront/admin shell, and an Express API with secure cookie-based authentication.

## Repository structure

```text
delivery-commerce/
  apps/
    api/        Express + MongoDB + auth + tests
    web/        React + Vite + Tailwind + route guards
  packages/
    shared/     Shared Zod schemas, enums, and DTO types
```

## Tech stack

- `apps/web`: React, Vite, React Router, TanStack Query, Axios, Tailwind CSS, React Hook Form, Zod
- `apps/api`: Express, Mongoose, Zod, Helmet, CORS, cookie-parser, express-rate-limit, Pino
- `packages/shared`: shared request/response schemas and cross-app TypeScript types
- Tooling: strict TypeScript, ESLint, Prettier, Vitest, Supertest

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy environment files and fill in real secrets:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Start MongoDB locally, or point `MONGODB_URI` to your database.

4. Run the apps:

```bash
npm run dev:api
npm run dev:web
```

Or run both together:

```bash
npm run dev
```

## Scripts

- `npm run dev` runs frontend and backend in parallel
- `npm run dev:api` runs the Express API
- `npm run dev:web` runs the Vite frontend
- `npm run build` builds all workspaces
- `npm run lint` runs ESLint across workspaces
- `npm run typecheck` runs TypeScript checks across workspaces
- `npm run test` runs workspace tests

## Security foundation included

- HTTP-only access and refresh token cookies
- 10 minute access token TTL
- 7 day refresh token TTL
- refresh token rotation with hashed session storage
- CSRF double-submit cookie pattern
- generic login errors
- active/inactive account check
- auth audit logging
- explicit CORS origin
- request validation for body, params, and query
- Mongo query sanitization
- authentication route rate limiting
- request IDs and log redaction

## API routes included

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/orders`
- `GET /api/orders/me`
- `GET /api/orders/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/reject`
- `POST /api/admin/orders/:id/validate`
- `GET /api/health`

## Testing

API integration tests use `Vitest`, `Supertest`, and `mongodb-memory-server`.

```bash
npm run test --workspace @delivery-commerce/api
```

Current tests cover:

- registration
- duplicate email prevention
- login success and failure
- refresh token rotation
- logout
- logout-all
- CSRF enforcement
- RBAC for admin routes
- admin order validation

## Notes

- No secrets are committed; only example environment files are included.
- Admin order validation currently changes the order status to `VALIDATED` and writes an audit log only.
- ABM networking is intentionally not implemented yet.
