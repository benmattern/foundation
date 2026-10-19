# Milestone 08 review: Research Timelines

Status: implemented and locally verified for development review; **not deployed**.
Branch `milestone-08-research-timelines`, baseline main `58a91ea`.
The reviewed implementation is the branch's `feat: add project research timelines`
commit; the following documentation handoff commit records that exact hash below.
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

## External acceptance / release limits

Migrations 001–016 remain the production baseline. 017 exists only in this branch
and disposable databases; no backup restore of actual production data was
authorized/performed for M08. No real-account hosted timeline acceptance can be
claimed before a separately authorized migration/frontend release. See the
milestone for backend-first rollout and the legacy editor transition window.
Question/entity/browser fixtures exercise UI transport only; SQL tests exercise
real constraints/functions/RLS. Local PostgreSQL 18 and PGlite tests do not prove
hosted PG17 operational behavior. Event audit is separate from the question
session journal, latest 20 entries in detail; evidence metadata is retained, not
the entire publisher body. No browser analytical artifacts become shared citations.
No consequential implementation decision remains for owner approval; release
authorization and signed-in hosted acceptance remain outstanding.
