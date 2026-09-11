"""Every test gets a private schema in an explicitly configured test database."""
import os
import uuid

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg import sql
from psycopg.conninfo import make_conninfo

from backend.config import get_settings
from backend.main import app


@pytest.fixture
def client(monkeypatch):
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.fail("Set TEST_DATABASE_URL to a dedicated PostgreSQL test database; tests never use DATABASE_URL.")
    schema = "test_" + uuid.uuid4().hex
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
    monkeypatch.setenv("DATABASE_URL", make_conninfo(url, options=f"-c search_path={schema}"))
    monkeypatch.setenv("API_KEY", "test-access-key")
    monkeypatch.setenv("PUBLIC_DEMO", "true")
    get_settings.cache_clear()
    from backend.init_db import initialize
    try:
        initialize()
        with TestClient(app) as instance:
            yield instance
    finally:
        get_settings.cache_clear()
        with psycopg.connect(url, autocommit=True) as conn:
            conn.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema)))


@pytest.fixture
def auth():
    return {"Authorization": "Bearer test-access-key"}


@pytest.fixture
def lead():
    return {"first_name": "Jamie", "last_name": "Rivera", "email": "jamie@example.com", "stage": "Qualified", "created_date": "2024-01-01", "last_contact_date": "2024-01-10", "estimated_deal_value": "425000.00", "budget": "500000.00", "assigned_agent": "Alex Chen", "lead_source": "Referral"}
