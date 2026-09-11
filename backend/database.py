from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from backend.config import get_settings


@contextmanager
def connection():
    # Commit on success, roll back on error, and always close the connection.
    with psycopg.connect(
        get_settings().database_url,
        row_factory=dict_row,
        connect_timeout=5,
    ) as conn:
        # Preserve connection-string options (including test schema selection).
        conn.execute("SET statement_timeout = 10000")
        conn.execute("SET TIME ZONE 'UTC'")
        conn.commit()
        yield conn
