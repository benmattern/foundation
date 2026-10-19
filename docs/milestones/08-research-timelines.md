# Milestone 08: Research Timelines

Deployed 2026-10-19 through [PR #8](https://github.com/benmattern/foundation/pull/8),
merge `627aec6`, after separate owner deployment authorization. Migration 017 was
rehearsed against a fresh private backup and applied atomically before the frontend.
[Review evidence](../reviews/08-research-timelines.md) records CI, preservation and
hosted verification. Real-account signed-in acceptance remains outstanding.

## Delivered checklist

- [x] Extend existing Events, `/events` and `/events/:id`; keep all original IDs,
  owners, projects, timestamps and article-event relationships.
- [x] Vertical project timeline with year/month headings, concise accounts,
  date/type/status/classification and explicit association counts.
- [x] Calendar precision, uncertain dates, ranges and undated records; no creation
  or publication timestamp masquerades as occurrence.
- [x] Server filters for date overlap, type, text, article, publisher, entity and
  research question; ascending/descending order and 50-record pages.
- [x] Explicit article/entity/question associations, per-reference notes and
  article context/support/challenge roles; server-captured attribution.
- [x] Detail/editor, deletion confirmation, revision guards, retry receipts,
  owner/project enforcement, retained unavailable references and audit history.
- [x] Filter URLs and return navigation through existing research screens;
  existing active-project context, shared controls, desktop/mobile layout.
- [x] Fictional SQL/browser acceptance and real PostgreSQL concurrency checks.
- [x] Documentation and runnable demonstration workflow.
- [x] Authorized backup/upgrade rehearsal, production migration and deployment.
- [ ] Real-account signed-in hosted acceptance after an authorized release.

## Event/date contract

The original `events` table is extended by migration
`20261019222428_research_timelines.sql` (017); there is no competing event store.
`date_start`/`date_end` retain entered `YYYY`, `YYYY-MM` or `YYYY-MM-DD` text.
The database validates real calendar dates, rejects year zero and inverted
ranges, and requires a start when an end is supplied. `date_approximate` marks
uncertainty, with free-form `date_note` explaining its basis. Approximation does
not infer a confidence interval or invent a day.

Generated dates `timeline_start`/`timeline_end` are **sort/filter bounds**, not
display dates: year means January 1–December 31; month means its first–last day;
an exact date means that day; a range takes the start's lower bound and end's
upper bound. Order is start bound ascending or descending, then event UUID
ascending for every tie. Undated events come last in both orders. Ranges group
under their start year/month; year-only dates display “Month unknown”; undated
records have their own group. Groups may resume on subsequent pages. Approximate
and exact entries sharing the same bound tie by UUID, with no confidence ranking.
Date filters include overlapping ranges and exclude undated entries.

Legacy `occurred_at` is preserved exactly. Migration backfills its UTC calendar
date for grouping and marks `date_origin=legacy_timestamp`. It briefly disables
only the existing updated-at trigger during this backfill, so original analyst
timestamps remain unchanged. The UI displays the original timestamp and UTC
grouping explicitly. Editing chronology switches to explicit calendar dates;
the original timestamp stays available separately, including after clearing an
occurrence date. Other event fields and joins are preserved, not reconstructed.
Dashboard occurrence labels also preserve partial precision; sort bounds are
never printed as newly precise historical dates.

Occurrence, article publication, original collection (`collected_items.created_at`),
project approval/manual capture (`articles.created_at`), and analyst event
creation/update times are labelled separately. Missing values remain unknown.

## Evidence and research associations

`event_references` is a small event-specific association table. `kind` currently
accepts article/entity/question only; its identity/snapshot structure can later
be extended for durable structured observations without changing event identity.
It does not expose browser-local Data Workspace snapshots as server citations.
There is no general shared evidence framework or cross-device dataset storage.

Existing `article_events` backfills into explicit article references. The guarded
save RPC synchronizes active available article references back into that join,
so old article/question/dashboards continue to see existing relationships.
Entity associations are deliberate owner-scoped selections, not automatic
promotion of suggested mentions. Entities remain owner-wide as in Milestone 04;
an event and its association remain scoped to one authorized project. Questions
and articles must belong to that same project.

The server freezes record title, URL, source identity/name and relevant times
when first linked. Client-supplied snapshots cannot forge attribution. This is
metadata retention, not a frozen full article body. Original acquisition identity,
when present, remains visible; no count claims independent corroboration. Account
classification distinguishes source-reported, analyst-observed, unverified and
disputed accounts; separate analyst notes carry interpretation. Article reference
roles and association notes are explicit analyst judgments.

Removing a reference marks it unlinked and records before/after state. Deleting
its underlying record sets the live FK to null while retaining original target
identity and metadata; detail shows unavailable and omits its internal record
link. Direct UUID filters still match a retained active reference. Search pickers
only offer live authorized records; an unavailable reference cannot be added to
an unrelated event. Event deletion removes only its joins/references, retaining
underlying research and an audit tombstone with reference snapshots.

## Database/API boundaries

Existing `save_event(uuid,jsonb,uuid)` is extended rather than duplicated.
Edits lock the event row and require its current integer `version`; the new UI
always supplies a request UUID for creates/edits. Identical requests serialize
through an advisory transaction lock and return the same surviving event,
without another mutation/history row. Reusing a request for different content,
project or operation fails. A retry after later deletion cannot resurrect it.
Legacy tokenless creation remains compatible but has no retry guarantee; the
retired versionless edit/delete paths fail safely. Unused browser legacy
mutation helpers were removed; read composition helpers remain available.

`remove_timeline_event(project,id,expected_version,request_id)` guards deletion
and deduplicates retries. `event_requests` retains receipts after event deletion.
Receipts currently have no automatic expiry; a later retention policy must not
re-enable duplicate retries. Event edits/deletions append `research_history`
before/after snapshots. The detail UI returns the latest 20 changes; this is not
a replacement for Milestone 05's question/session change journal.

`timeline_page`, `timeline_event` and `timeline_options` authorize through
`require_project` before consulting filters. Pages cap at 50, option searches
at 25, offsets at 1,000,000, references at 200, payload at 200 KB. Text fields
have explicit limits. Queries are parameterized SQL; no client SQL evaluation.
New tables allow authenticated owner SELECT only with RLS; direct writes and
TRUNCATE are revoked. Internal security-definer helpers revoke browser EXECUTE.
RPCs alone handle atomic validation, CAS, authorized target locks, join sync,
attribution capture, audit and receipts. No new scheduler, Edge Function, AI
provider, paid service or runtime dependency was introduced.

## Demonstration / review

Use Node 24.13.x/npm 11.6.x. `npm.cmd ci`, then
`npm.cmd run test:e2e -- tests/browser/timeline.spec.ts --headed` exercises the
actual app with clearly fictional transport fixtures and no hosted credentials.
Omit `--headed` for automated execution. The harness owns its Vite server and
uses `foundation-test.invalid`; set `FOUNDATION_BROWSER_PORT=4174` if 4173 is busy.
Screenshots appear under ignored `test-results/timeline-*.png`.

For interactive real persistence, first provision an **isolated local/development**
Supabase database using migrations 001–017, configure only its URL/publishable key
in an ignored `.env.local`, create a local Auth user and run `npm.cmd run dev`.
Production now includes 017; use isolated credentials for regression tests.
Existing isolated SQL tests need no hosted project or Auth password. A standalone
SQL-only PostgreSQL test database is not a Supabase Auth/PostgREST app backend.

1. Select a project; open **Timeline**. Create clearly fictional events in 2023,
   March 2024 and April 2024, including year-only, approximate range, exact and
   unknown dates. Verify headings and reverse order; unknown stays last.
2. On an event, edit associations: select a fictional library article, owner
   entity and project question. Set a source role/note and analyst interpretation.
3. Inspect publisher and distinct dates. Open the article and **Return to event**;
   **Back to timeline** preserves filter/order/page URL. Question/entity links
   use their existing screens; those screens offer associated timeline links.
4. Filter by entity, question, publisher/article, type and date overlap. A filter
   with no match differs from a project with no events. Browse more than 50
   events using Next/Previous. Refresh or Retry after a simulated read failure.
5. Open the same event in two tabs; save one, then attempt the stale draft.
   Confirm rejection and preserved draft; explicitly reload before reapplying.
   Cancel deletion once, then confirm it; the article/entity/question survive.
6. Inspect narrow/mobile cards and long accounts. Suggested mentions do not
   create event associations. No AI or Data Workspace import is required.

## Release requirements and limits

The original assignment excluded deployment; the owner subsequently authorized it.
The 2026-10-19 release captured a fresh backup, rehearsed 017 on an isolated restore,
compared all original values/joins, checked grants/RLS and applied only 017 atomically.
Production ledger is now 001-017. These remain requirements for future migrations.
Existing 001–017 must not be replayed.
The release applied 017 before its frontend; the old deployed editor's versionless
edits/deletes rejected safely during the brief transition. For future rollbacks,
a frontend rollback alone cannot restore legacy mutations. Prefer forward fixes
and preserve new audit/reference data. No Edge Function deployment is needed.

Release verification confirmed the ledger, all emitted asset hashes, preserved
article joins, hosted SQL and public routes. Owner signed-in mobile/desktop
acceptance is still outstanding. Mock browser or isolated SQL tests do not establish
hosted Auth/PostgREST/real-account behavior.
Exact filtered counts and offset pagination can become expensive at very large
scale and can shift during concurrent inserts; keyset pagination/approximate
counts can follow measured need. Filters currently show selected record UUIDs;
missing reference search choices do not silently broaden filters. History is
bounded in detail. Future enhancements include durable structured evidence,
entity relationship mapping and richer time navigation; Gantt/maps/graphs/AI
extraction remain outside this milestone. No consequential owner decision is
outstanding for this implemented scope.
