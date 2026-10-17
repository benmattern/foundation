# FOUNDATION Architecture

## Deployed research sessions and official coverage — 2026-10-17 UTC

Deployed via PR #5, merge e7991e0. Overview's ContinueResearch reads paginated
server changes and advances checkpoints only explicitly, through a captured
transactional upper bound and revision guard. Initial overview obtains an exact
article count; the legacy detailed insights dataset loads only when expanded.
WorkingViews composes validated project-scoped filter definitions with native
Library/Inbox URLs, fixed dates and explicitly relative UTC periods.

`/research/session?question=…` opens the existing question's bounded comparison,
current-question selection and brief workflow. sessionService owns RPC access;
one-statement question packets freeze selected versions and article fingerprints.
brief helpers compose existing analyst prose, selected attributed passages and
deduplicated references; availability changes block stale downloads. Inline preview
renders draft text directly through React. Standalone HTML escapes all text, has
a restrictive CSP, no scripts/remote assets/tokens and works with browser Print.
Markdown syntax remains visible in the print document. Downloads are local only.

Sources retains Discover/Following/saved controls and adds Coverage and calibration.
sourceCatalog holds ten stable official identities and primary verification
metadata; three overlapping optional packs select only explicit subsets. Existing
source decisions/rules are retained. Five endpoints use the unchanged RSS/Atom
collector; unverified/blocked publishers are manual-only. coverageService owns
catalog adoption and bounded count/page/feedback RPCs. IntakeCalibration uses the
existing rule editor/evaluator, applies feed overrides, excludes held-out examples
and highlights useful examples lost by a proposed rule. Saving future rules is
explicit and does not reclassify existing review decisions.

Deterministic synthetic feed/SQL/browser fixtures never contact live Supabase or
publishers. `npm run check:catalog` separately checks five endpoints with timeout
and streamed size cap; external failure is not a CI regression. Coverage/error
observations distinguish persistent feed health from the bounded recent-run sample.
No AI, credibility inference, new connector framework or outward delivery is added.
Migrations 015/016 are deployed and recorded in the ledger; see the new reviews for
backup/rehearsal evidence and the remaining signed-in hosted acceptance boundary.

## Selective intake and connected research - deployed, 2026-10-16

Production migrations 012-014 extend the deployed 01/02 baseline. See the milestone reviews
for exact verification boundaries. Database access remains in services; new
Research/Entities/article-connection pages use project-scoped service reads.

- Source decisions serialize with subscription creation using a project/source
  advisory lock, then lock feed rows. Collector staging retains feed share locks.
  Unfollow preserves subscriptions/rules/evidence and cannot be bypassed by adding
  a new feed. Shared feed availability is independent of project Follow.
- The shared rule evaluator preserves legacy substring behavior and explicitly
  introduces format 2 for OR-of-AND conditions and Unicode whole/literal modes.
  Pinned term groups are immutable version snapshots. SQL scores and paginates
  the entire filtered result before returning a page.
- Research questions, evidence links, article notes, findings, mentions and audit
  history are project/owner constrained. Entity identities/aliases alone are
  owner-wide. Read-only RLS browser grants and security-definer RPCs enforce writes;
  composite FKs reject mismatched joins independently of frontend filtering.
- New text edits use mandatory revision comparisons (null cannot bypass CAS).
  Stable create-request UUIDs prevent duplicate questions/findings/entities/groups
  on retries. Mention fingerprints retain confirmed/dismissed states on rescans.
- Article deletion nulls article references while retaining snapshots, prose and
  audit. Unlink is a reversible flag. Citations validate actual linked article IDs
  and optional passages against separately identified available evidence fields.
- Dictionary suggestions reuse intake normalization and whole-term boundaries;
  they are bounded and explicitly reviewed. Related lists use confirmed identities,
  linked questions or existing manual event joins. No inferred relationship,
  automatic conclusion or publisher independence is asserted.

## Deployed Milestones 01/02 workflow architecture - 2026-10-16

Milestone 01 ingestion is deployed. Its recorded database/function/scheduler and
public frontend verification is in [the ingestion review](reviews/01-ingestion.md).
Milestone 02 is deployed from implementation commit 520223c via PR #2 (merge
c9ff67f). All GitHub CI checks passed. The live Render assets exactly match the
tested build; nine routes pass direct visit/refresh and anonymous sign-in gates,
with no browser errors or failed requests. Desktop/mobile public checks pass.
[The workflow review](reviews/02-project-workflow.md) contains the demo and exact
evidence. The real-account signed-in journey remains unverified. No hosted data,
credentials or configuration were used for regression tests, and this frontend
release required no database or Edge Function change.

