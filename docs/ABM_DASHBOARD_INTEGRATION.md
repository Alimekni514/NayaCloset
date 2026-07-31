# ABM Dashboard Integration

## 1. Overview
The ABM dashboard integration exposes a backend-only admin endpoint at `GET /api/admin/abm/dashboard` and renders the normalized result in the Dar Souk admin dashboard at `/admin`.

## 2. Architecture diagram in text
`Admin browser` -> `Dar Souk web /admin` -> `Dar Souk API /api/admin/abm/dashboard` -> `ABM session manager` -> `ABM login + dashboard endpoints`

`Dar Souk MongoDB` stores Dar Souk users, refresh sessions, orders, and audit data.

ABM cookies never leave the API process.

## 3. Dar Souk admin authentication and RBAC
- Dar Souk authentication uses HTTP-only access and refresh token cookies.
- `/api/admin/abm/dashboard` is protected by `requireAuth` and `requireRole('ADMIN', 'SUPER_ADMIN')`.
- Unauthenticated requests receive `401`.
- Authenticated `CLIENT` users receive `403`.
- `ADMIN` and `SUPER_ADMIN` users are allowed.

## 4. Backend-only ABM integration
The frontend never talks to ABM directly. The API owns the ABM credentials, login flow, cookie jar, session reuse, retry behavior, validation, and normalization.

## 5. ABM login flow
1. Fetch `GET /Authentification/Login`.
2. Extract `__RequestVerificationToken`.
3. Submit `POST /Authentification/Login`.
4. Reuse the resulting `.AspNet.ApplicationCookie` for protected ABM requests.

## 6. CSRF extraction
The session manager parses `input[name="__RequestVerificationToken"]` from the ABM login HTML before submitting credentials.

## 7. URL-encoded login body
The login request uses `application/x-www-form-urlencoded` with:
- `__RequestVerificationToken`
- `UserName`
- `password`

## 8. Recognized ABM login states
Successful responses:
- `success_client`
- `success_admin`
- `success_principal`
- `account_spe`

Mapped failures:
- `bloque` -> `ABM_ACCOUNT_BLOCKED`
- `type_usr` -> `ABM_ACCOUNT_TYPE_UNSUPPORTED`
- other unexpected failures -> `ABM_LOGIN_FAILED`

## 9. Cookie-jar session handling
The API uses one dedicated Axios client plus an in-memory `tough-cookie` jar for the ABM origin. ABM cookies are reused across requests inside the API process.

## 10. .AspNet.ApplicationCookie verification
Login success is only accepted when the ABM response also yields `.AspNet.ApplicationCookie`.

## 11. Concurrent login protection
The session manager shares one in-flight login promise so concurrent requests do not trigger multiple ABM logins.

## 12. Session expiration detection
Protected ABM responses are treated as expired when ABM returns login HTML, including HTTP 200 responses that render the login page again.

## 13. One-retry policy
When a protected request resolves to login HTML, the API reauthenticates once and retries once. Infinite retry loops are not allowed.

## 14. GET /api/admin/abm/dashboard
Route:
- `GET /api/admin/abm/dashboard`

Optional query:
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

Response:
- `{ dashboard: AbmDashboardResponse }`

## 15. Date query validation
The route validates:
- valid ISO date strings
- complete range pairs
- `from <= to`

Invalid queries return the standard Dar Souk error envelope with `400`.

## 16. External payload validation
Raw ABM payloads are validated before mapping. Malformed responses are rejected as safe ABM errors instead of being passed through to the client.

## 17. Normalized response contract
Shared contract lives in `packages/shared/src/admin/abm-dashboard.ts` and exports:
- `abmDashboardQuerySchema`
- `abmDashboardResponseSchema`
- related inferred TypeScript types

The frontend consumes only the normalized Dar Souk contract.

## 18. Event IDs and display ordering
Totals:
- `-1` -> positions
- `-2` -> returns
- `-3` -> exchanges

Expected display groups:
- `POSITION`: 9 cards
- `RETOUR`: 4 cards
- `ECHANGE`: 4 cards

Missing expected events render as zero. Unknown positive event IDs are preserved and appended neutrally.

## 19. Frontend query behavior
- TanStack Query key includes `from` and `to`.
- Existing data is retained during background refresh with `keepPreviousData`.
- Manual refresh calls `refetch()`.
- Filtered requests send `from` and `to` only when both are present.

## 20. Loading and error behavior
- Admin guard shows a full-page loading state while current-user status resolves.
- Dashboard shows skeletons on initial load.
- Error panels use safe messages and do not expose backend details.
- A `503` ABM configuration error is mapped to a friendly configuration message.

## 21. Environment variables
`apps/api/.env.example` contains empty placeholders only:

```env
ABM_BASE_URL=https://client.abm-delivery.com
ABM_USERNAME=
ABM_PASSWORD=
ABM_REQUEST_TIMEOUT_MS=15000
```

ABM credentials are validated at startup by the repository config system, but empty ABM credentials are tolerated in test mode and in local startup until an ABM request is attempted.

## 22. Sensitive-data redaction
Logs redact:
- cookies
- authorization headers
- password fields
- password hashes
- response `set-cookie` headers

ABM credentials, CSRF values, and cookie values are never logged.

## 23. Automated test strategy
Backend:
- mocked ABM HTTP server
- auth integration tests
- RBAC route coverage
- query validation coverage
- session reuse and retry coverage

Frontend:
- admin guard tests
- safe redirect helper tests
- dashboard rendering and filter tests

## 24. Manual live verification
Recommended manual verification:
1. Set real ABM credentials locally.
2. Log in as an `ADMIN` or `SUPER_ADMIN`.
3. Open `/admin`.
4. Confirm totals, grouped cards, filters, and refresh.
5. Confirm customer accounts are redirected away from `/admin`.

## 25. Known limitations
- ABM integration is read-only in this phase.
- No shipment creation or other ABM mutations are implemented yet.
- The production web bundle currently emits a chunk-size warning because the main client chunk exceeds 500 kB after minification.
- This workspace does not contain a `.git` directory, so git diff inspection was not available during stabilization.

## 26. Next implementation step
The next safe step is ABM shipment creation from validated admin orders, using the same backend-only session manager and the same shared normalization/validation approach.
