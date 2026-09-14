"""Checks that do not need a PostgreSQL server."""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.config import get_settings
from backend.main import app
from backend.schemas import LeadCreate, LeadPatch, today


def test_create_defaults_and_normalization():
    lead = LeadCreate(first_name="  Jim  ", last_name=" Ferdous ")
    assert lead.first_name == "Jim"
    assert lead.stage == "New Lead"
    assert lead.created_date == today()
    assert lead.follow_up_needed is False


def test_patch_distinguishes_omitted_and_null():
    patch = LeadPatch(email=None)
    assert patch.model_dump(exclude_unset=True) == {"email": None}
    with pytest.raises(ValidationError):
        LeadPatch(first_name=None)


def test_future_contact_is_rejected():
    with pytest.raises(ValidationError):
        LeadCreate(first_name="Jim", last_name="Ferdous", last_contact_date=today() + timedelta(days=1))


def test_public_configuration_never_contains_credentials(monkeypatch):
    monkeypatch.setenv("API_KEY", "unit-test-only")
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.get("/config")
            assert set(response.json()) == {"public_demo", "today"}
            assert "unit-test-only" not in response.text
            assert response.headers["cache-control"] == "no-store"
            assert client.get("/health").json() == {"status": "ok"}
    finally:
        get_settings.cache_clear()
