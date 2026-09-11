# V2 verification — September 11, 2026

## Executed successfully

- 31 API integration tests passed against PostgreSQL 17 in a separate test database. Each test used an isolated schema.
- Python modules compiled, JavaScript passed `node --check`, dependencies passed `pip check`, and the diff passed whitespace checks.
- Browser loaded all 40 synthetic leads through the API and rendered SQL-backed metrics.
- Search for Maria returned one matching lead; opening it without a key showed read-only fields.
- A temporary localhost test instance accepted a disposable test access key. The browser created BrowserSmoke TestLead, then changed its stage to Closed Won. Both the row and dashboard totals updated.
- Reloading retained the created/updated record and locked editing again. An HTTP check confirmed the persisted outcome was Won.
- The browser test record was deleted through the API after exact name/email checks. A follow-up GET returned 404 and the seed count returned to 40. The temporary test server was stopped.
- Desktop and 390px mobile layouts were visually inspected. The document width matched the mobile viewport, with the lead table scrolling within its container.
- A scan for common private-key, AWS, GitHub, and OpenAI credential patterns found no matches in tracked or non-ignored project files. `.env` and `.local/pgdata` were confirmed ignored. This is a limited pattern scan, not a comprehensive security audit.

## Not yet verified

- Public hosting, HTTPS deployment, remote CI execution, and separate-origin CORS in a deployed browser.
- User account roles, tenant isolation, backup restoration, sustained load, or multi-user same-field edit conflicts.
- Jim's independent understanding of the generated implementation.

The test run emitted two upstream dependency deprecation warnings from Starlette's test client; there were no test failures.
