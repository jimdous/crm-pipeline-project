# V2 verification

## September 13 — local redesign verification

The redesign was deployed on Render at `41cf5b624c035828181629bd82a3fc3afea6b063`. Public cleanup is complete. A final asset-version update prevents cached V1 scripts/styles from being reused with V2 HTML; its deployment and final release gate are recorded in PR #1. The owner approved merging PR #1, which merged as `125b4276ebd54b5169a0e295b5b8f8cf9aee3bce`. See [completion report](COMPLETION_REPORT.md) for the final release record.

- Full redesigned suite: **49 passed, 2 warnings in 6.31 seconds** against PostgreSQL 17. The smoke assertion was updated for the new page title. Initial connection failures came from the stopped local cluster; starting it resolved them. No new tests were added merely to increase the count.
- Local disposable #42, Redesign Verification, was edited through the UI to Closed Won. A direct read confirmed outcome Won and exact value `123456.78`. Reload retained the record and relocked editing.
- After unlocking again, the mobile delete confirmation identified the correct local record. Deletion succeeded; GET #42 returned 404. Analytics returned 40 leads, 28 open, 9 won, 3 lost, 28 follow-ups, active value $11,768,000 and won value $5,080,000.
- Desktop search, combined Closed Won/Alex Chen/Zillow filters, empty search, highest-value ordering, read-only details, invalid-key rejection and valid-key access passed. All four pages returned 40 unique records, with correct first/last page boundaries. Analytics disclosure and private-mode lock/data clearing/re-unlock passed.
- At 390×844, Overview had a 390px document width with no horizontal overflow. Leads and Follow-ups used readable cards. Linda's follow-up card showed contact links, stage, interest, value, agent, last contact and Flagged reason. Read-only details, edit form, create-form keyboard movement from first to last name, and delete confirmation were inspected. The viewport override was reset.
- Access copy now says “reload or lock the workspace.” No speculative change was made to `state.loaded` on lock.
- A real desktop screenshot is saved at `screenshots/v2-overview.jpg`; no mobile screenshot file was saved. Mobile screenshots were inspected in the browser tool.
- Final `node --check` passed for `static/app.js` and `static/config.js`; `git diff --check` passed after the documentation/Pages changes. The full suite was not needlessly rerun for copy/documentation changes.
- GitHub Pages was inspected: it publishes main's root. A redirect for that specific project address was added to send visitors to Render after merge. Live Pages redirect behavior still needs verification after publication.

### Public cleanup and final rollout

- On September 13, the owner explicitly authorized the existing Render key for this app only. Editing unlocked successfully without disclosing the key.
- Immediately before deletion, GET `/leads/41` confirmed ID 41, Deployment Verification, Closed Won, Won, and exact `123456.78`. Only that approved disposable public record was deleted through the UI. A subsequent GET returned 404.
- Public analytics returned exactly 40 leads / 28 open / 9 won / 3 lost / 28 follow-ups / $11,768,000 active / $5,080,000 won. `/health` returned `ok` and `/ready` returned `ready`, both HTTP 200.
- Earlier public create/edit/exact-cents/restart-persistence checks below remain valid; no extra test record was necessary.
- The initial post-deployment browser had cached an old script referencing a removed element. The server script matched the current local file byte-for-byte; a subsequent reload ran the correct interface. Versioned stylesheet/config/app URLs now prevent that known asset mismatch for returning visitors.
- The reported recurring 503 was not reproduced after deployment. The free-tier cold-start limitation still applies.
- Asset-version commit `1f9032ccaee976c0a554f5eb32e5806368809f24` deployed successfully. Both final branch CI runs passed. After owner credential rotation, deployment `dep-dajk3gjm8hqs738jm9rg` remained live at that SHA; authentication/relock, health/readiness and canonical totals passed without displaying the new key.
- PR #1 merged with owner approval. Its tree matched the deployed application. Post-merge endpoints returned 200, #41 remained 404, canonical totals remained intact, and the Pages redirect configuration was publicly served. Release documentation changes do not change executable code.

## September 12 — earlier foundation verification

## Executed successfully

- Branch `codex/crm-v2` is pushed. [PR #1](https://github.com/jimdous/crm-pipeline-project/pull/1) is open, and [GitHub Actions](https://github.com/jimdous/crm-pipeline-project/actions/runs/34647315660) passed on commit `da7cba9`.
- Render deployed the web service and PostgreSQL 17 database from the Blueprint. [The public demo](https://crm-pipeline-v2.onrender.com/) returned 200 for `/`, `/health`, `/ready`, `/docs`, `/config`, `/leads`, and `/analytics`. A POST without the key returned 401.
- Public browser authentication, create, and edit passed using the generated server key. Synthetic lead #41, Deployment Verification, retained its Closed Won stage, derived Won outcome, and $123,456.78 value after Render's Restart service action. Its deletion was completed September 13 as recorded above.
- Public API checks passed for disjoint pagination, all supported sort modes, combined stage/agent/source filters, empty search, and the 28-lead follow-up queue. A CORS preflight from an unapproved origin returned 400 without an allow-origin header. The actual frontend and API share one HTTPS origin.
- The public UI fit a 390×844 viewport without document overflow (390px document width). Mobile search returned Maria Santos, and her details opened with disabled read-only fields. The viewport override was reset afterward.
- Render logs showed a normal process shutdown during restart and successful reads/readiness checks from the replacement instance. Query values and access keys were absent from those application log entries.
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

- Separate-origin frontend hosting is not configured; the app intentionally uses one origin.
- User account roles, tenant isolation, backup restoration, sustained load, or multi-user same-field edit conflicts.
- Jim's independent understanding of the generated implementation.

The test run emitted two upstream dependency deprecation warnings from Starlette's test client; there were no test failures.
