# ABM Position Creation Debug Report

## Root Cause

The failing Dar Souk ABM submission was not wire-equivalent to the successful Postman request.

The exact backend-side wire differences identified were:

1. `RTRN` and `POS_ALLOW_OPEN` were serialized as `true` / `false` instead of canonical `0` / `1`.
2. The request body was built from a generic object rather than an explicit ordered field list, so wire-level ordering and one-occurrence guarantees were not enforced.
3. The ABM submit request headers did not explicitly match the successful form-style request:
   - missing `charset=UTF-8` on `Content-Type`
   - missing explicit `Accept: */*`
   - missing `X-Requested-With: XMLHttpRequest`
   - missing `Referer: <ABM_BASE_URL>/cPosition/position_add`
   - missing `Origin: <ABM_BASE_URL>`
4. The sender did not produce a safe wire-level diagnostic proving:
   - exact field order
   - missing vs extra fields
   - duplicate fields
   - antiforgery cookie + request token pairing
   - first ABM response category before redirects

Also confirmed:

- `select_enl` and `select_liv` were removed from the final submit and are no longer sent.
- All canonical ABM field names are now sent exactly once in the expected order.
- Empty optional fields remain present as empty strings.

## Wire-Level Difference Found

The successful Postman request uses these canonical ABM body conventions:

- `application/x-www-form-urlencoded; charset=UTF-8`
- exact canonical field names
- ordered append semantics
- `RTRN=0|1`
- `POS_ALLOW_OPEN=0|1`
- ABM session cookie and antiforgery cookie from the same authenticated jar
- a fresh `__RequestVerificationToken` from `/cPosition/position_add`

The previous Express sender diverged at the serialized body level and at the request-header level.

## Issue Classification

- field mapping: fixed
- serialization: fixed
- missing empty fields: fixed
- duplicate fields: guarded against
- content type: fixed
- antiforgery cookie pairing: instrumented and verified in automated tests
- session mismatch: guarded and classified
- redirects: first response now inspected explicitly with `maxRedirects: 0`
- headers: fixed

## Files Changed

- `apps/api/src/modules/abm/abm.errors.ts`
- `apps/api/src/modules/abm/abm.http-client.ts`
- `apps/api/src/modules/abm/abm.session-manager.ts`
- `apps/api/src/modules/abm/positions/abm-position.mapper.ts`
- `apps/api/src/modules/abm/positions/abm-position.service.ts`
- `apps/api/tests/abm.integration.test.ts`
- `apps/web/src/features/admin/abm-position-create/components/PositionWizard.tsx`

## Tests Added / Strengthened

The ABM integration test coverage now verifies:

- exact field order via `ABM_POSITION_FIELD_ORDER`
- exact field count
- one occurrence per field
- no `select_enl`
- no `select_liv`
- booleans serialized as `0` / `1`
- empty optional fields still present
- explicit request headers for ABM submit
- same jar carries both:
  - `.AspNet.ApplicationCookie`
  - the antiforgery cookie from `/cPosition/position_add`

## Commands Run

```powershell
npm run test --workspace @delivery-commerce/api -- abm.integration
npm run typecheck --workspace @delivery-commerce/api
npm run typecheck --workspace @delivery-commerce/web
```

## Automated Results

- `abm.integration` passed
- API typecheck passed
- Web typecheck passed

## Live Controlled Verification

One controlled live verification was performed.

Submission reference:

- `DARSOUK-LIVE-TEST-1785327322554`

Safe live result:

- HTTP status: `502`
- response category: `login_failed_before_submit`
- success: `false`
- created position ID: none
- field count: not reached
- missing count: not reached
- duplicate count: not reached
- cookie pair present: not reached
- request duration: `3564 ms`
- retry count: `0`

The live request did **not** reach ABM `validate_add`.
It failed earlier with:

- backend error code: `ABM_LOGIN_FAILED`

That means the unique live verification was blocked by ABM login/session acquisition before the position submit could be exercised end-to-end.

## Safe Response Details From The Live Attempt

- first platform HTTP status: `502`
- upstream classification: `ABM_LOGIN_FAILED`
- redirect: not applicable
- login page during submit: not reached
- server 500 during submit: not reached in the live verification

## What Was Proven

Before the live ABM login failure, the backend sender itself was corrected to match the successful Postman request shape:

- canonical field names
- canonical field order
- no frontend-only fields
- string serialization for every value
- booleans as `0` / `1`
- explicit form-urlencoded body string
- explicit ABM form headers
- safe pre-submit diagnostics

## Remaining Risks

1. ABM login/session establishment is intermittent and can fail before `/cPosition/position_add` or `/cPosition/validate_add`.
2. Because the only controlled live verification failed at `ABM_LOGIN_FAILED`, the fully corrected sender has not yet been confirmed with a live `success__<positionId>` response.
3. A previously observed ABM HTML `500 - Internal server error` during submit may still require one more controlled live verification once ABM login is stable.

## Current Outcome

The backend sender mismatch with Postman was fixed, but live success cannot be claimed because ABM did not return `success__<positionId>` during the single allowed live verification.
