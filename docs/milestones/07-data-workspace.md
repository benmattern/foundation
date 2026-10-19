# Milestone 07: Data Workspace

Approved implementation assignment, 2026-10-19 (America/Los_Angeles).
Baseline: clean main `8357bf5b8d854dcf14db58051e6081349abf19a0`.
Branch: `milestone-07-data-workspace`. No hosted changes authorized.

## Implementation contract

- [x] Native project navigation at `/data`, gated by existing authenticated project selection.
- [x] Guided CSV/JSON inspection, typed fields/units, attribution and validation.
- [x] Session datasets, explicit IndexedDB persistence, saved query/view definitions and separately labeled frozen snapshots.
- [x] DuckDB-Wasm read-only analytical interface, isolated from application database.
- [x] Perspective grid/pivots, filters, sorting, grouping, aggregates, bar/line controls.
- [x] Saved analysis notes, source identity/fingerprint, source recovery and local JSON download.
- [x] Bounded resources, interruption, failed-save recovery and stale-tab write protection.
- [x] Finish browser acceptance A–F and rendered desktop/mobile inspection; see review for actual results.
- [x] Complete handoff documentation and local verification.

## Workflow and boundaries

Choose UTF-8 comma-separated CSV or flat-object JSON (array, or object with a
`records` array), inspect inferred fields, change types/units, provide attribution,
then validate/import. CSV headers can be disabled before choosing a file. Empty
CSV values and missing JSON properties become null. Duplicate/case-colliding
column names, malformed records, nested objects, bad encoding and unsafe JSON
integer precision fail explicitly. Dates are ISO calendar dates; identifier-like
strings with leading zeros remain text. No file content executes as code.

Perspective controls work on the full imported dataset or bounded SQL output.
The SQL editor targets the single table `dataset`; prepared count/group-total
queries are editable. Running SQL never edits original evidence. Saving records
the last executed SQL, not unexecuted editor text. A frozen snapshot is the input
rows for that saved view (up to 5,000), plus field schema and capture time; the
Perspective configuration reproduces its pivot/chart. It is not a screenshot or
an assertion of completeness. Analyst notes remain separate from imported rows.

## Storage and lifecycle

| Mode | What survives | Limit/recovery |
|---|---|---|
| Session | Route navigation in this tab | Lost on reload/sign-out; explicit local save available |
| Browser dataset | Validated rows, schema, units, attribution, original filename, import time, SHA-256 | IndexedDB, this profile/origin only; original bytes are not retained |
| Saved analysis | Query, Perspective configuration, notes, source metadata/fingerprint | Definition only unless snapshot explicitly selected |
| Frozen snapshot | Up to 5,000 input rows, schema, timestamp, truncation flag | Can be inspected after source removal; no refresh |

IndexedDB uses database `foundation-data-v1`, store `workspaces`, key
`JSON.stringify([ownerId, projectId])`, format version 1. Durable writes compare
revisions inside a single readwrite transaction; stale tabs fail instead of
overwriting newer work. Deleting a dataset requires confirmation and retains
saved analyses/snapshots. Deleting an analysis also confirms. Browser storage
failure disables durable saves but permits session work. Data is not uploaded,
encrypted, synced or guaranteed against eviction. Download analysis JSON before
clearing browser site data; the download is an inspectable research artifact,
not a workspace restore format. Keep original files separately for reimport.

Limits: 10 MiB/file, 50,000 records, 80 fields, 100-character field names,
10,000-character cells; each session/durable project workspace at most 12 datasets,
50 saved analyses and 40 MiB serialized. SQL output: 5,000 rows, 80 fields, 10 MiB.
DuckDB requests a 256 MB buffer limit, single thread, terminates its worker on
interrupt/30 seconds (including loading). These are application/engine guards,
not a hard browser heap budget. Parsing is synchronous after bounded file read;
cancellation discards asynchronous work but cannot preempt a synchronous parse.
Perspective memory has no hard cap; import limits bound inputs, not engine heap.

## Security and research integration

The workspace first checks the signed-in identity and existing server-RLS project
list; it verifies project ownership and repeats this before durable mutations.
Local namespace isolation avoids accidental cross-account/project display through
normal UI. It cannot protect data from someone controlling this browser profile,
DevTools, malicious same-origin code or extensions. Supabase remains the authority
for project access; local keys are not a replacement for RLS. No new database
tables, RPCs, storage policies, grants or migrations are needed. Existing database
access tests remain applicable; this adds no hosted data API to attack.

