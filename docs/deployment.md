# Deployment (Vercel + Supabase)

One Vercel project, two services, one domain (`vercel.json`):

| Path | Service |
|---|---|
| `/api/*`, `/admin/*`, `/static/*` | `backend` (Django, WSGI, Vercel Python runtime) |
| everything else | `frontend` (Vite build; `/` landing, `/app/*` React app) |

Vercel detects Django from `backend/manage.py` and reads `WSGI_APPLICATION` (`config.wsgi.application`).
`collectstatic` runs automatically because `STATIC_ROOT` is set. Vercel Services is in **beta** (all plans).

## One-time setup
1. **Generate and commit migrations** (needs a local Python env):
   ```bash
   cd backend && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   python manage.py makemigrations accounts organisations
   python manage.py test
   ```
2. **Import the repo** at vercel.com/new. Leave Framework Preset as "Other"/auto and the root directory at the repo root.
3. **Add environment variables** (see `.env.example`) for Production and Preview.
   `DATABASE_URL` is the Supabase *transaction pooler* string (port 6543).
4. **Run migrations against Supabase** from your machine (serverless deploys do not run them):
   ```bash
   cd backend
   DJANGO_SETTINGS_MODULE=config.settings.prod DATABASE_URL='<session-pooler or direct string, port 5432>' \
   DJANGO_SECRET_KEY=x DJANGO_ALLOWED_HOSTS=x python manage.py migrate
   ```
   Use the session pooler or direct connection (port 5432) for migrations, not the transaction pooler.
5. **Deploy**, then check `https://<your-domain>/api/v1/health/` returns `{"status":"ok","database":true}`.

## Supabase connection strings (project `ihtfnfmgkzmlxzlfwylb`, eu-north-1)
Host `aws-0-eu-north-1.pooler.supabase.com`, user `postgres.ihtfnfmgkzmlxzlfwylb`, database `postgres`.

| Use | Port | Pooler mode |
|---|---|---|
| Running `migrate` from your machine | 5432 | session |
| Vercel `DATABASE_URL` (serverless) | 6543 | transaction |

Percent-encode special characters in the password (`@` becomes `%40`). The driver is `psycopg` v3, already in
`requirements.txt`; `psycopg2` is not needed. Confirm the 6543 string in the dashboard (Connect > Transaction pooler).

## Notes
- Preview deployments: Vercel's per-deployment hostnames are added to `ALLOWED_HOSTS`/CSRF origins automatically.
  Point Preview at a separate Supabase branch or project, not production.
- Django receives the original path, so its URLs keep the `/api/v1/` prefix.
- `/admin/` is exposed publicly for now; restricting it (IP allowlist, Vercel firewall rule) is a pre-launch task.
- Commit `frontend/package-lock.json` after your first local `npm install` for reproducible builds.
- Background jobs are not configured. Vercel supports Celery/Dramatiq via queue-triggered functions; decide in Phase 4.
