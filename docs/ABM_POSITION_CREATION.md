# ABM Position Creation

## Overview

This feature adds the Dar Souk admin flow for `Mes positions > Nouvelle position > Creation normale`.

Route:

- `/admin/positions/nouvelle`

The browser only talks to the Dar Souk API. The Express backend is the only layer that communicates with ABM.

## Architecture

- Frontend:
  - TanStack Router admin route in `apps/web/src/routes/admin.positions.nouvelle.tsx`
  - Feature code in `apps/web/src/features/admin/abm-position-create/`
  - React Hook Form + Zod wizard with draft persistence in `sessionStorage`
- Backend:
  - ABM endpoints in `apps/api/src/modules/abm/positions/`
  - Reuses the existing ABM session manager and cookie jar
  - Parses protected ABM HTML with Cheerio
- Shared contracts:
  - `packages/shared/src/admin/abm-position-create.ts`

## Backend Endpoints

Protected admin endpoints:

- `GET /api/admin/abm/positions/form-options`
- `GET /api/admin/abm/positions/addresses/pickup/:id`
- `GET /api/admin/abm/positions/addresses/delivery/:id`
- `GET /api/admin/abm/locations/governorates`
- `GET /api/admin/abm/locations/cities?governorateId=<id>`
- `GET /api/admin/abm/locations/localities?cityId=<id>`
- `GET /api/admin/abm/locations/postal-code?localityId=<id>`
- `POST /api/admin/abm/positions`

Allowed roles:

- `ADMIN`
- `SUPER_ADMIN`

## ABM Integration

Protected ABM page:

- `GET /cPosition/position_add`

Helper endpoints:

- `POST /cPosition/getlocn1`
- `POST /cPosition/getlocn2`
- `POST /cPosition/getlocn3`
- `POST /cPosition/getCP`
- `POST /cPosition/get_details_adrENL`
- `POST /cPosition/get_details_adrliv`

Final submission:

- `POST /cPosition/validate_add?Length=9`

All helper and submission requests use `application/x-www-form-urlencoded`.

## Wizard Steps

1. `Enlevement`
2. `Livraison`
3. `Colis`
4. `Service`

The frontend keeps one form instance across all steps and only submits during the final confirmation flow.

## Address Book Behavior

- Pickup addresses come from the protected ABM page.
- If a pickup label contains `Naya Store` case-insensitively, that option is preselected.
- If the selected ABM address details are modified, the UI keeps the original address-book selection and shows `Adresse personnalisee`.

## Cascading Location Fields

Hierarchy:

1. Governorate
2. City
3. Locality
4. Postal code

Behavior:

- changing the governorate clears city, locality, and postal code
- changing the city clears locality and postal code
- selecting a locality fetches and fills the postal code

## Hidden Defaults and Mapping

The backend keeps ABM-only defaults out of the browser payload where possible and injects them during submission:

- `POSITION_TIME_LIV_DISPO_FROM=10:00`
- `POSITION_TIME_LIV_DISPO_TO=14:00`
- `MODCOLISID`
- `TYPEMARCHANDISE`
- `LONGEUR`
- `HAUTEUR`
- `LARGEUR`
- `VOLUME`

The normalized request is mapped to ABM form fields in:

- `apps/api/src/modules/abm/positions/abm-position.mapper.ts`

## Response Handling

Success:

- ABM `success__<positionId>`
- normalized to `{ position: { id }, message }`

Known failure:

- `COD_INVALIDE`
- mapped to `422 ABM_INVALID_COD_AMOUNT`

Unknown failures are mapped to a safe backend error without exposing raw ABM HTML.

## Security

- no ABM credentials in React
- no ABM cookies returned to React
- no ABM CSRF token returned to React
- all position endpoints protected with app auth + RBAC
- ABM session remains backend-only
- request/response parsing validated with Zod

## Tests

Backend coverage:

- protected form parsing
- Naya Store preselection
- location helper mapping
- address detail mapping
- normalized submission mapping
- safe ABM error mapping

Frontend coverage:

- safe configuration error rendering
- Naya Store preselection and pickup auto-fill bootstrap

## Manual Verification

1. Log in as `ADMIN` or `SUPER_ADMIN`.
2. Open `/admin/positions/nouvelle`.
3. Confirm the pickup address preselects `Naya Store` when available.
4. Complete the four steps.
5. Confirm the review dialog appears before submission.
6. Submit and verify the returned ABM position ID is shown in the success panel.

## Current Limitations

- `Creation simple` and `Liste des positions` are placeholders.
- The wizard currently uses select-based cascading fields rather than a richer combobox implementation.
- There is no final position detail page yet; success stays on the in-place success panel.

## Next

- add the ABM position list
- add the ABM position detail view
- connect order data prefill for delivery details
