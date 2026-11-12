# LiveMap (Phase 3)

## L1: data model and public API (done)
Apps: `geography` (Country, AdministrativeRegion, District) and `facilities` (Facility, FacilityService).

**Privacy rules (enforced in `Facility.objects.public()`, the only queryset public views use)**
- Only `approved` facilities are public. Draft/submitted/under review/rejected/requires update never are.
- Demo records (`is_demo`) are public only when `ALLOW_DEMO_DATA` is on (development, or Preview if you set it). Off in production.
- A facility offering a sensitive service (survivor support) stays hidden until a reviewer sets `sensitive_cleared`.
- Serializers use an explicit allow-list of public fields; internal fields cannot leak.

**Endpoints (public, read-only, throttled 120/min)**
| Endpoint | Purpose |
|---|---|
| `GET /api/v1/facilities/` | Paginated list. Filters: `country`, `region`, `district`, `type` (comma list), `service` (comma list of slugs), `q`, `bbox=west,south,east,north`. Invalid input returns 400. |
| `GET /api/v1/facilities/geojson/` | Light GeoJSON for map pins (same filters, max 2000, `truncated` flag). Coordinates are `[lng, lat]`. |
| `GET /api/v1/facilities/<id>/` | Facility detail. |
| `GET /api/v1/facilities/meta/` | Types, services and countries for filter controls. |
| `GET /api/v1/geography/countries/`, `regions/?country=GH`, `districts/?region=<id>` | Reference lists. |

**PostGIS without GeoDjango.** GDAL is not available on Vercel's Python runtime, so `django.contrib.gis` is not used.
`latitude`/`longitude` (validated floats) are the source of truth, and migration `facilities/0002` adds a
database-generated `location geography(Point,4326)` column with a GiST index, so it cannot drift. Use it in raw SQL
(`ST_DWithin`, nearest-N) when needed. Bounding-box filtering uses the lat/lng columns.

**Reference data.** Migrations seed the three countries and the service catalogue only. Regions and districts must be
imported from an authoritative boundary dataset (a later Management task), never typed in.

## Local development
```bash
cd backend && python manage.py migrate && python manage.py seed_demo_facilities   # SQLite, demo data only
python manage.py runserver   # then http://localhost:8000/api/v1/facilities/
```
`seed_demo_facilities` refuses to run unless `ALLOW_DEMO_DATA` is on. Names are labelled "(not a real facility)".

## Next
- L2: LiveMap page (React + MapLibre, map/list views, search, filters, details panel).
- L3: facility submission and review workflow.
- L4: health intelligence mode.