ProjectChooser owns account/project selection and a native dialog for creation.
BrowserRouter wraps the authenticated workspace, allowing creation/switching to
land on overview. The selected-project subtree is keyed to discard stale page
state and in-flight view results. Scope edits refresh the project selector.

ProjectOverview derives its counts and next action from current-project
subscriptions, candidate counts, kept articles and relevant feed health. It never
counts owner-wide source records as project configuration. SourcesWorkspace is
shared by /sources and /sources/:id. SourceSetupForm retains successfully saved
IDs across later-stage failures; SourceFeedCard keeps workspace feed management
and raw run details behind disclosure. Subscriptions reuses existing rule saves.

Inbox preserves server filters, visible-page bulk review, tags, history and
review transactions. Keep uses converted_article_id from the review response
and links to the implemented /articles?article=<id> highlight. Library separates
capture-to-Inbox from explicit direct article creation. Events remain available.
Shared Button/Input/Textarea/EmptyState controls and native modal focus handling
use the existing dark theme without an additional component framework.

All persistence remains in existing services/RPCs. No migration, RLS change,
server collector change or new backend endpoint was needed. Check-now success
messages deliberately avoid the collector's cross-project staged total. Health
and advanced run totals are explicitly labeled as shared feed information.

<details>
<summary>Historical planning, implementation and rollout records (superseded where noted above)</summary>

## Production rollout - 2026-10-16

Deployment and use of the postgres role are authorized. The supplied owner UUID
is verified against a confirmed Auth user.
Schema/data logical backups succeeded and were restored into a disposable local
PostgreSQL cluster. The captured live schema/data upgraded successfully with all
legacy IDs and associations preserved. Production migrations 002-011 committed;
the reconciled baseline and all eleven versions are recorded in the ledger.

Production checks preserve 19 sources, 50 articles, 12 tags, 54 article-tag
links, six events, 19 article-event links, 213 preexisting candidates and five
feeds. All public research tables have RLS; no API-role TRUNCATE grant remains.
All three functions are deployed and anonymous POST requests return 401.
Vault-backed five-minute pg_cron/pg_net scheduling is active. A server-authenticated
collection pass returned 200: two feeds succeeded and staged 38 new candidates;
three legacy feeds failed with upstream 403, timeout and DNS resolution errors.
Failures are recorded with retry/backoff; successful feeds continue independently.

