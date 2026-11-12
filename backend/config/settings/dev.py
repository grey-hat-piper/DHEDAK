from .base import *  # noqa: F401,F403

DEBUG = True
SECRET_KEY = SECRET_KEY or "dev-only-insecure-key"  # noqa: F405
ALLOWED_HOSTS = ALLOWED_HOSTS or ["localhost", "127.0.0.1"]  # noqa: F405
ALLOW_DEMO_DATA = True
