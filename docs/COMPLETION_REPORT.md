# CRM PIPELINE V2 — COMPLETE

## Status

DONE — approved PR #1 merged. This packet records completed V2 work, not future feature plans. Evidence checked September 13, 2026 EDT (September 14 UTC). Release identity: `v2.0.0`; resolve its final main commit with `git rev-list -n 1 v2.0.0` or the linked release. The release includes this report and documentation updates only after the verified application commit.

## Live Application and GitHub

- [Live workspace](https://crm-pipeline-v2.onrender.com/) and [API docs](https://crm-pipeline-v2.onrender.com/docs).
- [Repository](https://github.com/jimdous/crm-pipeline-project), [main](https://github.com/jimdous/crm-pipeline-project/tree/main), [merged PR #1](https://github.com/jimdous/crm-pipeline-project/pull/1), [v2.0.0 release](https://github.com/jimdous/crm-pipeline-project/releases/tag/v2.0.0).
- Approved merge commit: `125b4276ebd54b5169a0e295b5b8f8cf9aee3bce`. Its tree exactly matched the verified branch head `1f9032ccaee976c0a554f5eb32e5806368809f24`.
- GitHub Pages serves the versioned redirect configuration to Render. V1 remains separately archived in `docs/v1-dashboard.html` and `docs/v1-readme.md`.

## Architecture

Browser → vanilla JavaScript fetch/JSON → FastAPI validation and authorization → parameterized Psycopg SQL → PostgreSQL 17.

FastAPI serves the browser assets and API from one origin. PostgreSQL is authoritative; CSV supplies the initial synthetic seed. Numbered SQL migrations run transactionally with migration tracking and serialized initialization. Deployment uses seed-on-create so redeploying does not reset data. No ORM or frontend build system is needed.

## Final Features

- Overview prioritizes leads needing attention; Leads provides the full directory; Follow-ups provides the deterministic queue.
- Persistent create, read, edit and delete, grouped contact/pipeline/property forms, contact links, and mobile lead cards.
- Name/email search, stage/agent/source filters, sorting and pagination.
- SQL-backed totals, pipeline stage summaries, agent results and lead-source analytics with expandable details.
- Outcome derives from stage. Validation covers dates, email, stage and monetary values with cents.
- Shared-key authenticated writes; optional private reads. Public synthetic demo defaults to read-only, and editing relocks on reload or lock.
- Open leads are due if flagged, never contacted, or at least seven days stale. This is an explicit rule, not a predictive model.

## Final Dataset

| Measure | Verified value |
|---|---:|
| Total leads | 40 |
| Open | 28 |
| Won | 9 |
| Lost | 3 |
| Follow-ups | 28 |
| Active/open estimated property value | $11,768,000 |
| Won estimated property value | $5,080,000 |

All data is synthetic. These values are property/deal estimates in a demonstration dataset, not revenue, commissions, business impact or actual sales achieved by Jim.

## Testing and UI

49 local tests passed, including real PostgreSQL integration tests using isolated schemas in an explicit test database. Both final branch CI runs passed: [push](https://github.com/jimdous/crm-pipeline-project/actions/runs/34791991254) and [PR](https://github.com/jimdous/crm-pipeline-project/actions/runs/34791993313). Main/release CI is available in [Actions](https://github.com/jimdous/crm-pipeline-project/actions). JavaScript syntax and whitespace checks passed. Two upstream dependency deprecation warnings remain.

Manual evidence covers desktop and 390×844 mobile layouts, search/filter/sort, four pages with 40 unique records and correct boundaries, analytics disclosure, invalid/valid access, private-mode data clearing and re-unlock, read-only details, CRUD, exact cents, derived outcome and persistence across reload/restart. No broad QA rerun was needed for final documentation. Screenshot: [Overview](../screenshots/v2-overview.jpg), captured locally with the same design and canonical dataset; mobile screenshots were inspected but no mobile screenshot artifact was saved.

A stale cached script initially referenced a removed HTML element after rollout. Server bytes matched the new code. Versioned CSS/config/app URLs resolved the mismatch; current live assets match repository bytes and no new runtime errors were observed afterward.

## Deployment

Render service `srv-dai6qqe1egvs73crpj60`; PostgreSQL 17 in Oregon. Exact application SHA `1f9032ccaee976c0a554f5eb32e5806368809f24`; successful post-rotation deployment `dep-dajk3gjm8hqs738jm9rg`. Main’s executable code matches that deployment; final report commits change documentation only. Render still tracks `codex/crm-v2` with manual deployment. No account permissions or paid resources were added.

After merge, `/`, `/health`, `/ready`, `/config`, `/leads`, `/analytics`, and `/docs` returned 200. Health/readiness and canonical totals also passed after owner key rotation. Authenticated editing worked and locking disabled creation again. The recurring 503 was not reproduced; free-tier cold starts remain possible. Credentials are not included in this packet.

## Cleanup

Local disposable #42 was deleted and local canonical data restored. Public #41 was immediately reverified as Deployment Verification / Closed Won / Won / $123,456.78, then deleted alone through the UI. Its subsequent read returned 404 and still did after merge. No additional public test record was needed or created. No temporary records remain from this workflow.

## Documentation

README describes the product, architecture, setup, testing and screenshot. Deployment, verification and engineering-decision docs record operation and evidence. This report supplies the final career evidence packet, and the completion handoff points here. Historical V1 artifacts remain explicitly labeled.

## Known Limitations and Deferred Scope

Shared-key access provides no user accounts, RBAC, tenant isolation or individual audit attribution. Deletion is hard deletion with no in-app recovery. Same-field concurrent writes are last-writer-wins. Connections open per request; sustained load, restore drills and real multi-user use have not been validated. Follow-up timing is a product hypothesis; the dated seed naturally creates many overdue leads. Free hosting is temporary, with idle cold starts and a database expiration limit; see deployment documentation before relying on ongoing availability.

No activities, tasks, property associations, live MLS, or AI were added. No claims of production team adoption or measured business gains are supported.

## Career Evidence Packet

### Factual bullet bank for later résumé work

- Built an AI-assisted portfolio CRM connecting a vanilla JavaScript interface to FastAPI and PostgreSQL 17, replacing a static dashboard with persistent CRUD.
- Added API validation, parameterized SQL, whitelisted sorting and database constraints for consistent lead data.
- Verified 49 automated tests, including PostgreSQL-backed integration cases, with GitHub Actions CI.
- Implemented searchable/filterable/paginated lead workflows and deterministic follow-up rules over a canonical 40-record synthetic dataset.
- Deployed a same-origin web application and managed PostgreSQL database on Render; verified health/readiness, authentication, persistence, and test-data cleanup.
- Diagnosed a stale browser asset mismatch and introduced versioned asset URLs to load matching HTML, scripts and styles after deployment.

These are evidence facts, not a rewritten résumé. The implementation was created with Codex assistance; Jim should understand and reproduce the reasoning before claiming independent mastery.

### Project and social-profile fact bank

Summary: a real-estate lead management portfolio application with persistent records, SQL analytics and a follow-up-first workspace. Technologies: Python 3.12, FastAPI, Pydantic, Psycopg, PostgreSQL 17, vanilla JavaScript, HTML/CSS, pytest, GitHub Actions, Render. Use the live/repository/release links above and `screenshots/v2-overview.jpg`. No social posts or profile changes were made.

Strongest engineering story: moving from a static analytical snapshot to a persistent application while keeping seed provenance explicit, protecting writes, testing real SQL, preserving data across deployments and restoring canonical totals after controlled live verification. The final cached-asset incident offers a concrete debugging example backed by server/browser evidence.

### Five decisions and how to defend them

| Decision | Reason and tradeoff | Files to understand |
|---|---|---|
| FastAPI with Pydantic | Clear API validation and generated docs; adds Python/backend concepts | `backend/main.py`, `backend/schemas.py` |
| Direct PostgreSQL/Psycopg | SQL behavior stays explicit; requires manual query/mapping work | `backend/database.py`, `backend/main.py`, migrations |
| Vanilla JS, same-origin serving | Minimal deployment surface and no default CORS dependency; manual state/rendering | `static/app.js`, `index.html`, `backend/main.py` |
| Transactional migrations and seed-on-create | Repeatable startup without resetting edits; no automatic downgrade | `backend/init_db.py`, `backend/migrations/`, `render.yaml` |
| Shared key and public synthetic reads | Protects writes within portfolio scope; insufficient for real teams | `backend/config.py`, authentication in `backend/main.py`, `static/app.js` |

### Five likely interview questions

1. How does an edit travel from the browser to a committed row, and where can validation fail? Trace form submission, Pydantic validation and connection transaction handling in `static/app.js`, `backend/schemas.py`, `backend/main.py`, and `backend/database.py`.
2. Why are filter values parameterized while sorting needs a whitelist? Explain data versus SQL syntax in `backend/main.py` and the corresponding API tests.
3. How do deployments preserve records and apply schema changes safely? Explain migration tracking, serialization, transaction boundaries and seed-on-create in `backend/init_db.py` and the migration files.
4. How are monetary precision, stage/outcome consistency and follow-ups maintained? Trace Python/SQL/browser representations and constraints in `backend/schemas.py`, migrations, `backend/main.py`, `static/app.js`, and tests; distinguish display formatting from stored values.
5. What would prevent real teams from using this unchanged? Discuss shared credentials, missing isolation/audit, concurrency, hard deletes, connection management and hosting limits using `docs/DECISIONS.md` and `docs/DEPLOYMENT.md`.

## Learning Order

README → `backend/main.py` → `backend/schemas.py` → `backend/database.py` → `backend/config.py` → `backend/init_db.py` → migrations → `static/app.js` → `index.html` → `static/styles.css` → tests → CI workflow → Render/deployment docs → decisions/verification docs.

## Final Interview Summary

CRM Pipeline V2 is an AI-assisted full-stack portfolio project that turns a static real-estate dashboard into a persistent lead workspace. It uses vanilla JavaScript, FastAPI and PostgreSQL, with validated authenticated writes, SQL analytics, deterministic follow-ups, integration tests and a live Render deployment. Its evidence includes 49 passing local tests, green CI, controlled persistence and cleanup checks, and a canonical synthetic dataset; it deliberately stops short of real multi-tenant production CRM capabilities.
