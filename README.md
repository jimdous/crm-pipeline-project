# CRM Pipeline V2

A real estate lead workspace with a JavaScript frontend, a FastAPI REST API, and persistent PostgreSQL storage. Create, find, update, and delete leads; inspect pipeline metrics; and see which open leads need follow-up.

**Status:** implemented and tested locally. Public V2 deployment is pending a hosting account. The existing GitHub Pages deployment is V1 until deliberately updated. This is a single-workspace portfolio application, not a multi-tenant CRM service.

## Architecture

```text
Browser (index.html + static/)
    ↓ fetch / JSON / HTTP
FastAPI (backend/main.py)
    ↓ Pydantic validation + parameterized SQL
PostgreSQL (one leads table)
```

The API serves the frontend itself, so local development needs one web server and no CORS configuration. PostgreSQL is the runtime source of truth. The CSV is an optional synthetic seed, not a live data store. The historical V1 dashboard is retained in `docs/v1-dashboard.html` and is not served by the API.

## Run locally

Requirements: Python 3.12 and PostgreSQL 17. Run commands from the repository root.

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
createdb crm_pipeline
```

Set `DATABASE_URL` in `.env` to your database connection string. Set `API_KEY` to a long random value (generate one with `python -c 'import secrets; print(secrets.token_urlsafe(36))'`). `.env` is ignored by Git. Keep `PUBLIC_DEMO=false` for private data; use `true` only for a synthetic public portfolio demo.

```sh
python -m backend.init_db --seed
python -m uvicorn backend.main:app --reload --no-access-log
```

Open [the workspace](http://127.0.0.1:8000) and [interactive API documentation](http://127.0.0.1:8000/docs). Use **Unlock editing** and the key from your local `.env` to create or edit leads. The browser keeps this key only in memory; refreshing locks editing again.

Initialization uses `CREATE TABLE IF NOT EXISTS` and never drops a table. `--seed` inserts the CSV only when the table is empty. Omit it when connecting an existing database. **Do not run the legacy `crm_setup.sql` or `CRM_SETUP copy.SQL` on a database you want to preserve: those V1 scripts drop `leads`.** Existing V1 tables are supported without adding unrelated entities. Invalid historical rows may need correction before an update can pass the V2 API rules.

### This Mac's prepared environment

The current development environment uses an isolated cluster in `.local/pgdata`, bound to `127.0.0.1:55432`, database `crm_pipeline_v2`, and username `jimferdous`. V1's existing PostgreSQL setup was not modified. The isolated cluster uses local trust authentication and is for synthetic development data only. Do not expose this cluster beyond localhost.

To register it in pgAdmin: **Register → Server**, name `CRM V2 local`, host `127.0.0.1`, port `55432`, maintenance database `crm_pipeline_v2`, username `jimferdous`. No password is required for this isolated local cluster.

If the cluster is stopped:

```sh
/Library/PostgreSQL/17/bin/pg_ctl -D .local/pgdata -l .local/postgres.log -o '-h 127.0.0.1 -p 55432 -k /tmp' start
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Stop the web server with Ctrl-C. Stop this database with `/Library/PostgreSQL/17/bin/pg_ctl -D .local/pgdata stop`.

## Features and rules

- Lead CRUD, search by name/email, stage/agent/source filters, sorting, and bounded pagination.
- Positive monetary values (at most two decimals); required trimmed names; email, length, stage, and date validation. Optional fields can be cleared with `null`.
- PATCH preserves omitted fields. Updates lock the row while merging and validating changes. Concurrent changes to the same field still use last-writer-wins; optimistic locking is a future improvement.
- `Closed Won` implies outcome `Won`; `Closed Lost` implies `Lost`; all other stages imply `Open`. Clients cannot supply an outcome independently.
- Follow-up queue: open leads flagged for follow-up, never contacted, or last contacted at least seven calendar days ago. Oldest contact is first, with never-contacted leads ahead of dated contacts. No predictive score is claimed.
- Analytics cover the whole workspace. Directory filters apply only to the lead table. Close rate is won / (won + lost); open leads are excluded.
- Loading, empty, error, and read-only states; accessible form labels and keyboard-operable dialogs; responsive layouts.
- Transactions, connection/statement timeouts, sanitized database errors, request logging, explicit CORS allowlist, and API documentation.

Dates use the API host's current date for input validation and PostgreSQL's current date for queue calculations. Keep host/database time zones aligned in deployment. Set up a business timezone explicitly before using this across regions.

## API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | Process liveness, independent of database |
| GET | `/ready` | Database/table readiness |
| GET | `/config` | Public demo flag only |
| GET | `/session` | Validate access key |
| GET | `/metadata` | Distinct agents and sources |
| GET | `/leads` | `{items, total, limit, offset}`; default limit 25, maximum 100 |
| GET | `/leads/{id}` | One lead, or 404 |
| POST | `/leads` | Create; 201 with `Location` |
| PATCH | `/leads/{id}` | Partial update; 200 |
| DELETE | `/leads/{id}` | Delete; 204 without a response body |
| GET | `/analytics` | Workspace summary, stages, agents, sources |

Query parameters: `q`, `stage`, `agent`, `source`, `follow_up`, `stale_days`, `sort`, `limit`, `offset`. Sorts: `newest`, `oldest`, `value`, `name`, `contact`.

Writes always require `Authorization: Bearer <API_KEY>`. With `PUBLIC_DEMO=false`, lead reads, metadata, and analytics also require the key. An unconfigured key fails closed. This shared key is a modest portfolio access gate, **not user accounts or agent-level authorization**. Before onboarding real teams, implement identity-based authentication, resource authorization, audit history, and recovery/backups. Use HTTPS for any remote deployment.

## Tests

Use a dedicated database. Tests fail with a helpful message when `TEST_DATABASE_URL` is missing and never fall back to your app's database. Each test creates a uniquely named schema and removes only that schema.

```sh
createdb crm_pipeline_test
TEST_DATABASE_URL=postgresql://localhost/crm_pipeline_test python -m pytest -q
```

On the prepared Mac:

```sh
TEST_DATABASE_URL=postgresql://jimferdous@127.0.0.1:55432/crm_pipeline_test .venv/bin/python -m pytest -q
```

Coverage includes persisted CRUD, partial update rollback, bad IDs, malformed data, authentication, injection-like search input, pagination, empty analytics, follow-up boundaries, seed idempotency, and database outages. GitHub Actions runs the same suite with PostgreSQL 17; its remote run remains unverified until pushed.

## Data provenance

V1 contains different snapshots in the CSV, SQL, and old JavaScript. V2 explicitly seeds from `leads_data.csv`: 40 synthetic leads, $17,673,000 total modeled property value, 9 won and 3 lost leads. Its metrics therefore differ from the original dashboard's hardcoded snapshot. Nothing here represents actual managed transactions or earned brokerage revenue. PostgreSQL becomes authoritative after import; edits do not rewrite the seed CSV.

## Deployment and further work

See [deployment instructions](docs/DEPLOYMENT.md), [engineering decisions](docs/DECISIONS.md), and [learning record](MENTORING.md). `render.yaml` describes one Python service plus PostgreSQL. No cloud resources have been provisioned, no public V2 URL has been verified, and no V2 release tag has been created.

The larger roadmap's role-based access, AI copilot, product interviews, and separate business applications remain future work. Jim's independent understanding has not been assessed; implementation assistance does not establish learning mastery.
