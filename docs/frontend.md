# Frontend structure

Public landing: vanilla JS (`frontend/index.html`, `frontend/landing/`). Everything under `/app` is the React app.

| Route | Status |
|---|---|
| `/app/livemap` | Built (L2). Full-screen, public, lazy-loaded. |
| `/app/signin`, `/app/register` | Built. Session auth + CSRF against `/api/v1/auth/`. |
| `/app/management` | Protected (sign-in required). Overview and Team are wired to the API. Facilities, Data imports, Indicators and Programmes are structured pages marked "In development". |
| `/app/medconnect`, `/app/education` | COMING SOON. Deliberately non-functional: no forms, links to data, or sign-ups. |
| `/app/methodology` | Short factual page. |
| `/app/privacy`, `/app/terms` | Draft placeholders, pending legal review. Do not launch with these. |

## Layout of `frontend/src`
- `lib/http.ts`: shared fetch client (`getJson`, `sendJson` with CSRF, `ApiError` with per-field errors).
- `auth/`: `AuthProvider` (mirrors `/auth/me/`), `RequireAuth`. Hiding a page in the UI is a convenience; the backend enforces permissions.
- `layouts/SiteLayout.tsx`: header, account actions and footer for all non-map pages.
- `components/ui.tsx`: small shared primitives (Badge, PageHeader, EmptyState, Field, button classes).
- `modules/livemap/`, `modules/management/`: one folder per product module.

Adding a Management section: add a page in `modules/management/pages.tsx`, a route in `App.tsx`, and a link in `ManagementLayout.tsx`.
