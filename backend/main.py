import logging
import secrets
import time
from pathlib import Path
from typing import Annotated, Literal

import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException, Path as ApiPath, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from psycopg import sql
from pydantic import ValidationError

from backend.config import get_settings
from backend.database import connection
from backend.schemas import LeadCreate, LeadOut, LeadPage, LeadPatch, Stage, outcome_for

logger = logging.getLogger("crm")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
ROOT = Path(__file__).resolve().parent.parent
app = FastAPI(title="CRM Pipeline API", version="2.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=get_settings().cors_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    started = time.monotonic()
    response = await call_next(request)
    # Route templates avoid putting query strings or lead details in logs.
    route = request.scope.get("route")
    logger.info("%s %s %s %.0fms", request.method, getattr(route, "path", "static"),
                response.status_code, (time.monotonic() - started) * 1000)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["X-Frame-Options"] = "DENY"
    if request.url.path.startswith(("/leads", "/analytics", "/metadata")):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(psycopg.Error)
async def database_error(request: Request, exc: psycopg.Error):
    logger.error("Database operation failed: %s", type(exc).__name__)
    if isinstance(exc, psycopg.IntegrityError):
        return JSONResponse(status_code=409, content={"detail": "The change conflicts with a database constraint."})
    return JSONResponse(status_code=503, content={"detail": "Database temporarily unavailable. Please retry."})


def require_key(authorization: Annotated[str | None, Header()] = None):
    key = get_settings().api_key
    if not key:
        raise HTTPException(503, "Access key is not configured on the server")
    if not secrets.compare_digest((authorization or "").encode(), f"Bearer {key}".encode()):
        raise HTTPException(401, "Enter a valid access key", headers={"WWW-Authenticate": "Bearer"})


def require_read(authorization: Annotated[str | None, Header()] = None):
    if not get_settings().public_demo:
        require_key(authorization)


READ = [Depends(require_read)]
WRITE = [Depends(require_key)]
LeadId = Annotated[int, ApiPath(gt=0)]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    with connection() as conn:
        conn.execute("SELECT lead_id FROM leads LIMIT 1")
    return {"status": "ready"}


@app.get("/config")
def public_config():
    return {"public_demo": get_settings().public_demo}


@app.get("/session", dependencies=WRITE)
def session():
    return {"authenticated": True}


@app.get("/metadata", dependencies=READ)
def metadata():
    with connection() as conn:
        agents = conn.execute("SELECT DISTINCT assigned_agent FROM leads WHERE assigned_agent IS NOT NULL ORDER BY 1").fetchall()
        sources = conn.execute("SELECT DISTINCT lead_source FROM leads WHERE lead_source IS NOT NULL ORDER BY 1").fetchall()
    return {"agents": [r["assigned_agent"] for r in agents], "sources": [r["lead_source"] for r in sources]}


@app.get("/leads", response_model=LeadPage, dependencies=READ)
def list_leads(
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    q: Annotated[str, Query(max_length=100)] = "",
    stage: Stage | None = None,
    agent: Annotated[str | None, Query(max_length=100)] = None,
    source: Annotated[str | None, Query(max_length=50)] = None,
    follow_up: bool = False,
    stale_days: Annotated[int, Query(ge=1, le=365)] = 7,
    sort: Literal["newest", "oldest", "value", "name", "contact"] = "newest",
):
    clauses, params = [], []
    if q.strip():
        clauses.append("(first_name || ' ' || last_name ILIKE %s ESCAPE '\\' OR email ILIKE %s ESCAPE '\\')")
        escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        params.extend([f"%{escaped}%"] * 2)
    for field, value in (("stage", stage), ("assigned_agent", agent), ("lead_source", source)):
        if value:
            clauses.append(f"{field} = %s")
            params.append(value)
    if follow_up:
        clauses.append("outcome = 'Open' AND (follow_up_needed IS TRUE OR last_contact_date IS NULL OR CURRENT_DATE - last_contact_date >= %s)")
        params.append(stale_days)
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    order = {"newest": "created_date DESC NULLS LAST, lead_id DESC", "oldest": "created_date ASC NULLS LAST, lead_id",
             "value": "estimated_deal_value DESC NULLS LAST, lead_id", "name": "last_name, first_name, lead_id",
             "contact": "last_contact_date ASC NULLS FIRST, lead_id"}[sort]
    with connection() as conn:
        # A consistent snapshot keeps the count and page aligned during concurrent writes.
        conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
        total = conn.execute("SELECT COUNT(*) AS n FROM leads" + where, params).fetchone()["n"]
        items = conn.execute("SELECT * FROM leads" + where + " ORDER BY " + order + " LIMIT %s OFFSET %s", [*params, limit, offset]).fetchall()
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@app.get("/leads/{lead_id}", response_model=LeadOut, dependencies=READ)
def get_lead(lead_id: LeadId):
    with connection() as conn:
        lead = conn.execute("SELECT * FROM leads WHERE lead_id = %s", (lead_id,)).fetchone()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


@app.post("/leads", response_model=LeadOut, status_code=201, dependencies=WRITE)
def create_lead(payload: LeadCreate, response: Response):
    values = payload.model_dump()
    values["outcome"] = outcome_for(payload.stage)
    query = sql.SQL("INSERT INTO leads ({}) VALUES ({}) RETURNING *").format(
        sql.SQL(", ").join(map(sql.Identifier, values)), sql.SQL(", ").join(sql.Placeholder() for _ in values))
    with connection() as conn:
        lead = conn.execute(query, list(values.values())).fetchone()
    response.headers["Location"] = f"/leads/{lead['lead_id']}"
    return lead


@app.patch("/leads/{lead_id}", response_model=LeadOut, dependencies=WRITE)
def update_lead(lead_id: LeadId, payload: LeadPatch):
    with connection() as conn:
        existing = conn.execute("SELECT * FROM leads WHERE lead_id = %s FOR UPDATE", (lead_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Lead not found")
        changes = payload.model_dump(exclude_unset=True)
        merged = {k: v for k, v in existing.items() if k in LeadCreate.model_fields}
        merged.update(changes)
        try:
            valid = LeadCreate.model_validate(merged)
        except ValidationError as exc:
            # Do not echo stored personal information in validation errors.
            raise HTTPException(422, [{"loc": list(e["loc"]), "msg": e["msg"]} for e in exc.errors()]) from None
        changes["outcome"] = outcome_for(valid.stage)
        query = sql.SQL("UPDATE leads SET {} WHERE lead_id = %s RETURNING *").format(
            sql.SQL(", ").join(sql.SQL("{} = %s").format(sql.Identifier(k)) for k in changes))
        return conn.execute(query, [*changes.values(), lead_id]).fetchone()


@app.delete("/leads/{lead_id}", status_code=204, dependencies=WRITE)
def delete_lead(lead_id: LeadId):
    with connection() as conn:
        deleted = conn.execute("DELETE FROM leads WHERE lead_id = %s RETURNING lead_id", (lead_id,)).fetchone()
        if not deleted:
            raise HTTPException(404, "Lead not found")
    return Response(status_code=204)


@app.get("/analytics", dependencies=READ)
def analytics():
    with connection() as conn:
        conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
        summary = conn.execute("""
            SELECT COUNT(*) AS total_leads,
                COUNT(*) FILTER (WHERE outcome='Open') AS open_leads,
                COUNT(*) FILTER (WHERE outcome='Won') AS won_leads,
                COUNT(*) FILTER (WHERE outcome='Lost') AS lost_leads,
                COALESCE(SUM(estimated_deal_value) FILTER (WHERE outcome='Open'),0) AS pipeline_value,
                COALESCE(SUM(estimated_deal_value) FILTER (WHERE outcome='Won'),0) AS won_value,
                COUNT(*) FILTER (WHERE outcome='Open' AND (follow_up_needed IS TRUE OR last_contact_date IS NULL OR CURRENT_DATE-last_contact_date >= 7)) AS follow_ups
            FROM leads
        """).fetchone()
        stages = conn.execute("SELECT stage, COUNT(*) AS count, COALESCE(SUM(estimated_deal_value),0) AS value FROM leads GROUP BY stage").fetchall()
        agents = conn.execute("""SELECT COALESCE(assigned_agent,'Unassigned') AS agent, COUNT(*) AS count,
            COUNT(*) FILTER (WHERE outcome='Won') AS won,
            COUNT(*) FILTER (WHERE outcome='Lost') AS lost,
            COALESCE(SUM(estimated_deal_value) FILTER (WHERE outcome='Won'),0) AS won_value
            FROM leads GROUP BY assigned_agent ORDER BY won_value DESC, agent""").fetchall()
        sources = conn.execute("SELECT COALESCE(lead_source,'Unknown') AS source, COUNT(*) AS count, COUNT(*) FILTER (WHERE outcome='Won') AS won FROM leads GROUP BY lead_source ORDER BY count DESC, source").fetchall()
    return {"summary": summary, "stages": stages, "agents": agents, "sources": sources}


app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


@app.get("/", include_in_schema=False)
def frontend():
    return FileResponse(ROOT / "index.html")
