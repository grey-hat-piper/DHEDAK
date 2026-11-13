import os

from django.core.wsgi import get_wsgi_application

# The WSGI entrypoint is the deployed app, so it always uses production settings. A stray
# DJANGO_SETTINGS_MODULE=dev in the host environment must never turn DEBUG on in production.
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.prod"
application = get_wsgi_application()
