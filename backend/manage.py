#!/usr/bin/env python
import os
import sys
from pathlib import Path


def main():
    # Local development convenience: load backend/.env if present. Never overrides real environment
    # variables, and is not used on Vercel (which injects variables directly).
    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).resolve().parent / ".env")
    except ImportError:
        pass
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
