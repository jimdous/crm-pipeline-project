# V2 verification — September 11, 2026

## Executed successfully

- Clean-cloned commit `891342c` into a separate directory, created a fresh Python 3.12 environment, installed the pinned requirements, initialized a new PostgreSQL database, and repeated initialization. All 49 tests passed from that clone as well.
- Started the clean clone on port 8002. In the browser, created a synthetic lead with a $123,456.78 value, changed its stage to Closed Won, and reloaded. The lead persisted and editing relocked. An HTTP check confirmed the stored Won outcome and exact cents; deleting only that test lead returned 204, a subsequent read returned 404, and the database retained the 40 seed leads.
- 49 tests passed, including PostgreSQL 17 integration tests in isolated schemas and four database-independent tests. The integration suite uses the production connection function and covers migration integrity, seed behavior after deletion, sorting, and unauthorized writes.
- Python modules compiled, JavaScript passed `node --check`, dependencies passed `pip check`, and the diff passed whitespace checks.
- Browser loaded all 40 synthetic leads through the API and rendered SQL-backed metrics.
- Search for Maria returned one matching lead; opening it without a key showed read-only fields.
- A temporary localhost test instance accepted a disposable test access key. The browser created BrowserSmoke TestLead, then changed its stage to Closed Won. Both the row and dashboard totals updated.
- Reloading retained the created/updated record and locked editing again. An HTTP check confirmed the persisted outcome was Won.
- The browser test record was deleted through the API after exact name/email checks. A follow-up GET returned 404 and the seed count returned to 40. The temporary test server was stopped.
- Desktop and 390px mobile layouts were visually inspected. The document width matched the mobile viewport, with the lead table scrolling within its container.
- A scan for common private-key, AWS, GitHub, and OpenAI credential patterns found no matches in tracked or non-ignored project files. `.env` and `.local/pgdata` were confirmed ignored. This is a limited pattern scan, not a comprehensive security audit.

## Not yet verified

- Push is blocked by an invalid saved GitHub credential. A GitHub CLI device sign-in has been started; the user must authorize it. Render also requires the user to finish signing in within Codex's separate browser session. No cloud resources have been created.
- Public hosting, HTTPS deployment, remote CI execution, and separate-origin CORS in a deployed browser.
- User account roles, tenant isolation, backup restoration, sustained load, or multi-user same-field edit conflicts.
- Jim's independent understanding of the generated implementation.

The test run emitted two upstream dependency deprecation warnings from Starlette's test client; there were no test failures.
