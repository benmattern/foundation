# Milestone 08 review: Research Timelines

## Production deployment - 2026-10-19

Owner separately authorized deployment after implementation review. [PR #8](https://github.com/benmattern/foundation/pull/8)
merged as `627aec6c1cdbdd32cfb1715ea607eb5da284bf22`, release head
`d1a5b578cefa54fba48d9379edc8bd59445235bc`. Both
[PR CI 39337127210](https://github.com/benmattern/foundation/actions/runs/39337127210) and
[merged-main CI 39337442586](https://github.com/benmattern/foundation/actions/runs/39337442586)
passed every stage on Linux: clean install, lint/build, 103 SQL/unit tests, 16 browser
journeys, 14 native PostgreSQL concurrency groups and all three Edge checks.

Fresh private schema/data/ledger backup restored exactly into disposable local
PostgreSQL, then upgraded through 017 with **all 4,319 original rows and values
preserved across 34 tables**. Production migration 017 committed atomically before
frontend release, including its exact ledger version `20261019222428`. All original
values were compared again inside the migration transaction. Six event IDs,
original occurrence/analyst timestamps and 19 article joins survived; 19 explicit
reference snapshots backfilled. The original updated-at trigger is enabled and
both new tables have RLS; browser TRUNCATE grants remain revoked. No old migration
was replayed and no collector/Edge/infrastructure configuration changed.

Hosted SQL verification exercised authorized date ranges/overlap filters, reference
pickers and article/entity/question associations, attribution snapshots, history,
retry deduplication, changed-request/stale edit/delete rejection, unavailable
evidence, preserved research and deletion retry/no-resurrection. Same-owner
cross-project links, foreign-owner RPC/RLS, anonymous/internal-helper and direct
write attempts were denied. **Every fictional verification write rolled back.**
Final audit found six events, 19 original joins, 19 backfilled references and no
persisted event request/history fixtures. All four new PostgREST endpoints are
discoverable and reject anonymous execution with permission-denied responses.

Live: https://foundation-ljfo.onrender.com/events. Existing GitHub main → Render
auto-deployment published `/assets/index-DqG4Davz.js`. All **12 emitted assets**
match the tested local build by SHA-256, including Wasm binaries and worker;
Wasm MIME is correct. Twenty-two direct/refresh/auth-gate cases cover the timeline,
filtered/detail URLs and existing research/data routes. Inspected 1440px/390px
public sign-in screenshots pass without overflow, browser errors or failed requests.
Signed-in hosted timeline acceptance was **not** exercised; no account password or
browser session was used. Public gates/byte checks are distinct from that acceptance.

Security advisor comparison retained existing findings: two RPC-only journal tables
with RLS/no policies, legacy search-path warnings, public pg_net and the existing
Auth password-protection setting. The signed-in SECURITY DEFINER count rose from
31 to 35 for the four deliberately authorized timeline endpoints; owner/project
guards and anonymous/direct-write denials were verified. No new unguarded helper
or table exposure was introduced. See Supabase's
[RPC exposure guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[search-path guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[extension guidance](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public),
[RLS policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), and
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Unrelated settings were not changed during release.

Private backups/SQL receipts remain ignored under `.deployment.local/release08`;
public hash/browser receipts and screenshots under `artifacts.local/release08`.
Remaining external acceptance: owner signs in and reviews the timeline on desktop
and mobile using the documented demo. No implementation/release decision remains.
Production ledger is 001–017; do not replay it or attempt a frontend-only rollback
to restore retired versionless mutations.

## Historical implementation review before deployment

Status at implementation handoff: locally verified for development review.
Branch `milestone-08-research-timelines`, baseline main `58a91ea`.
Reviewed implementation: `109c16bfa491c052ddeece68e2a5b126549f62d1`
(`feat: add project research timelines`). The subsequent handoff commit changes
documentation only.
No merge, push, hosted mutation, production migration or deployment was performed.

## Scope and decisions

See the [milestone](../milestones/08-research-timelines.md) for delivered checklist,
date/evidence contracts, demonstration and eventual rollout requirements.
The existing event schema, IDs, article joins and routes are extended. New local
migration 017 adds precise calendar semantics, explicit evidence associations,
retry receipts and guarded operations; no new dependencies or AI are needed.
M07's browser-local Data Workspace is untouched.

Baseline verification on 2026-10-19 was **read-only hosted catalog inspection**,
not a historical assumption: ledger 001–016, PostgreSQL 17.6, actual event/join
columns, constraints, triggers, RLS/grants and deployed save/delete definitions.
Original `save_event` had atomic article links but no CAS/retry protection; 017
adds those. No live research rows were copied into regression fixtures. The CLI
generated the tracked migration locally; no Supabase push/apply was used.

Routine choices: use existing `/events` routes with “Timeline” navigation; UTC
group legacy timestamps while retaining them verbatim; represent missing date
precision as text and compute bounds only for sorting/filtering; use explicit
article/entity/question references with frozen attribution; use existing
`research_history` for event audits rather than expanding the session journal.
Owner-wide entity semantics are preserved; project authorization still governs
each association. These choices require no additional scope/cost approval.

## Verification record

Environment: Windows, Node 24.13.0, npm 11.6.2. Fictional isolated fixtures only.

| Check | Result |
| --- | --- |
| `npm.cmd ci` | Passed, 359 packages, zero reported vulnerabilities. An earlier locked Lightning CSS file was released by stopping the identified previous local preview; clean install then passed. |
| `npm.cmd run lint` | Passed. |
| `npm.cmd run build` | Passed; existing Data Workspace chunk-size advisory is non-fatal. |
| `npm.cmd test` | 103 tests passed across 19 files, including 7 timeline database cases and 3 date/navigation/display cases. |
| `npm.cmd run test:e2e` | Passed all 16 journeys, including 2 new timeline journeys and the 14 existing regressions. |
| `npm.cmd run check:functions` | All 3 unchanged Edge Functions passed Deno checks after rerunning with registry/cache access. Initial sandbox registry fetch failed. |
| `npm.cmd run test:postgres` | Passed all 14 native concurrency groups, including new timeline create/delete retries and stale writer lock-wait rejection. Initial sandbox database startup failed; permitted localhost rerun passed. |
| Rendered review | Inspected actual 1440px and 390px screenshots of populated timeline; mobile overflow assertion passes. Also inspected the 390px evidence/detail screenshot; no horizontal overflow. |

The first full browser run overlapped source edits and one existing Data Workspace
file-type selector timed out after the form disappeared. The clean final run,
with source changes complete, passed all 16 without a product/test workaround.
Initial implementation checks also caught and corrected a render-time grouping
mutation, a TypeScript compatibility narrowing issue and a missing dashboard
formatter import; the final lint/build/test results above are subsequent passes.

### Database coverage

- Upgrade 001–016 with fictional pre-existing event/article join, then apply 017;
  preserve UTC timestamp meaning, original `updated_at`, IDs and original joins.
- Leap-calendar validation, year zero, invalid/inverted ranges, year-only bounds,
  uncertain dates, date overlap and unknown occurrence without created-at fallback.
- Explicit article/entity/question references, attribution snapshots, per-reference
  judgments, edits and audit; underlying article deletion retains unavailable
  reference identity/metadata. Unlinking and event deletion preserve research.
- 53 equal-date records across 50/3 pages, UUID tie order stable in both directions,
  undated last; server counts, live option pages 25/1 and unauthorized associations.
- Duplicate request retries, changed-payload rejection, missing/stale revisions,
  retired versionless deletion rejection, guarded delete retries, audit tombstone,
  no resurrection when a save retry follows deletion.
- Authenticated owner success; foreign-owner RPC/RLS denial; another same-owner
  project's article/question rejection; foreign entity denial; anonymous EXECUTE
  rejection; no browser direct updates or TRUNCATE grants. Native independent
  PostgreSQL connections verify actual lock waits, not mocked concurrency.

### Browser acceptance mapping

A/B: fictional year-only, exact, approximate range and undated events; year/month
headings, deterministic rendering, reverse-order URL and date filter behavior.
C: explicit article reference, intact publisher/publication/collection attribution,
article navigation and return link. D/E: manual entity/question association and
filters, with actual project/owner enforcement separately verified in SQL.
F: create/edit, failed-save retry with retained draft, stale error, canceled/confirmed
deletion and surviving article. G: SQL authorization covers actual database
boundaries; transport fixtures do not pretend to test hosted Auth.
H: initial-empty versus filtered-empty, populated/long accounts, loading/error/retry,
bounded 50-record UI pages and narrow viewport. Screenshots are ignored local
review artifacts, regenerated by the test suite.

## External acceptance / release limits at implementation handoff

At the implementation handoff, migrations 001–016 were the production baseline. 017 existed only in the branch
and disposable databases; no backup restore of actual production data was
authorized/performed for M08. No real-account hosted timeline acceptance can be
claimed before a separately authorized migration/frontend release. See the
milestone for backend-first rollout and the legacy editor transition window.
Question/entity/browser fixtures exercise UI transport only; SQL tests exercise
real constraints/functions/RLS. Local PostgreSQL 18 and PGlite tests do not prove
hosted PG17 operational behavior. Event audit is separate from the question
session journal, latest 20 entries in detail; evidence metadata is retained, not
the entire publisher body. No browser analytical artifacts become shared citations.
At that point release authorization and signed-in acceptance were outstanding.
The subsequent authorization, deployment and remaining signed-in acceptance boundary
are recorded in the production deployment section above.
