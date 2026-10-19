# Milestone 07 review

Date: 2026-10-19, America/Los_Angeles. Review branch
`milestone-07-data-workspace`, baseline HEAD
`8357bf5b8d854dcf14db58051e6081349abf19a0`. Reviewed implementation commit:
`5fab44006a91bccd339478de0cd086837f927c05`; subsequent handoff commit changes only
review bookkeeping and upstream-license whitespace.
No merge, deployment, production migration, hosted data write or cost incurred.

Implementation and demo: [milestone 07](../milestones/07-data-workspace.md).

## Local verification results

- npm ci: passed after stopping the owned Vite process to release Windows native-module locks; 0 audit advisories.
- npm run lint: passed, including final implementation.
- npm test: 93 tests / 17 files passed, including real embedded PostgreSQL legacy migration/RLS tests and 24 new import/query/storage tests. IndexedDB tests use fake-indexeddb, not actual disk storage.
- npm run build: passed; analytical code splits lazily; Perspective chunk exceeds Vite's 500 kB advisory. Wasm assets emitted locally.
- npm run check:functions: all three passed with dependency-download network permission; no functions changed.
- npm run test:postgres: all thirteen native concurrency groups passed in a disposable local cluster outside sandbox; no database URL/hosted credentials used.
- Browser acceptance: all 14 repository journeys passed on headless installed Edge, including four new real DuckDB/Perspective journeys; Supabase Auth/project responses are mocked only at foundation-test.invalid. Desktop line/bar and 390px mobile frozen-line screenshots were inspected; chart data and controls are readable and mobile has no document horizontal overflow. Tests await completed explorer initialization before screenshots. First runs found a Perspective asynchronous initialization race and unstable implicit table references, corrected with awaited initialization and the supported named-table/client API. Invalid-SQL testing found a DuckDB MVP exception bug; the EH bundle returns useful errors and recovers for the next query. These are local browser results, not hosted account acceptance.
- Production-bundle check: four Data Workspace journeys also passed against local Vite preview of a build using only the invalid mock host; actual emitted EH Wasm, Perspective Wasm, Blob workers and chart assets run successfully. `FOUNDATION_BROWSER_PREVIEW=1` selects this harness mode; build first with fixture environment values, never point tests at a hosted database.
- Hosted signed-in acceptance: not performed; no authorization for deployment/hosted changes.

## Decisions and limits

All control/data artifacts are browser-local in this milestone, explicitly saved
per owner/project. No schema migration needed; production ledger remains 001–016
as historically recorded. No live baseline query was needed to design unchanged
schema. Managed durable storage, shared citations, query joins across datasets,
remote connections and AI are deferred. No consequential approval needed for
this local-only implementation; deployment remains separately authorized.


## Acceptance evidence

| Scenario | Actual local evidence |
|---|---|
| A: CSV | BOM/quoting/header/null/type validation tests; real typed grid and SQL category filter/grouping, line chart, saved config and frozen input rows. Numeric totals 10/20 checked in rendered preview. |
| B: JSON | Flat organizations/countries/categories/numbers; real Perspective country grouping, sum and Y Bar, rendered screenshot inspected. |
| C: SQL | Real DuckDB SELECT/group totals, saved executed SQL, invalid-field binder error then successful SUM; extra statements/external reader names rejected; quoted reader bypass reaches engine and is denied with zero network reads. |
| D: Recovery | Browser navigation/reload preserves explicit IndexedDB save, named view reruns; confirmed source deletion leaves frozen snapshot inspectable; exact-file hash plus matching field types/units supports tested reimport reconnection. Session-only import disappears after reload. Definitions alone never claim stored results. |
| E: Isolation | Real local browser project switch hides dataset, switching back retains session data, sign-out restores anonymous gate. Unit mocks test foreign-owner/project authorization rejection and separate owner/project storage keys. Existing PGlite migration/RLS and native PostgreSQL tests pass unchanged. No new hosted table/API exists; this is not a test of real hosted Auth. |
| F: Failures | Malformed JSON/CSV, duplicates/reserved fields, nested records, encoding, precision/type, byte/row limits; actual browser storage unavailable, typed import failure/recovery, worker interruption then next query, SQL error/recovery, 5,000-row truncation and external-access denial. IndexedDB tests reject stale revisions; two simultaneous save transactions yield exactly one winner and preserve its commit. |

Screenshots are ignored under `artifacts.local/data-workspace/`; fixtures are
committed under `docs/fixtures/data-workspace/`. No private research or deployment
backups are used. Local checks ran with Node 24.13.0/npm 11.6.2 on Windows.
Sandbox network/socket restrictions initially blocked Deno downloads/native
PostgreSQL startup; both required checks passed with scoped execution permission.

Limitations: no Firefox/Safari or real mobile device acceptance; 390px uses desktop
Edge resized. Browser quota exhaustion is handled transactionally but actual disk
exhaustion/eviction was not forced; unavailable IndexedDB was tested. Worker
interruption is exercised; the 30-second automatic timeout uses the same termination
path but its wall-clock boundary was not separately waited out. File parsing is
bounded but synchronous, so Cancel cannot preempt parsing already on the main
thread. Large 50,000-row performance and browser heap exhaustion were not stress
tested. Vite retains a >500 kB lazy Perspective chunk advisory. Browser persistence
is local convenience, not encrypted/shared/guaranteed durable storage. Original
files are not retained; keep originals for recovery. The upstream visualization
package includes additional native plugins, but FOUNDATION's guided/tested choices
are table, bar and line; no mapping, financial chart workflow or dashboard builder
was implemented. No hosted migration or schema verification is claimed.

## Launch and rollout boundary

`npm ci` then `npm run dev`, use the existing sign-in/project flow and open Data
Workspace. Follow the milestone's fictional fixture demo. Automated isolated demo:
`npm run test:e2e -- data-workspace.spec.ts`. All generated analytical assets are
same-origin, no runtime CDN required. Deploy the complete Vite output (including
Wasm/workers/licenses), retain the SPA rewrite and correct MIME/compression if a
future rollout is authorized. No SQL migration or Edge Function deployment needed.
Merge/deployment and real-account hosted browser acceptance remain separate owner
steps; no new paid services or consequential approval decisions are required here.
