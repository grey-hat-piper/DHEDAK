# DHEDAK

Health Intelligence. Education. Services. Modular monolith: React/TypeScript frontend, Django/DRF backend, Supabase PostgreSQL + PostGIS, Vercel.

Status: Phase 1 in progress (backend skeleton, accounts, organisations, landing page). See `docs/deployment.md` to deploy.

## Backend (local)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # never commit .env
python manage.py migrate
python manage.py test
python manage.py runserver
```
- Health check: `GET /api/v1/health/`; API docs: `/api/v1/docs/`.
- Dev uses SQLite when `DATABASE_URL` is empty. Production (`config.settings.prod`) refuses to start without a secret key, allowed hosts and `DATABASE_URL`.

## Decisions
- Auth: Django session cookies + CSRF (same-domain frontend and API).
- All DRF endpoints require authentication unless they opt in with `AllowAny`.
- PostGIS (`django.contrib.gis`) is deferred to Task 2; GDAL availability on Vercel must be verified first.

## Frontend (local)
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173, proxies /api to Django on :8000
npm run build    # type-check + production build
```
Status: landing page built; other routes are placeholders. The globe uses the public MapLibre demo style for development; replace it with a production basemap before launch.
