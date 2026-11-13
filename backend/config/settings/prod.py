import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403

DEBUG = False

# Vercel injects these per deployment; trusting them lets preview deployments serve the API.
for _var in ("VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"):
    _host = os.environ.get(_var, "").strip()
    if _host:
        ALLOWED_HOSTS.append(_host)  # noqa: F405
        CSRF_TRUSTED_ORIGINS.append(f"https://{_host}")  # noqa: F405

# On Vercel the edge routes by hostname before Django sees the request, so trusting *.vercel.app
# (production alias, preview URLs, and the host Django sees behind the Services proxy) is safe.
# (The VERCEL env var is not reliably present in the Python runtime, so this is unconditional.)
ALLOWED_HOSTS.append(".vercel.app")  # noqa: F405
CSRF_TRUSTED_ORIGINS.append("https://*.vercel.app")  # noqa: F405

if not SECRET_KEY:  # noqa: F405
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production.")
if not ALLOWED_HOSTS:  # noqa: F405
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must be set in production.")
if DATABASES["default"]["ENGINE"].endswith("sqlite3"):  # noqa: F405
    raise ImproperlyConfigured("DATABASE_URL must be set in production.")

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
