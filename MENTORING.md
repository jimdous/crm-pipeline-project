# CRM Pipeline V2 — mentoring record

## Operating agreement

Original agreement: Jim writes application code; Codex mentors. On September 11, Jim explicitly changed the instruction to “do the entire project go!” and later “continue.” Codex is now authorized to implement V2. Learning ratings still require Jim's own demonstrations; generated implementation does not establish mastery.

## Initial mentoring session — September 11, 2026

- Current milestone: M1 — Backend Foundation.
- Target: Jim implements and runs GET /health, then explains the request lifecycle.
- Awaiting: relevant code, launch command, observed response, and any errors.
- Local baseline: clean main branch before this record; SQL creates leads; index.html contains a hardcoded LEADS array. No backend files, README, or .gitignore found.
- Phase 0 pending: Git working tree/staging/commit/branch lesson, documentation, ignore rules, and credential review before major V2 development. No credential audit completed yet.
- M1 is not passed. Do not proceed to PostgreSQL integration yet.

## Learning record

States: ⚪ NOT INTRODUCED · 🟡 ASSISTED · 🟢 INDEPENDENT · 🔵 STRONG.
These states track demonstrated learning in mentoring sessions. Prior V1 experience is user-reported and does not by itself establish independent proficiency.

| Concept | State | Evidence |
| --- | --- | --- |
| Python interpreter, virtual environments, pip | ⚪ | No demonstration reviewed |
| Python functions and dictionaries | ⚪ | No demonstration reviewed |
| HTTP request/response and GET | ⚪ | No demonstration reviewed |
| FastAPI routes and Uvicorn | ⚪ | No demonstration reviewed |
| Git working tree, staging, commit, branch | ⚪ | No demonstration reviewed |
| PostgreSQL application connection | ⚪ | Not started |

Existing SQL and JavaScript work will be assessed through explanation and small independent tasks; no proficiency ratings assigned yet.

## Engineering decision record

### FastAPI backend — chosen in Jim's execution plan; implementation pending

- Decision: use Python/FastAPI for the V2 API, retaining PostgreSQL and the existing JavaScript frontend initially.
- Why: add backend and API experience to the existing SQL and JavaScript work.
- Alternatives: Express/Node or Django.
- Tradeoff: learning Python adds work but broadens technical experience. Defer additional architecture until its purpose is understood.

## Interview bank

Pending M1; Jim answers first:

1. Trace a browser request to GET /health through the server, route, function, and response.
2. What distinct jobs do FastAPI and Uvicorn perform?
3. Why was FastAPI chosen for this project?

No independent mastery claims earned yet. Implementation assistance must be disclosed honestly when discussing authorship.

## Implementation session — September 11, 2026

- Implemented FastAPI lead CRUD, Pydantic input validation, PostgreSQL persistence, SQL analytics, filtering, pagination, and deterministic follow-up queue.
- Built the connected vanilla JavaScript workspace with create/edit forms, delete confirmation, and loading/error/empty states.
- Preserved the V1 dashboard as a historical artifact. CSV chosen explicitly as synthetic seed because V1 snapshots differ.
- Created isolated local development and test databases; original V1 database was not modified.
- Added shared-key access control, environment configuration, transaction handling, request logging, tests, CI definition, and deployment configuration.
- PostgreSQL API suite: 31 passing tests. Browser verified live reads, search, create, edit, persistence across reload, and relocking on reload.
- Public deployment still needs hosting account access. Role-based multi-user authentication and the later business/AI roadmap are not implemented.
- No V2 release yet: deployment and Jim's architecture explanation remain outstanding.
- Learning Record remains unchanged: Jim has not yet demonstrated these concepts independently.
- Detailed tradeoffs: see `docs/DECISIONS.md`.