Each query gets a fresh DuckDB worker containing only the selected dataset.
External access, automatic extensions and extension autoload are disabled before
loading rows; configuration is locked before user SQL. A conservative SELECT/CTE
guard and subquery wrapper reject additional statements and external readers.
No credentials, auth session, other datasets or application tables enter DuckDB.
Destroying the worker discards all calculated state. Engine errors preserve source
data. Browser code still runs in the application's origin, not a separate security
principal; do not treat a SQL regex as the sole security boundary.

The smallest research integration is project association, original attribution,
saved analyst note/query/view/snapshot and navigation back to the source. No rows
are inserted into articles. Future common evidence references should add an
explicit dataset/analysis/snapshot reference alongside article evidence, with
server ownership and immutable snapshot identity; do not overload article IDs or
pretend this browser-local artifact is a durable shared citation. Question/finding,
event/entity cross-links and remote/customer-managed data are deferred.

## Dependencies and deployment

Pinned DuckDB-Wasm 1.32.0 (MIT): stable release selected over npm's current
`latest` prerelease 1.33.1-dev57.0. Perspective client/server/viewer/datagrid/charts
5.6.0 (Apache-2.0), maintained namespace replacing deprecated `@finos/*`.
Papa Parse 5.7.0 (MIT), @types/papaparse 5.5.2 and fake-indexeddb 6.2.6 (test only).
Keep third-party license/copyright notices with distributions; see
`THIRD_PARTY_NOTICES.md`. Lockfile pins transitive resolutions. No separate server.

Wasm/worker assets ship with Vite from the same origin, without a runtime CDN.
DuckDB EH (WebAssembly exception handling) and Perspective wasm32 avoid a cross-origin isolation requirement;
modern browser WebAssembly exception handling, workers, Blob URLs and IndexedDB are required, charts
use WebGL. Initial analytical downloads are substantial (DuckDB ~34.2 MB raw,
~7.8 MB gzip); tools load lazily. Serve `.wasm` and worker JS with correct MIME
types and compression. Existing SPA fallback must cover `/data`. HTTPS is required
outside localhost. Firefox/Safari compatibility is not established by Edge tests.
No production merge, migrations, functions or deployment are part of this task.

Primary integration references checked 2026-10-19:
[DuckDB deployment](https://duckdb.org/docs/stable/clients/wasm/deploying_duckdb_wasm),
[DuckDB security](https://www.duckdb.org/docs/current/operations_manual/securing_duckdb/overview),
[Perspective Vite imports](https://perspective-dev.github.io/guide/how_to/javascript/importing.html).
Installed package README/types were also inspected against the pinned versions.

## Owner demonstration

Use Node 24/npm 11; `npm ci`, `npm run dev`. Sign in through the existing UI and
select an authorized project. Open **Data Workspace**. No credentials belong in
fixtures or reports; automated tests use only `foundation-test.invalid`.

1. Import `docs/fixtures/data-workspace/trade.csv`, attribution “Fictional trade”.
   Set value unit to “fictional units”; select browser persistence. Group by month,
   sum value, choose Y Line and Apply view. Open Filters, sorting and pivots to
   restrict category to Chips; save a named analysis.
2. Import organizations.json from the same fixture directory. Group by country,
   sum value, choose Y Bar. Expected country totals A=11, B=9.
3. Run `SELECT month, SUM(value) AS total FROM dataset WHERE category = 'Chips'
   GROUP BY 1 ORDER BY 1` on trade. Expected totals 10, 20, 16. Save a named analysis
   with a note and frozen snapshot; download analysis JSON.
4. Leave/revisit/reload; open the saved analysis. Delete the source after confirming,
   reopen the analysis and inspect its frozen snapshot/unavailable-source message.
   A definition without a snapshot requires reimport; matching exact file hashes and field types/units
   allow a reimported source to reconnect without rewriting the old definition.
5. Switch projects: this local work must not appear. Test session-only import and
   reload loss. Try malformed JSON, type override to an incompatible type, invalid
   SQL and Interrupt analysis. Source records and saved work must remain intact.
