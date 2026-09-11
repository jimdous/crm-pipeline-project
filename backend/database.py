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
        options="-c statement_timeout=10000",
    ) as conn:
        yield conn

