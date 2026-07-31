# ABM Position Detail

## Architecture

The Dar Souk admin detail page is implemented as a protected full-stack feature:

- Frontend route: `/admin/positions/$positionId`
- Backend API: `GET /api/admin/abm/positions/:positionId`
- Upstream ABM page: `GET /cPosition/position_details/{POSID}`

The browser never talks directly to `client.abm-delivery.com`. React calls the Dar Souk API only, and the API reuses the existing process-wide ABM session manager and CookieJar.

## Route And ID Rules

- The route always uses the raw normalized `POSID`
- Example:
  - POSID: `469384`
  - barcode: `414000469384`
  - route: `/admin/positions/469384`
- `positionId` is validated as a numeric string with a reasonable length limit

## HTML Parsing Strategy

The ABM detail page is server-rendered HTML. The API parses it with Cheerio and returns normalized JSON validated by Zod.

Primary extraction signals:

- Heading text `Position numero {barcode}`
- Print anchors:
  - `/cPosition/etiquette_colis/{POSID}`
  - `/cPosition/etiquette_colis_zebra/{POSID}`
- Timeline in `ul.list-unstyled.timeline.widget`
- Route/state blocks in `ul.list-unstyled.timeline`
- Shipment tables for type, weight, service, pieces and dimensions

The parser keeps `barcode` and `POSID` distinct.

## Normalized Contract

Shared schema:

- `packages/shared/src/admin/abm-position-detail.ts`

It exports:

- `abmPositionDetailSchema`
- `abmPositionDetailResponseSchema`
- `abmPositionDetailParamsSchema`
- inferred TypeScript types
- centralized status category mapping
- centralized progress-stage mapping

## Date And Time Handling

ABM detail dates are parsed from `DD/MM/YYYY HH:mm:ss`.

Policy:

- parse as Tunisia local time
- convert to ISO for transport
- render in the frontend using `Africa/Tunis`

This avoids silently treating ABM timestamps as UTC.

## Timeline Parsing

The API preserves ABM order as displayed:

- newest first
- first event marked `isCurrent: true`

Each event includes:

- generated stable `id`
- exact ABM `label`
- parsed `occurredAt`
- `isCurrent`

## Status And Progress Mapping

Status category is derived from ABM wording with accent-insensitive matching.

Categories:

- `created`
- `progress`
- `delivered`
- `anomaly`
- `return`
- `cancelled`
- `neutral`

Progress stages:

- `pickup`
- `delivery`
- `delivered`

The exact ABM label is always preserved separately in `status.label`.

## Printing Strategy

Protected same-origin endpoints exist:

- `GET /api/admin/abm/positions/:positionId/label/normal`
- `GET /api/admin/abm/positions/:positionId/label/zebra`

Official upstream routes:

- `GET /cPosition/etiquette_colis/{POSID}`
- `GET /cPosition/etiquette_colis_zebra/{POSID}`

The route parameter is always the raw ABM `POSID`, never the barcode.

Live inspection on Wednesday, July 29, 2026 showed:

- normal label content type: `text/html; charset=utf-8`
- Zebra label content type: `text/html; charset=utf-8`

Dar Souk now handles these responses with a hardened proxy strategy:

- the browser never calls `client.abm-delivery.com`
- the backend reuses the shared ABM session manager and CookieJar
- labels are fetched with `responseType: "arraybuffer"`
- ABM login HTML is detected server-side and retried once by the shared session manager
- only allowlisted formats are served back:
  - `application/pdf`
  - `image/png`
  - `image/jpeg`
  - `image/webp`
  - `text/html; charset=utf-8`
  - `text/plain` for Zebra downloads
- unexpected or empty responses are rejected with safe `502` errors

### HTML proxy hardening

When ABM returns printable HTML:

- Dar Souk does not inject it into the React DOM
- the backend strips scripts, forms, iframe/object/embed elements and inline event handlers
- anchors are downgraded to inert spans
- the response is served as a same-origin isolated document
- the response includes:
  - `Cache-Control: private, no-store`
  - `Pragma: no-cache`
  - `X-Content-Type-Options: nosniff`
  - restrictive `Content-Security-Policy`

### Frontend print flow

The admin detail page now enables:

- `Etiquette normale`
- `Etiquette Zebra`

The frontend flow is:

1. fetch the protected Dar Souk endpoint through the existing Axios client with credentials
2. receive a `Blob`
3. create a temporary object URL
4. open PDF, image, or HTML labels in a new tab
5. download Zebra text labels as `.zpl`
6. revoke the object URL after use

No ABM cookie, ABM URL, or raw ABM session detail is exposed to React.

## Security

- Dar Souk auth and RBAC remain authoritative
- `ADMIN` and `SUPER_ADMIN` only
- same ABM session manager reused
- one ABM reauthentication retry via the shared session manager
- no ABM cookies, CSRF tokens, or credentials exposed
- no direct browser calls to ABM
- no public caching on print responses
- no arbitrary upstream headers are forwarded

## Tests

Backend integration tests cover:

- RBAC
- numeric `POSID` validation
- exact upstream detail path
- timeline parsing
- current event detection
- status parsing
- departure and destination parsing
- localized numeric parsing
- dimensions parsing
- label HTML sanitization
- label no-store and CSP headers
- Zebra `.zpl` download handling
- unsupported label format rejection
- login HTML retry

Frontend tests cover:

- query key generation with raw `POSID`
- route ID validation helper
- summary cards
- timeline rendering
- current-event highlighting
- progress rendering
- route card
- metadata card
- recipient fallbacks
- popup creation for printable labels
- Blob URL creation and revocation
- Zebra download handling
- popup blocked protection

## Live Verification

Read-only live verification was performed on Wednesday, July 29, 2026.

Verified with real position:

- POSID: `469384`
- barcode: `414000469384`
- Dar Souk detail API: `200`
- upstream detail page: `GET /cPosition/position_details/469384`
- parsed timeline count: `7`
- current status: `Livraison planifiee en cours de tournee`
- print labels classified live:
  - normal: `text/html; charset=utf-8`
  - zebra: `text/html; charset=utf-8`
- no browser call is required to `client.abm-delivery.com`
- no ABM cookie is exposed to the browser

## Missing Fields And Limitations

ABM detail HTML does not always expose:

- recipient email
- recipient phone
- full postal breakdown
- COD amount
- payment mode
- reference
- declared value
- exchange state
- allow-open state

When the detail page is opened from the positions list, the frontend safely supplements non-conflicting values from the cached normalized list item. Direct opens still work without that cache.

Current limitation:

- same-origin printable HTML is sanitized conservatively, so ABM-only interactive controls are intentionally removed

## Next Step

The next logical extension is secure modification of positions with `EVENTID === 1`.
