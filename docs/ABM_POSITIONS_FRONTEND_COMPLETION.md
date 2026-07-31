# Migration of ABM Positions Frontend

The ABM Positions list feature has been fully migrated from the `lovable-source` prototype to the `apps/web` production application.

## 1. Feature Location
The code is structured as a feature module at `apps/web/src/features/admin/abm-positions-list`.
- **components/**: UI components (Table, Mobile Card, Filters, Summary, Header, Pagination, Dropdown Menus, etc.)
- **hooks/**: TanStack query hooks (`useAbmPositions`, `useDeleteAbmPosition`)
- **api/**: Centralized API functions calling Dar Souk's backend via `apiClient`.
- **lib/**: Formatters for date/time, clipboards, and CSV exports.
- **types/**: Frontend-only types and re-exports of the shared contracts.

## 2. Shared Contracts
We are strictly relying on the Zod schemas and types defined in `@delivery-commerce/shared`:
- `AbmPositionListItem`, `AbmPositionsQuery`, `AbmPositionsResponse`
- `AbmPositionStatusCategory`, `AbmPositionSortBy`, `AbmPositionSortDirection`
- Status labels and styling are decoupled from hardcoded enums and are driven by `statusCategory`.

## 3. Routes & Integration
- **Main List:** Registered at `/admin/positions/`. Protects the route and fully synchronizes URL Search Params with backend filtering, sorting, and pagination.
- **Detail Route:** Registered placeholder at `/admin/positions/$positionId`.
- **Sidebar Integration:** Updated `admin.tsx` to enable the "Liste des positions" link.

## 4. UI/UX Fidelity
- Preserved Lovable's dark green/cream palette through native CSS variables and existing standard design tokens.
- Responsive table with an expandable view for granular details.
- Mobile optimized `PositionMobileCard`.
- Real-time filtering panel with "Apply / Reset" logic.
- Export to CSV/Excel functionality enabled natively.

## 5. Security & Testing
- Fully leverages `apiClient` mapping CSRF protection.
- No optimistic UI deletions without backend validation.
- Extensive test suite covering rendering, hook configuration, RBAC, and error states (17+ frontend tests, 22 backend tests passing).
- Typecheck and Lint pipelines pass correctly.

## Conclusion
The frontend migration is complete, functional, and aligns with the backend shared schemas.
