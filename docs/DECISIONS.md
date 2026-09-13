# Engineering decisions

## Agent-oriented interface

Overview opens on the follow-up queue; the full directory has its own destination. Analytics remain available in an expandable section. Contact links, due reasons, grouped forms, and mobile cards prioritize working with leads while retaining the existing API and vanilla JavaScript architecture.

## Future workflow and property integration

Contact history, tasks/next actions, and property associations are hypotheses to test with agents after V2. Any later live MLS integration must use an approved RESO/MLS provider and comply with licensing. V2 has no live MLS dependency, listing tables, or AI features.

## Python/FastAPI backend

**Decision:** add FastAPI with Pydantic validation and Uvicorn. **Why:** connect the existing browser and SQL work through a real API. **Alternatives:** Express or Django. **Tradeoff:** a second language broadens experience but adds concepts and dependencies.

## Direct PostgreSQL queries

**Decision:** Psycopg with parameterized values, whitelisted sort expressions, and SQL identifiers for dynamic update columns. **Why:** keep existing SQL expertise visible and avoid an unnecessary ORM. **Alternatives:** SQLAlchemy/SQLModel. **Tradeoff:** more explicit SQL and manual mapping, but a small, explainable implementation. Connection contexts commit on success and roll back on failure; see [Psycopg transaction documentation](https://www.psycopg.org/psycopg3/docs/basic/transactions.html).

## One leads table

**Decision:** keep one business table, adding constraints and two ordering indexes through numbered SQL migrations. A separate table records migration history. **Why:** current CRUD does not require contacts, deals, or activities tables. **Tradeoff:** interaction history and multi-agent identity remain future work.

## PostgreSQL integration tests

**Decision:** exercise real SQL against temporary schemas in an explicit test database. **Why:** SQLite or mocked repositories cannot verify PostgreSQL queries and transaction behavior. **Alternatives:** mock-only API tests. **Tradeoff:** tests require a local/CI database; isolation prevents changing the application's leads.

## Plain JavaScript frontend, served by the API

**Decision:** retain vanilla JavaScript and replace the presentation-heavy V1 page with a working lead workspace, retaining the original as an archive. **Why:** complete the request lifecycle with minimal infrastructure. **Alternatives:** React and separate frontend hosting. **Tradeoff:** manual state/rendering logic; no framework overhead and no CORS needed by default.

## Synthetic seed provenance

**Decision:** seed exclusively from the versioned CSV. **Why:** the legacy CSV, SQL, and JavaScript snapshots differ. **Alternatives:** copy the old JavaScript into Python or rerun destructive V1 setup. **Tradeoff:** V2 totals differ from V1's rendered snapshot; the source is explicit and runtime duplication disappears.

## Shared access key for the portfolio boundary

**Decision:** require a server-configured key for every write and, by default, reads. Allow public read-only synthetic demos explicitly. **Why:** unauthenticated public CRUD would let visitors modify everyone's data. **Alternatives:** anonymous writes or full user accounts. **Tradeoff:** a key offers no per-user ownership, role checks, or audit attribution; proper user authentication remains a prerequisite for real team use.

## Deterministic follow-up rules

**Decision:** queue flagged, uncontacted, or seven-day-stale open leads. **Why:** transparent and testable, without unsupported predictive claims. **Alternatives:** arbitrary scores or an LLM. **Tradeoff:** the seven-day threshold is a product hypothesis, not validated agent research; the old seed naturally produces many stale leads.
