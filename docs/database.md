# Database setup (Supabase)

Project: `DHEDAK` (ref `ihtfnfmgkzmlxzlfwylb`, region eu-north-1, Postgres 17).
Credentials are never stored in the repo. Set `DATABASE_URL` (Supabase pooler connection string) in the environment.

## Applied manually (Supabase migration `enable_postgis`)
```sql
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
```
Verified: postgis 3.3.7 installed in schema `extensions`. The `public` schema was empty at this point.

## Pending
- Django connection test against the pooler (needs installable dependencies).
- Decide GeoDjango vs. raw PostGIS access once GDAL support on Vercel is verified.
