from datetime import date, timedelta

import psycopg
import pytest

from backend.config import get_settings


def create(client, auth, lead, **changes):
    response = client.post("/leads", headers=auth, json={**lead, **changes})
    assert response.status_code == 201, response.text
    return response.json()


def test_health_ready_and_frontend(client):
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/ready").status_code == 200
    assert "Pipeline overview" in client.get("/").text
    assert client.get("/static/app.js").status_code == 200
    assert client.get("/.env").status_code == 404


def test_full_crud_persistence(client, auth, lead):
    response = client.post("/leads", headers=auth, json=lead)
    assert response.status_code == 201
    url = response.headers["location"]
    assert client.get(url).json()["email"] == lead["email"]
    updated = client.patch(url, headers=auth, json={"stage": "Closed Won", "email": None})
    assert updated.status_code == 200
    assert updated.json()["outcome"] == "Won"
    assert updated.json()["first_name"] == lead["first_name"]
    assert client.get(url).json()["email"] is None
    assert client.patch(url, headers=auth, json={"stage": "Contacted"}).json()["outcome"] == "Open"
    deleted = client.delete(url, headers=auth)
    assert deleted.status_code == 204 and not deleted.content
    assert client.get(url).status_code == 404
    assert client.delete(url, headers=auth).status_code == 404


@pytest.mark.parametrize("changes", [
    {"first_name": "  "}, {"last_name": "x" * 51}, {"email": "invalid"},
    {"budget": -1}, {"budget": 0}, {"estimated_deal_value": "1.001"},
    {"estimated_deal_value": "10000000000"}, {"stage": "Unicorn"},
    {"created_date": "bad-date"}, {"last_contact_date": "2023-12-01"},
    {"created_date": str(date.today() + timedelta(days=1))},
    {"last_contact_date": str(date.today() + timedelta(days=1))},
    {"outcome": "Won"}, {"lead_id": 900}, {"assigned_agent": "x" * 101},
])
def test_invalid_create_is_not_persisted(client, auth, lead, changes):
    assert client.post("/leads", headers=auth, json={**lead, **changes}).status_code == 422
    assert client.get("/leads").json()["total"] == 0


@pytest.mark.parametrize("patch", [{}, {"first_name": None}, {"stage": None}, {"follow_up_needed": None}, {"outcome": "Won"}, {"last_contact_date": "2020-01-01"}])
def test_invalid_patch_does_not_change_lead(client, auth, lead, patch):
    saved = create(client, auth, lead)
    url = f"/leads/{saved['lead_id']}"
    assert client.patch(url, headers=auth, json=patch).status_code == 422
    assert client.get(url).json() == saved


def test_missing_and_invalid_ids(client, auth):
    assert client.get("/leads/999").status_code == 404
    assert client.get("/leads/abc").status_code == 422
    assert client.get("/leads/0").status_code == 422
    assert client.patch("/leads/999", headers=auth, json={"stage": "Qualified"}).status_code == 404


def test_authentication(client, auth, lead, monkeypatch):
    assert client.post("/leads", json=lead).status_code == 401
    assert client.post("/leads", headers={"Authorization": "Bearer wrong"}, json=lead).status_code == 401
    assert client.get("/session", headers=auth).status_code == 200
    monkeypatch.setenv("PUBLIC_DEMO", "false")
    get_settings.cache_clear()
    for path in ("/leads", "/analytics", "/metadata"):
        assert client.get(path).status_code == 401
        assert client.get(path, headers=auth).status_code == 200
    monkeypatch.setenv("API_KEY", "")
    get_settings.cache_clear()
    assert client.post("/leads", headers=auth, json=lead).status_code == 503


def test_search_filters_sort_and_pagination(client, auth, lead):
    create(client, auth, lead, first_name="Zulu", estimated_deal_value="500000")
    create(client, auth, lead, first_name="Amy", stage="New Lead", lead_source="Zillow", estimated_deal_value="600000")
    create(client, auth, lead, first_name="Percent%", assigned_agent="Brianna Cole")
    assert client.get("/leads", params={"q": "amy"}).json()["total"] == 1
    assert client.get("/leads", params={"q": "%"}).json()["total"] == 1
    assert client.get("/leads", params={"q": "' OR 1=1 --"}).json()["total"] == 0
    assert client.get("/leads?stage=New%20Lead&source=Zillow").json()["total"] == 1
    assert client.get("/leads", params={"agent": "Brianna Cole"}).json()["total"] == 1
    page = client.get("/leads?sort=value&limit=1").json()
    assert page["items"][0]["first_name"] == "Amy"
    assert page["total"] == 3
    assert client.get("/leads?sort=value&limit=1&offset=1").json()["items"][0]["first_name"] == "Zulu"
    assert client.get("/leads?offset=999").json()["items"] == []
    for query in ("limit=101", "limit=0", "offset=-1", "sort=budget;DROP TABLE leads", "stage=bad"):
        assert client.get("/leads?" + query).status_code == 422


def test_followup_queue_rules(client, auth, lead):
    today = date.today()
    create(client, auth, lead, first_name="Fresh", last_contact_date=str(today))
    create(client, auth, lead, first_name="Flagged", follow_up_needed=True, last_contact_date=str(today))
    create(client, auth, lead, first_name="Stale", last_contact_date=str(today-timedelta(days=7)))
    create(client, auth, lead, first_name="Never", last_contact_date=None)
    create(client, auth, lead, first_name="Closed", stage="Closed Won", follow_up_needed=True)
    page = client.get("/leads?follow_up=true&sort=contact").json()
    assert page["total"] == 3
    assert page["items"][0]["first_name"] == "Never"
    assert {r["first_name"] for r in page["items"]} == {"Flagged", "Stale", "Never"}
    assert client.get("/analytics").json()["summary"]["follow_ups"] == 3


def test_analytics_and_empty_database(client, auth, lead):
    summary = client.get("/analytics").json()["summary"]
    assert summary["total_leads"] == 0 and summary["pipeline_value"] == 0
    create(client, auth, lead, estimated_deal_value="100000")
    create(client, auth, lead, stage="Closed Won", estimated_deal_value="200000")
    create(client, auth, lead, stage="Closed Lost", estimated_deal_value=None)
    data = client.get("/analytics").json()
    assert data["summary"]["total_leads"] == 3
    assert data["summary"]["pipeline_value"] == 100000
    assert data["summary"]["won_value"] == 200000
    assert data["agents"][0]["won"] == 1
    assert client.get("/metadata").json() == {"agents": ["Alex Chen"], "sources": ["Referral"]}


def test_database_failure_is_sanitized(client, monkeypatch):
    def fail():
        raise psycopg.OperationalError("password=super-secret internal-host")
    monkeypatch.setattr("backend.main.connection", fail)
    response = client.get("/leads")
    assert response.status_code == 503
    assert "super-secret" not in response.text
    assert client.get("/health").status_code == 200
    assert client.get("/ready").status_code == 503


def test_seed_is_non_destructive_and_idempotent(client, auth, lead):
    from backend.init_db import initialize
    initialize(seed=True)
    assert client.get("/leads").json()["total"] == 40
    initialize(seed=True)
    assert client.get("/leads").json()["total"] == 40
    create(client, auth, lead)
    initialize(seed=True)
    assert client.get("/leads").json()["total"] == 41


def test_output_escapable_strings_are_stored_as_data(client, auth, lead):
    saved = create(client, auth, lead, first_name='<img src=x onerror="alert(1)">')
    assert saved["first_name"] == '<img src=x onerror="alert(1)">'
    assert client.get("/leads").headers["cache-control"] == "no-store"
