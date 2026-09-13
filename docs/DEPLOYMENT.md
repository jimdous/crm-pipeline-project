# Deploy V2

The [public demo](https://crm-pipeline-v2.onrender.com/) runs on Render with a PostgreSQL 17 database in Oregon. The Blueprint uses branch `codex/crm-v2`. See [verification evidence](VERIFICATION.md) for completed checks.

The current deployment was connected using the public repository URL. Git provider repository permissions were not expanded. Deploy later commits with **Manual Deploy → Deploy latest commit**, and use the Blueprint's **Manual sync** for configuration changes. Do not rely on automatic deployment without checking the repository integration.

## Render blueprint

1. Push the reviewed V2 branch to GitHub. In Render, create a Blueprint from this repository and select that branch.
2. Review `render.yaml` before creating resources. It requests a free Python web service and a free PostgreSQL instance with public database access disabled. Verify the account's current plan availability and limits in Render. This is a portfolio configuration, not a durable production hosting guarantee.
3. Render supplies `DATABASE_URL` from the database and generates `API_KEY`. Save the key privately from the service's environment settings; never add it to frontend code.
4. The start command applies versioned migrations, seeds the 40 synthetic leads only when first creating the table, and starts Uvicorn on Render's assigned port. Subsequent deployments preserve edits and do not restore deleted leads.
5. Open the generated HTTPS URL and unlock editing with `API_KEY`.
6. Verify `/health` and `/ready`, then create/edit/delete a disposable lead and confirm it survives a page reload before deletion. Inspect service logs for failures.

The frontend and API share an origin in this setup. The database should use private networking. Keep `PUBLIC_DEMO=true` only for synthetic data; use `false` to require the key for reads too. Do not place real customer data in a shared-key public portfolio demo.

Reference: [Render Blueprint specification](https://render.com/docs/blueprint-spec).

The free database expires 30 days after creation. The free web service sleeps after 15 idle minutes and may take about a minute to wake. Keep the demo on a paid database or migrate before expiration for a lasting portfolio link. See [Render's free-plan limits](https://render.com/docs/free). No paid resources have been authorized or created.

## Separate frontend hosting (optional)

GitHub Pages can serve HTML/CSS/JavaScript but cannot run FastAPI or PostgreSQL. First deploy the API. Then set `window.CRM_API_BASE` in `static/config.js` to the API's HTTPS origin, and configure `CORS_ORIGINS` on the API, for example `["https://jimdous.github.io"]`. An origin contains no path or trailing slash. Deploy only after checking cross-origin reads and authenticated writes. No credentials belong in `config.js`.

Reference: [FastAPI CORS documentation](https://fastapi.tiangolo.com/tutorial/cors/).

## Operating notes

- `/health` verifies the process; `/ready` also probes the leads table. Use readiness for hosting health checks.
- The API and database sessions use UTC calendar dates.
- Back up persistent data and test restoration before real use. Hard deletes currently have no in-app recovery.
- Add schema changes as new numbered SQL files under `backend/migrations`. Initialization serializes migration runs and applies unapplied files in a transaction. Review and back up data before structural changes; there is no automatic downgrade command.
- This implementation opens a connection per request. Add a bounded pool and load testing before significant concurrency.
- The directory is bounded to 100 rows per API request; analytics aggregate the entire table. Add indexes and query-plan analysis based on measured growth.
- Same-field concurrent updates use last-writer-wins. Add versions/ETags if multi-user editing becomes a requirement.
- Authentication is a shared access key, not user identity or role-based authorization. Build proper user authentication and permissions before real teams use the app.
