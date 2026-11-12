"""Migration helpers for Supabase/PostgreSQL. Both are no-ops on other databases (e.g. SQLite in tests)."""
from django.db import migrations


def enable_rls(*tables):
    """Enable row-level security with no policies. Supabase exposes `public` tables through its REST API
    to the anon key; with RLS on and no policies that API sees nothing. Django connects as the table
    owner, which bypasses RLS, so the application is unaffected."""

    def forward(apps, schema_editor):
        if schema_editor.connection.vendor != "postgresql":
            return
        for table in tables:  # table names are constants in migration files, never user input
            schema_editor.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')

    return migrations.RunPython(forward, migrations.RunPython.noop)
