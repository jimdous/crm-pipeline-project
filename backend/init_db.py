"""Initialize the existing one-table model; seed only an empty database on request."""
import argparse
import csv
from pathlib import Path

from psycopg import sql

from backend.database import connection
from backend.schemas import LeadCreate, outcome_for

ROOT = Path(__file__).resolve().parent.parent


def initialize(seed: bool = False):
    with connection() as conn:
        # Serialize startup migrations/seeding across app instances.
        conn.execute("SELECT pg_advisory_xact_lock(781204)")
        conn.execute((ROOT / "backend/schema.sql").read_text())
        if seed and not conn.execute("SELECT EXISTS(SELECT 1 FROM leads) AS present").fetchone()["present"]:
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
    initialize(parser.parse_args().seed)
    print("Database initialized successfully.")

