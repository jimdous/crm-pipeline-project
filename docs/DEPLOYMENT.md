# Deploy V2

Deployment is prepared but not executed. A Render account connected to the repository is required. pgAdmin manages a database; it does not publish a web service.

## Render blueprint

1. Push the reviewed V2 branch to GitHub. In Render, create a Blueprint from this repository and select that branch.
2. Review `render.yaml` before creating resources. It requests a free Python web service and a free PostgreSQL instance with public database access disabled. Verify the account's current plan availability and limits in Render. This is a portfolio configuration, not a durable production hosting guarantee.
3. Render supplies `DATABASE_URL` from the database and generates `API_KEY`. Save the key privately from the service's environment settings; never add it to frontend code.
4. The start command initializes the schema and starts Uvicorn on Render's assigned port. It does not seed data automatically or erase existing leads.
5. Open the generated HTTPS URL, unlock with `API_KEY`, and create a synthetic lead. If the hosting plan offers a service shell, run `python -m backend.init_db --seed` before creating leads to load the original CSV. Seeding is optional and skips any nonempty table.
6. Verify `/health` and `/ready`, then create/edit/delete a disposable lead and confirm it survives a page reload before deletion. Inspect service logs for failures.

The frontend and API share an origin in this setup. The database should use private networking. Keep `PUBLIC_DEMO=true` only for synthetic data; use `false` to require the key for reads too. Do not place real customer data in a shared-key public portfolio demo.

Reference: [Render Blueprint specification](https://render.com/docs/blueprint-spec).

## Separate frontend hosting (optional)

GitHub Pages can serve HTML/CSS/JavaScript but cannot run FastAPI or PostgreSQL. First deploy the API. Then set `window.CRM_API_BASE` in `static/config.js` to the API's HTTPS origin, and configure `CORS_ORIGINS` on the API, for example `["https://jimdous.github.io"]`. An origin contains no path or trailing slash. Deploy only after checking cross-origin reads and authenticated writes. No credentials belong in `config.js`.

Reference: [FastAPI CORS documentation](https://fastapi.tiangolo.com/tutorial/cors/).

## Operating notes

- `/health` verifies the process; `/ready` also probes the leads table. Use readiness for hosting health checks.
- Set both application and database time zones consistently.
- Back up persistent data and test restoration before real use. Hard deletes currently have no in-app recovery.
- Schema initialization is not a general migration system. Introduce versioned migrations for future table changes.
- This implementation opens a connection per request. Add a bounded pool and load testing before significant concurrency.
- The directory is bounded to 100 rows per API request; analytics aggregate the entire table. Add indexes and query-plan analysis based on measured growth.
- Same-field concurrent updates use last-writer-wins. Add versions/ETags if multi-user editing becomes a requirement.
- Authentication is a shared access key, not user identity or role-based authorization. Build proper user authentication and permissions before real teams use the app.