Local verification passes: 38 tests, six PostgreSQL concurrency scenarios,
Edge browser workflow, Deno checks for all three functions, lint and production
build without warnings. Actual-backup restore/upgrade rehearsal also passes.
Compatible dependency updates resolve all ten CI audit advisories (zero remaining).
The Linux PostgreSQL harness now uses its own Unix socket directory, and CI
actions use Node 24 runtimes. The corrected GitHub CI run passed every check.
PR #1 is merged to main at daa5e08, publishing the frontend release to the
documented Render auto-deploy branch. Live frontend verification at
https://foundation-ljfo.onrender.com returns HTTP 200 and serves entry assets
matching the tested production build. Headless Edge verifies desktop/mobile
sign-in and required fields without console errors or failed requests.
The owner applied the Render SPA rewrite (/* to /index.html). Hosted Edge
verification now passes direct visits and refreshes on /, /articles, /events,
/ingestion, /rss, /sources, /tags and /project: all return HTTP 200 and display
the sign-in gate. No console errors, page errors or failed requests occurred.
The hosting-route issue is resolved. Signed-in browser workflows remain
unverified against the real account; local browser coverage and live SQL owner
isolation checks pass. An automatic cron invocation returned HTTP 200 without timeout. Hosted SQL role
checks confirm owner visibility and isolation from another identity. End-user
authenticated browser operation remains unverified. No owner password
or user session has been requested or created. Private backup/credential artifacts
remain ignored under .deployment.local and must never be printed or committed.

## Ingestion implementation and operating procedure — 2026-10-16

The current branch contains a local implementation of Milestone 01. Historical
descriptions below are the pre-project prototype. No hosted migration, function
deployment, scheduler activation or paid-plan change has been performed.

### Data and execution

`WorkspaceGate` authenticates an explicitly provisioned account and selects a
private project. Pages use services; article/event/dashboard queries use that
project. Shared acquisition evidence stays within an owner. Approved article
records, edits, tag assignments and event associations belong to projects.

The browser requests `collect-feeds`; it never persists RSS items. Manual and
scheduled requests call the same collector. A verified Auth user must have an
enabled subscription for manual checks. Scheduled requests use a separate
server-only secret. `verify_jwt=false` delegates authentication to the handlers;
it does not make ingestion anonymous. The two metadata fetchers also verify users.

PostgreSQL claims a feed lease, deduplicates acquisitions/origins, checks current
subscriptions, and stages project candidates atomically. Conditional-fetch
validators are retained only after success. Pausing/re-enabling or editing a
subscription invalidates them; intake generations prevent a stale completion
from overwriting a newer subscription change. Partial/error runs retry with
backoff, and stale workers cannot finish or publish after lease replacement.

### Fresh local setup

1. Use Node 24.13.0/npm 11.6.2 or a compatible Node 24/npm 11 release.
2. Run `npm ci`, `npm run lint`, `npm run build`, `npm test`,
   `npm run check:functions`, `npm run test:e2e`, and `npm run test:postgres`.
   Browser tests use installed Edge on Windows; on Linux first run
   `npx playwright install --with-deps chromium`. All browser APIs are mocked at
   an invalid test hostname; tests never use `.env.local` hosted credentials.
   `test:postgres` starts a fresh localhost-only cluster using binaries from
   `PG_BIN` (default PostgreSQL 18 on Windows or 16 on Linux), tests separate
   concurrent connections, then stops/removes its own unique cluster. It never
   uses an existing server or database URL.
3. For the full Supabase stack, install/start Docker, then `npx supabase start`
   and `npx supabase db reset --local`. Automatic seeding is disabled.
4. Provision a disposable Auth user. For fictional seeds, open a local PostgreSQL
   session, set `app.demo_owner_id` to that verified local user UUID, then execute
   `supabase/seed.sql`. The seed is repeatable and never deletes existing research.
5. Copy `.env.example` to `.env.local` using the local URL/publishable key;
   start the frontend and provision the Edge Function settings separately.
   Run `npx supabase functions serve` for local handlers.

### Existing hosted upgrade (requires authorization)

1. Back up database/data and obtain a schema-only export plus the output of
   `supabase/ops/schema-inventory.sql`. The provided table-only export is partial:
   grants, policies, routines, triggers and runtime availability remain unknown.
2. Compare the live objects to baseline 001, reconcile policy/grant/function
   differences, inspect exact/normalized URL collisions, and verify the legacy
   Auth owner UUID. Repeat the upgrade on a disposable database with real-shaped
   sanitized data; inspect article/tag/event/candidate links before and after.
3. Never run baseline 001 against existing tables. The prepared `upgrade.psql`
   runs migrations 002–010 in a single transaction using an explicitly supplied
   `legacy_owner_id` psql variable. Review it before use. Migration 002 refuses
   to assign legacy data without a matching `auth.users` row and refuses unknown
   existing policies. Do not bypass those guards without reconciliation.
4. After successful validation, reconcile the Supabase migration ledger with
   `supabase migration repair --status applied <version>` for each installed
   version, including the verified baseline. Do not replay applied SQL.
5. Deploy all three Edge Functions from their pinned Deno configurations. Set a
   strong `INGESTION_SCHEDULER_SECRET` server-side. Never put the service role or
   scheduler secret into a `VITE_` variable or browser request.
6. Verify pg_cron, pg_net and Vault availability against the actual plan. Store
   `foundation_project_url` and `foundation_scheduler_secret` in Vault; the latter
   matches the Edge secret. Review/apply `supabase/ops/schedule.sql` only after
   an authorized manual collection succeeds. This follows the
   [Supabase scheduling guidance](https://supabase.com/docs/guides/functions/schedule-functions).
7. Deploy the frontend only with the matching database/functions. Test anonymous,
   owner A/owner B, two projects, manual URL fallback, article/events, source
   pause, subscription resume, bulk conflicts and scheduler runs without a browser.

### Defaults, limits and monitoring

Dispatcher cadence: every five minutes (288 invocations/day), up to five due
feeds per invocation; normal polling is hourly. This allows at most 1,440 feed
attempts/day before runtime limits, failures and manual requests. Each feed is
capped at 1 MiB/50 items; each feed supports up to 100 enabled project
subscriptions. HTTP hops use five-second timeouts and at most three redirects;
DNS uses a five-second deadline, database HTTP calls ten seconds. Work stops
starting new items after the per-feed/overall budget and records a retryable
partial outcome. A feed lease expires after four minutes. Backoff starts at five
minutes and is capped by the exponent at 1,280 minutes. Finite windows can miss
older publisher items; no complete backfill is promised.

Success means every usable item in the supported 50-item window was persisted or
deduplicated. A documented item-window warning does not trigger failure backoff;
malformed/oversized XML, invalid-item skips and staging failures do. This avoids
progressively delaying healthy publishers whose feeds contain more than 50 items.

Rows/history are retained indefinitely by default; no purge is scheduled. UI
history shows bounded recent samples. Track storage growth, oldest due feed,
expired leases, partial/error runs, `last_success_at`, pg_cron job results and
pg_net HTTP responses. Successful scheduling SQL only proves dispatch, not that
an Edge Function collected successfully. No live cost estimate or plan capacity
has been verified. Confirm those before activation.

URL guards reject private/reserved literals, mapped IPv6, unsafe DNS answers and
unsafe redirects. DNS validation and the runtime's subsequent connection remain
separate; DNS rebinding/egress enforcement needs verification in the hosted
runtime before treating these checks as a network isolation guarantee.

### Disable and rollback

Disable the scheduler with `select cron.unschedule('foundation-ingestion');`.
Pause subscriptions or archive projects to stop publishing new candidates while
retaining history. Do not roll back to the anonymous frontend against the new
access-controlled schema. For an application rollback, keep authentication/RLS
and disable intake. For a database rollback, restore the verified pre-upgrade
backup into a separate instance and validate before cutover; there is no
destructive down migration that discards newly collected research.

### Demo without AI

Sign in; create two projects; add a source/feed or enable a catalog entry; enable
different subscriptions/rules; preview a sample; collect manually; inspect
Pending/Outside scope and reasons; save tags; bulk review; restore rejected
material; accept with retry; confirm another project and its event tags are
unchanged. Pause/re-enable, inspect run history and repeat collection to check
deduplication. After authorized scheduling, close all browsers and verify a later
run/candidate from the backend. The final hosted step has not been executed here.

## Architecture assessment — 2026-10-16

Current-code findings: [ingestion assessment](reviews/01-ingestion.md).
Proposed extension: [Milestone 01](milestones/01-ingestion.md).

Accepted product direction: ingestion/source management remains useful with AI
disabled. Sources, collection connectors and project subscriptions have distinct
responsibilities. Research projects and scheduled collection are the next
planning direction, not implemented capabilities.

Current RSS orchestration is browser-side after server fetch/parse. The proposal
moves collection persistence, duplicate enforcement and run history server-side,
adds project-scoped rules/review state and establishes a verified migration and
access-control baseline. These technical choices remain proposals for review.
The older next-milestone menu below is superseded as a planning direction.


## Vision

FOUNDATION is an OSINT-focused intelligence and monitoring platform designed to collect, organize, structure, filter, and analyze open-source information.

The long-term goal is to build a modular intelligence operating system capable of supporting:
- geopolitical monitoring,
- technology and semiconductor analysis,
- event and timeline tracking,
- entity relationships,
- AI-assisted analysis,
- and operational awareness workflows.

Initial focus areas include:
- Taiwan
- China
- Indo-Pacific geopolitics
- Semiconductors
- AI infrastructure
- Maritime security
- Supply chain analysis

The platform is intended to evolve from a simple intelligence repository into a structured intelligence and analysis environment.

---

# Current Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Backend
- Supabase
- PostgreSQL

## Deployment
- GitHub
- Render Static Site

---

# Current Architecture

## Frontend Structure

Current frontend architecture uses:
- route-based pages
- shared layouts
- reusable UI components
- service-layer abstraction for Supabase access
- client-side page state for early filtering/search workflows
- inline/page-level article management for early edit/delete workflows
- event detail pages for analyst-created intelligence objects
- client-side event filtering/search over loaded event records
- event detail intelligence summaries derived from supporting articles
- event list activity indicators and sorting derived from loaded event/article data
- repeatable fictional demo data through `supabase/seed.sql`
- Dashboard v1 analyst overview derived from loaded source, article, tag, and event data
- URL Import v1 analyst-reviewed article draft workflow
- URL Metadata Fetch v1.1 through a deployed Supabase Edge Function
- Review Queue v1 for analyst-reviewed ingestion candidates
- RSS Ingestion v1 for manual feed-to-candidate ingestion
- Review Queue UX v1.1-v1.4 for status tabs, Pending workflow behavior, sticky review, scrollable queue review, search/filtering, and analyst-centered review layout
- Review Queue Preview Enhancement v1 for metadata-based candidate previews
- Review Queue Article Links for one-click source article access

### Current Folder Structure

```txt
src/
  components/
  layouts/
  pages/
  services/
  types/
  lib/
```

---

# Current UI Direction

The current UI direction is:
- dark themed
- operational/intelligence focused
- dashboard-oriented
- clean and modern
- modular and scalable

Design themes:
- observatory
- monitoring station
- strategic operations dashboard
- intelligence workstation

---

# Current Features

## Dashboard
- Shared dashboard layout
- Sidebar navigation
- Reusable Card component
- Reusable PageHeader component
- Route-based navigation
- Analyst workflow overview dashboard
- Real metric cards for Active Events, Total Events, Articles, and Sources
- Events by status overview
- Most Active Events by supporting article count
- Recently Updated Events by last activity
- Top Tags by article tag occurrence
- Recent Articles by effective article date
- Friendly loading, error, and empty states
- Client-side derived dashboard metrics through `src/lib/dashboardMetrics.ts`

## Sources

Current functionality:
- Create source
- Edit source
- Source listing
- Source detail pages
- Supabase persistence

Not implemented:
- Source delete
- Source filtering/search

Current source fields:
- id
- name
- url
- category
- notes
- created_at

## Articles

Current functionality:
- Create article
- Associate article with source
- Store article metadata
- Article listing
- Assign multiple tags during article creation
- Display tag badges on articles
- Client-side search by title and summary
- Client-side filter by one tag
- Client-side filter by one source
- Clear filters
- Filtered result count
- Filtered empty state
- Edit article metadata
- Edit article source
- Edit article published date
- Edit article tags
- Add/remove tags from existing articles
- Retag existing articles
- Delete articles
- Link articles to events
- Start article drafts from imported URLs
- Fetch lightweight URL metadata through `fetch-url-metadata`
- Preview/apply metadata before article save
- Save imported URL candidates to Review Queue
- Accept reviewed candidates as articles
- Manage RSS feeds
- Manually fetch RSS/Atom feeds into Review Queue candidates
- Triage Review Queue candidates with previews, search, source/import filters, and one-click source article links

Not implemented:
- Article detail page
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL state
- Saved filters

## Tags

Current functionality:
- Create tag
- List tags
- Delete tag
- Assign tags to new articles
- Display tags on article records
- Filter articles by one tag

## Events

Current functionality:
- Create event
- List events
- View event detail pages
- Edit event
- Delete event
- Link articles to events
- Unlink articles from events
- Replace linked articles through service-layer delete-then-insert behavior
- Track event status as draft, active, resolved, or archived
- Search events by title and description
- Filter events by status
- Filter events by event type
- Clear event filters
- Display filtered event result count
- Display filtered event empty state
- Display event intelligence summaries on event detail pages
- Display supporting article count, newest/oldest article, event age, and last activity
- Aggregate related tags from supporting article tags
- Display a chronological supporting article timeline
- Display event status overview cards
- Display event activity indicators on the Events list page
- Sort events by newest activity, newest event, oldest event, and most supporting articles

Not implemented:
- Event-owned tags
- Event entity linking
- Global timeline module
- Event AI suggestions
- Event severity/confidence scoring
- Event date ranges

---

## RSS

Current functionality:
- RSS feed management
- RSS route at `/rss`
- RSS sidebar navigation
- Manual Fetch Feed Now workflow
- Supabase Edge Function feed fetching through `fetch-rss-feed`
- RSS 2.0 parsing
- Atom parsing
- Feed item staging as Review Queue candidates
- Duplicate skipping against existing candidates and articles
- Fetch summary UI

Not implemented:
- RSS scheduling/automation
- Feed discovery
- OPML import/export

---

# Current Data And Workflow Model

Current implemented flow:

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
    <-> Events v1
       -> Event Refinement v1
       -> Events v1.1 Intelligence Summary
       -> Events v1.2 Activity & Analyst Workflow
       -> Seed Data Script v1
       -> Dashboard v1
       -> URL Import v1
       -> URL Metadata Fetch v1.1
       -> Review Queue v1
       -> RSS Ingestion v1
       -> Review Queue UX v1.1-v1.4
       -> Review Queue Preview Enhancement v1
       -> Review Queue Article Links
```

Long-term relational direction:

```txt
Sources
  -> Articles
    -> Tags
    -> Events
    -> Entities
      -> Timelines
        -> Relationships
```

---

# Current Milestone Status

Completed:
1. Sources foundation
2. Articles foundation
3. Standalone Tags CRUD
4. Article <-> Tag relationships
5. Filtering & Search v1
6. Article Management v1
7. Event v1
8. Event Refinement v1
9. Events v1.1 Intelligence Summary
10. Events v1.2 Activity & Analyst Workflow
11. Seed Data Script v1
12. Dashboard v1
13. URL Import v1
14. URL Metadata Fetch v1.1
15. Review Queue v1
16. RSS Ingestion v1
17. Review Queue UX v1.1
18. Review Queue UX v1.2
19. Review Queue Preview Enhancement v1
20. Review Queue UX v1.3
21. Review Queue UX v1.4
22. Review Queue Article Links

Next milestone:
- Decision point between Bulk actions, Keyboard shortcuts, RSS Automation Planning, Article Detail Pages, Source Management Cleanup, and Auth/RLS Planning

Seed Data Script v1, Dashboard v1, URL Import v1, URL Metadata Fetch v1.1, Review Queue v1, RSS Ingestion v1, Review Queue UX v1.1-v1.4, Review Queue Preview Enhancement v1, and Review Queue Article Links are complete. The next milestone has not started.

---

# Current Services

## Existing Service Layer

Current services include:
- sourceService.ts
- articleService.ts
- tagService.ts
- eventService.ts
- urlMetadataService.ts
- ingestionCandidateService.ts
- rssFeedService.ts

Service layer is intended to:
- isolate Supabase logic
- simplify component structure
- improve maintainability
- support future backend flexibility

Article service currently composes `ArticleWithTags` from articles, article_tags, and tags rather than relying on nested Supabase relationship selects.

Event service currently composes events with linked articles from events, article_events, and articles. Events are analyst-created intelligence objects supported by article evidence.

Event Refinement v1 keeps event filtering/search client-side in EventsPage and does not require eventService changes.

Events v1.1 enriches event detail pages with linked articles that include tags. Related tags and supporting article timelines are derived from supporting articles, not stored as event-owned tags or global timeline records.

Events v1.2 adds event list activity indicators, status overview cards, sorting, and shared event metric helpers. Metrics are derived client-side from loaded event/article data.

Dashboard v1 is the Presentation Layer's first analyst overview. It loads existing source, article/tag, tag, and event/article data and derives event-centered dashboard metrics client-side for prototype scale.

URL metadata and ingestion candidate workflows use service wrappers to keep Edge Function calls and candidate database access out of page/component code.

RSS feed workflows use `rssFeedService.ts` to keep feed persistence, Edge Function invocation, duplicate checks, and feed-to-candidate creation out of page/component code.

---

# Ingestion And Acquisition Architecture Direction

Ingestion is elevated as a first-class architecture layer. The current implementation supports analyst-reviewed manual entry, URL intake, seed data, RSS intake, and Review Queue staging.

## Acquisition Layer

Current acquisition surfaces:
- Manual Entry
- Seed Data
- URL Import
- URL Metadata Fetch
- RSS Ingestion
- Review Queue

Manual Entry:
- manual source entry
- manual article entry through ArticleForm
- manual event creation and article linking
- direct article creation preserved for analyst-authored records

Seed Data:
- Seed Data Script v1 at `supabase/seed.sql`
- repeatable fictional Taiwan-focused prototype data
- demo sources, articles, tags, events, article_tags, and article_events
- fixed UUID seed strategy and seed-only cleanup

URL Import:
- URL Import v1 for article draft creation
- URL normalization and duplicate article warning
- source matching by hostname
- Save to Review Queue from URL Import

URL Metadata Fetch:
- URL Metadata Fetch v1.1 through the deployed `fetch-url-metadata` Supabase Edge Function
- metadata preview/apply workflow with analyst review before save
- metadata remains transient draft data

RSS Ingestion:
- RSS Ingestion v1 through `rss_feeds`
- RSS feed management UI
- manual Fetch Feed Now workflow
- `fetch-rss-feed` Supabase Edge Function
- RSS 2.0 and Atom parsing
- duplicate skipping against candidates and articles
- RSS feed items create `ingestion_candidates`

Review Queue:
- Review Queue v1 through `ingestion_candidates`
- analyst triage workspace for URL and RSS intake candidates
- candidate list/review UI
- Pending, Accepted, Rejected, and Duplicate tabs with counts
- Pending as the default analyst inbox
- candidate-card preview text from existing descriptions/metadata
- client-side queue search
- source and import-source filters
- clear filters and filtered empty state
- status tab counts remain status-wide
- reviewed candidates move out of Pending after action
- sticky review panel and independently scrolling queue list on larger screens
- analyst-centered review panel organized around decisions rather than schema order
- top and bottom action rows
- one-click article links from candidate titles, review panel, and technical URL fields
- accept/reject/duplicate workflow
- candidate-to-article conversion after analyst review

Current demo/acquisition support:
- Seed Data Script v1 at `supabase/seed.sql`
- repeatable fictional Taiwan-focused prototype data
- demo sources, articles, tags, events, article_tags, and article_events
- fixed UUID seed strategy and seed-only cleanup

Planned ingestion layers:
- RSS scheduling/automation
- feed discovery
- OPML import/export
- browser extension capture
- custom connectors

Review Queue candidates are staging records, not approved intelligence. Accepted candidates become articles through analyst action. Rejected and duplicate candidates remain outside `articles`.

RSS feeds create candidates, not articles. Analyst review is the central ingestion gate for Manual URL and RSS intake. Future RSS scheduling, browser extension capture, and custom connectors should feed Review Queue candidates rather than creating articles directly.

---

# Current Deployment Workflow

Current deployment flow:

```txt
VS Code
  -> Git
    -> GitHub
      -> Render Auto Deploy
```

Environment variables currently required:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

---

# Planned Core Data Models

## Sources

Represents external information sources.

Examples:
- news organizations
- think tanks
- government agencies
- research institutions
- RSS feeds

## Articles

Represents individual intelligence items or reports.

Examples:
- news articles
- press releases
- analysis pieces
- official statements

## Tags

Represents topics or classifications.

Examples:
- Taiwan
- China
- Semiconductors
- Export Controls
- PLA Navy

## Events

Represents analyst-created intelligence objects for discrete incidents or developments.

Examples:
- military exercises
- sanctions
- elections
- product launches
- diplomatic meetings

## Entities

Represents structured real-world objects.

Examples:
- countries
- organizations
- companies
- technologies
- individuals

---

# Known Technical Debt

## Current Areas To Improve
- Filtering/search is client-side only
- Data normalization
- More consistent type organization
- Better form validation
- Improved UI consistency
- Future dashboard expansion scope
- Ingestion roadmap implementation scope
- Timeline schema design
- Article creation and tag assignment are frontend-driven separate operations
- Article update and tag replacement are frontend-driven separate operations
- Article retagging uses delete-then-insert tag replacement
- Event article-link replacement uses delete-then-insert behavior

---

# Architectural Principles

## Current Philosophy

Prioritize:
- modularity
- clarity
- extensibility
- stable schema design
- operational usefulness

Avoid premature:
- microservices
- overengineering
- complex infrastructure
- excessive automation

Current focus is:
- building a stable foundation
- establishing reliable workflows
- structuring intelligence data correctly

---

# Long-Term Vision

FOUNDATION is intended to evolve into a modular civilian intelligence platform capable of:
- structured research,
- operational monitoring,
- intelligence analysis,
- trend discovery,
- and strategic awareness.

Potential future capabilities:
- AI-assisted analysis
- relationship graphing
- map overlays
- timeline intelligence
- watchlists
- alerting systems
- collaborative analysis
- Financial Signals
- hardware/sensor integrations

The project direction is heavily inspired by:
- observatories
- intelligence systems
- geopolitical analysis platforms
- long-horizon systems analysis
- Foundation-series concepts
- strategic warning systems

</details>
