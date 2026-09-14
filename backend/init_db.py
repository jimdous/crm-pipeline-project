"""Apply SQL migrations and optionally import synthetic leads."""
import argparse
import csv
from pathlib import Path

from psycopg import sql

from backend.database import connection
from backend.schemas import LeadCreate, outcome_for

ROOT = Path(__file__).resolve().parent.parent


def initialize(seed: bool = False, seed_on_create: bool = False):
    with connection() as conn:
        conn.execute("SELECT pg_advisory_xact_lock(781204)")
        new_table = conn.execute("SELECT to_regclass('leads') IS NULL AS missing").fetchone()["missing"]
        conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())")
        applied = {row["version"] for row in conn.execute("SELECT version FROM schema_migrations")}
        for migration in sorted((ROOT / "backend/migrations").glob("*.sql")):
            if migration.name not in applied:
                conn.execute(migration.read_text())
                conn.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (migration.name,))
        if (seed or (seed_on_create and new_table)) and not conn.execute("SELECT EXISTS(SELECT 1 FROM leads) AS present").fetchone()["present"]:
            with (ROOT / "leads_data.csv").open(newline="") as source:
                for raw in csv.DictReader(source):
                    raw.pop("lead_id")
                    raw.pop("outcome")
                    data = LeadCreate.model_validate({k: v if v != "" else None for k, v in raw.items()})
                    values = data.model_dump()
                    values["outcome"] = outcome_for(data.stage)
                    query = sql.SQL("INSERT INTO leads ({}) VALUES ({})").format(
                        sql.SQL(", ").join(map(sql.Identifier, values)),
                        sql.SQL(", ").join(sql.Placeholder() for _ in values),
                    )
                    conn.execute(query, list(values.values()))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", action="store_true", help="Import synthetic CSV data only if leads is empty")
    parser.add_argument("--seed-on-create", action="store_true", help="Seed only when this command first creates the leads table")
    args = parser.parse_args()
    initialize(seed=args.seed, seed_on_create=args.seed_on_create)
    print("Database initialized successfully.")
