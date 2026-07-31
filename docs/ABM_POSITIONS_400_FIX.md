# ABM Positions 400 Fix

## Root cause

The remaining `400 Bad Request` was caused by contract drift around the ABM positions list flow:

- the backend route had already moved to a `from` / `to` only contract in TypeScript
- the frontend still had stale generated `src/*.js` artifacts that represented the older list contract
- those stale artifacts included extra list params in runtime query keys and page logic
- the positions page source also still referenced old response fields that no longer exist

There was also a separate regression in the ABM session manager:

- `getDashboardPayload()` started returning the full protected response object instead of the raw string body after `requestProtectedText()` was expanded
- that broke dashboard parsing and related tests

## Validation issue

The corrected backend query schema accepts only:

- `from`
- `to`

It rejects:

- only `from`
- only `to`
- invalid ISO dates
- `from > to`

The validation middleware no longer mutates `req.query`. It stores parsed query data in `res.locals.validatedQuery`, which is what the controller uses.

## Previous query schema behavior

The active TypeScript contract was already date-only, but stale frontend artifacts and stale page logic still behaved as if backend-supported list params included:

- `search`
- `status`
- `service`
- `governorate`
- `sortBy`
- `sortDirection`
- `page`
- `pageSize`

That is no longer allowed for the backend request.

## Corrected query schema

React now requests only:

- `GET /api/admin/abm/positions?from=YYYY-MM-DD&to=YYYY-MM-DD`

Express validates only:

- `from`
- `to`

Express maps upstream to:

- `GET /cPosition?datestart=YYYY-MM-DD&dateend=YYYY-MM-DD`

## Backend request handling

The ABM positions list service now:

- uses the shared process-wide `AbmSessionManager`
- uses the existing CookieJar-backed client
- sends `X-Requested-With: XMLHttpRequest`
- sends the ABM referer header for `/cPosition`
- validates the upstream payload as a JSON array
- normalizes the full array without backend filtering or pagination

Safe development diagnostics retained in non-production:

- route
- received query
- validation success
- controller reached
- service reached
- upstream request started
- session reused
- application cookie present
- upstream path
- upstream status
- upstream content type
- response category

No cookie values, credentials, CSRF tokens, or authorization headers are logged.

## Frontend behavior after fix

The positions page now:

- fetches with `useAbmPositions({ from, to })` only
- keeps search, status, service, governorate, sorting, and pagination fully local
- computes summary locally from the normalized rows
- paginates locally

Stale runtime artifacts removed:

- `apps/web/src/routes/admin.positions.index.js`
- `apps/web/src/features/admin/abm-positions-list/hooks/use-abm-positions.js`
- `apps/web/src/features/admin/abm-positions-list/api/abm-positions-api.js`
- `apps/web/src/features/admin/abm-positions-list/index.js`

## Browser request URL

Expected browser request:

- `GET http://localhost:4000/api/admin/abm/positions?from=2026-07-29&to=2026-07-29`

## Upstream ABM request URL

Expected upstream request:

- `GET https://client.abm-delivery.com/cPosition?datestart=2026-07-29&dateend=2026-07-29`

## Cookie jar status

Integration coverage confirms the shared ABM session manager and cookie jar are used for the positions list route. The live cookie value is never exposed or logged.

## Upstream response validation

The positions service now accepts only:

- JSON array payloads

It rejects:

- login HTML
- malformed JSON
- non-array JSON

## Files changed

- `apps/api/src/modules/abm/abm.session-manager.ts`
- `apps/api/tests/abm.integration.test.ts`
- `apps/api/tests/abm-position-list.service.test.ts`
- `apps/web/src/routes/admin.positions.index.tsx`
- `apps/web/src/features/admin/abm-positions-list/components/PositionsSummary.tsx`
- `apps/web/src/routes/admin-positions-list.test.tsx`
- `docs/ABM_POSITIONS_400_FIX.md`

## Tests run

On July 29, 2026:

- `npm run test --workspace @delivery-commerce/api -- abm.integration.test.ts abm-position-list.service.test.ts`
- `npm run test --workspace @delivery-commerce/web -- admin-positions-list.test.tsx`

Results:

- API: 19/19 passed
- Web: 5/5 passed

## Final live result

Not yet confirmed from a live browser session in this environment.

Because network and live browser verification are restricted here, I am not claiming final live success yet. The current verified state is:

- backend integration test for `GET /api/admin/abm/positions` returns `200`
- validated query reaches the controller and service
- upstream ABM list request is formed correctly in tests
- frontend query key and local-processing behavior are covered by focused tests

## Real positions rendered

Live ABM row count is not yet confirmed in this environment.

Integration normalization test currently renders 3 mocked ABM rows successfully.
