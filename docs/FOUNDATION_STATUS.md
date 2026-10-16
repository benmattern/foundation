# FOUNDATION Current Status

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
documented Render auto-deploy branch. Render deployment status and the live
frontend remain unverified; the live URL or connected provider access is needed. Render integration
has been suggested but is not connected. An automatic cron invocation returned HTTP 200 without timeout. Hosted SQL role
checks confirm owner visibility and isolation from another identity. End-user
authenticated browser operation remains unverified. No owner password
or user session has been requested or created. Private backup/credential artifacts
remain ignored under .deployment.local and must never be printed or committed.

## Implementation update — 2026-10-16

Milestone 01 is implemented locally on `docs/ingestion-assessment-2026-10-16`
after the owner approved the review recommendations. The current working-tree
changes extend reviewed commit `f87efb718ddc8c801d0f399dc7e12027e4284e1c`.

Implemented: authenticated private projects, project-scoped approved articles/
events/dashboard, shared acquisition evidence within an owner, guarded legacy
migrations, RLS/composite foreign keys, transactional review/article/event writes,
durable candidate tags, deterministic versioned rules, explainable routing,
explicit rule reapplication, page-scoped bulk operations with durable results,
server search/count/pagination, source catalog/subscriptions and backend collection
with leases, retries, conditional fetch and run history. Parser and URL guards
are hardened; existing lint errors/dependency warnings and bundle warning fixed.

Local evidence and exact final commands/results are maintained in
`reviews/01-ingestion.md`. Unit/component/database tests use embedded PostgreSQL;
browser tests run Edge against mocked APIs. All three Edge Functions are checked
with Deno separately from the frontend. No AI is configured or required.

Hosted verification remains outstanding: verified legacy owner UUID,
Supabase Auth/PostgREST integration, remaining function deployments, scheduler
capability/cost validation and browser-closed collection. Live inventory and
collector endpoint staging are complete as recorded above. Historical
implementation/live-validation statements below refer to the earlier prototype.

## Assessment update — 2026-10-16

Reviewed main at 030030562e3bf6298005814ff56f78093631fc51.
See [assessment and verification evidence](reviews/01-ingestion.md) and the
[proposed implementation milestone](milestones/01-ingestion.md).
The prior menu of possible next milestones below is historical; the current
planning direction is project-aware automated ingestion, with AI optional.

Code inspection confirms source/article/tag/event workflows, URL capture,
RSS/Atom fetching, candidate staging and single-item review are present.
RSS persistence and duplicate checks run in the browser; no scheduled collector,
research projects, project subscriptions, persistent rule engine, or bulk
review is implemented. Acceptance is sequential, not transactional.

Verification this assessment: source inspection and isolated parser/URL probes.
A clean install failed under Node 24.19.0/npm 11.9.0 on lockfile inconsistencies;
build/lint were not run. No live Supabase/Render checks or database mutations.
Statements of completed/live-tested behavior below are historical project
reports, not new verification. Docs report disabled prototype RLS; actual hosted
policies remain unverified. No migration history is tracked.


## Project Status

FOUNDATION is currently in early Phase 1 development.

The application has moved from initial prototype setup into a functioning modular web application with working foundational CRUD-style flows, Supabase persistence, route-based pages, a service-layer architecture, operational Article <-> Tag relationships, client-side Filtering & Search v1, Article Management v1, Event v1 with Article <-> Event relationships, Event Refinement v1, Events v1.1 Intelligence Summary, Events v1.2 Activity & Analyst Workflow, Seed Data Script v1, Dashboard v1, URL Import v1, URL Metadata Fetch v1.1, Review Queue v1, RSS Ingestion v1, Review Queue UX v1.1-v1.4, Review Queue Preview Enhancement v1, and Review Queue Article Links.

The current focus is:
- establishing core intelligence data structures,
- stabilizing architecture,
- and building foundational workflows before advanced automation or AI-assisted analysis.

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

# Current Deployment Status

## Deployment

The intended deployment flow is:

```txt
VS Code
  -> Git
    -> GitHub
      -> Render Auto Deploy
```

## Environment Variables

Required:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

---

# Current Working Features

# Dashboard

## Implemented
- Shared DashboardLayout
- Sidebar navigation
- Route-based page structure
- Reusable Card component
- Reusable PageHeader component
- Analyst workflow overview dashboard
- Loads sources, articles with tags, tags, and events with articles using `Promise.all`
- Real metric cards for Active Events, Total Events, Articles, and Sources
- Events by status overview
- Most Active Events by supporting article count
- Recently Updated Events by last activity
- Top Tags by article tag occurrence
- Recent Articles by effective article date
- Friendly loading, error, and empty states
- Reuses EventStatusOverview
- Uses `src/lib/dashboardMetrics.ts` for client-side derived dashboard metrics

## Current Status

Complete for v1. Dashboard now provides an event-centered analyst overview using current source, article, tag, and event data.

---

# Sources

## Implemented
- Create source
- Edit source
- Source detail pages
- Source listing
- Supabase persistence
- Service layer integration

## Not Yet Implemented
- Delete source
- Source search/filtering
- Source health/feed status

## Current Database Fields
- id
- name
- url
- category
- notes
- created_at

## Current Status

Operational for create, list, detail, and edit workflows.

---

# Articles

## Implemented
- Create article
- Associate article with a source
- Assign multiple tags during article creation
- Insert `article_tags` records after article creation
- Article listing
- Tag badges displayed on article records
- Published date handling
- Supabase persistence
- Service layer integration
- Articles reload after successful creation
- Edit article title
- Edit article URL
- Edit article summary
- Edit article source
- Edit article published date
- Edit article tags
- Add/remove tags from existing articles
- Retag existing articles
- Delete articles
- Reused ArticleForm for create/edit modes
- Edit/cancel support
- Edit/Delete actions in ArticleList
- Delete confirmation with `window.confirm`
- Articles reload after successful edit/delete
- Client-side search by article title
- Client-side search by article summary
- Client-side filter by one tag
- Client-side filter by one source
- Clear filters button
- Filtered result count
- Filtered empty state
- Link articles to analyst-created events through Event v1
- URL Import v1 for analyst-reviewed article drafts
- URL normalization, UTM cleanup, duplicate warning, and source matching by hostname
- URL Metadata Fetch v1.1 through the deployed `fetch-url-metadata` Supabase Edge Function
- Metadata preview/apply workflow for title, summary, published date, canonical/final URL, and site/source hints
- URL-only fallback when metadata fetch is unavailable or incomplete
- Save URL candidates to Review Queue
- Review Queue v1 using `ingestion_candidates`
- Candidate-to-article conversion after analyst review
- RSS Ingestion v1 using `rss_feeds`
- RSS feed management and manual Fetch Feed Now workflow
- RSS and Atom feed items stage as ingestion candidates
- Review Queue UX v1.1 status tabs and Pending workflow behavior
- Review Queue UX v1.2 sticky review panel and scrollable queue list
- Review Queue Preview Enhancement v1 candidate previews and shared preview helper
- Review Queue UX v1.3 client-side queue search and filters
- Review Queue UX v1.4 analyst-centered review layout
- Review Queue Article Links for opening source articles from queue/review surfaces

## Not Yet Implemented
- Article detail page
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL query params
- Saved filters

## Current Status

Operational for create, list, edit, delete, source association, published date handling, multi-tag assignment, retagging, tag display, and client-side Filtering & Search v1 workflows.

## Current Flow

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
       -> URL Import v1
       -> URL Metadata Fetch v1.1
       -> Review Queue v1
       -> RSS Ingestion v1
       -> Review Queue UX v1.1-v1.4
       -> Review Queue Preview Enhancement v1
       -> Review Queue Article Links
    <-> Events v1
       -> Event Refinement v1
       -> Events v1.1 Intelligence Summary
       -> Events v1.2 Activity & Analyst Workflow
```

---

# Tags

## Implemented
- tags table created
- article_tags join table created
- seed tags added
- tag.ts created
- ArticleWithTags derived application type added
- tagService.ts created
- TagForm component created
- TagList component created
- TagsPage created
- Tags route added
- Sidebar navigation added
- Create/list/delete tags working
- Tags can be assigned to new articles
- Tags display on article records
- Tags can filter articles in Filtering & Search v1

## Current Status

Standalone Tags CRUD and Article <-> Tag relationship workflows are complete for the current stage.

Article tags can be added, removed, and replaced on existing articles through Article Management v1.

---

# Events v1

## Implemented
- events table created
- article_events join table created
- Event TypeScript types added
- eventService.ts added
- EventsPage created
- EventDetailPage created
- EventForm component created
- EventList component created
- Events route added at `/events`
- Event detail route added at `/events/:id`
- Events sidebar navigation added
- Create events
- Edit events
- Delete events
- Link articles to events
- Unlink articles from events
- Replace linked articles through service-layer delete-then-insert behavior
- Event statuses supported: draft, active, resolved, archived
- Event status/type options shared as application constants

## Not Yet Implemented
- Event-owned tags
- Event entities
- Global timeline module
- Event AI suggestions
- Event severity/confidence scoring
- Event date ranges

## Current Status

Complete for v1. Events are analyst-created intelligence objects supported by linked articles.

---

# Event Refinement v1

## Implemented
- EventFilters component
- Client-side search by event title
- Client-side search by event description
- Client-side filter by event status
- Client-side filter by event type
- Clear event filters
- Filtered event result count
- Filtered event empty state
- Shared `eventStatusOptions` and `eventTypeOptions` constants
- EventForm uses shared event status/type constants

## Not Yet Implemented
- Event-owned tags
- Event entity linking
- Global timeline module
- Event AI suggestions
- Event severity/confidence scoring
- Event date ranges
- Server-side event search/filtering
- URL state
- Saved event filters

## Current Status

Complete for v1.

---

# Events v1.1 Intelligence Summary

## Implemented
- `FoundationEventWithArticleTags` derived application type
- `getEventWithArticleTagsById(id)` service function
- Enriched event detail pages with linked articles that include tags
- EventIntelligenceSummary component
- EventArticleTimeline component
- Supporting article count
- Newest supporting article
- Oldest supporting article
- Event age
- Last activity date
- Related tag aggregation from supporting article tags
- Chronological supporting article timeline
- Replaced old linked articles card with supporting article timeline

## Not Yet Implemented
- Event-owned tags
- Event entity linking
- Global timeline module
- Event AI suggestions
- Event severity/confidence scoring
- Event date ranges
- Future dashboard expansion

## Current Status

Complete for v1.1. Event detail pages now function as early analytical workspaces using existing linked article data.

---

# Events v1.2 Activity & Analyst Workflow

## Implemented
- `src/lib/eventMetrics.ts` shared event/date/activity helpers
- `EventSortOption` type
- `EventListItem` type
- EventStatusOverview component
- Status overview cards for Draft, Active, Resolved, and Archived
- Event activity indicators on list cards
- Supporting article count on event list cards
- Last activity on event list cards
- Occurred date on event list cards
- Status, type, and location metadata on event list cards
- Sort control in EventFilters
- Event sorting by newest activity
- Event sorting by newest event
- Event sorting by oldest event
- Event sorting by most supporting articles
- Client-side event activity/count/sort computation in EventsPage
- EventDetailPage reuses shared metric helpers

## Not Yet Implemented
- Event-owned tags
- Event entity linking
- Global timeline module
- Event AI suggestions
- Event severity/confidence scoring
- Event date ranges
- Server-side event sorting/filtering

## Current Status

Complete for v1.2. The Events list page now supports richer analyst scanning before Dashboard v1.

---

# Seed Data Script v1

## Implemented
- `supabase/seed.sql`
- Repeatable fictional Taiwan-focused demo dataset
- 6 demo sources
- 12 demo tags
- 18 demo articles
- 6 demo events
- `article_tags` relationship seed data
- `article_events` relationship seed data
- Fixed UUID strategy for seeded base records
- Seed-only cleanup strategy that targets known demo UUIDs
- Fictional source names and fictional article URLs under `https://example.com/foundation-demo/`
- `[DEMO]` prefixes on seeded article and event titles
- Dataset loaded and validated in the application

## Current Status

Complete for v1. The seed script provides repeatable prototype/demo data for testing article, tag, event, filtering, sorting, and event intelligence-summary workflows.

---

# URL Import v1

## Implemented
- Import from URL card on the Articles page
- URL validation and normalization
- Automatic `https://` prefix when protocol is missing
- Common UTM tracking parameter cleanup
- Duplicate article warning based on normalized URL
- Existing source matching by hostname
- ArticleForm draft prefill with normalized URL and matched source
- Analyst review remains required before article save
- No source auto-creation
- No auto-save

## Current Status

Complete for v1. URL Import improves manual article creation while preserving analyst-reviewed ingestion.

---

# URL Metadata Fetch v1.1

## Implemented
- Deployed Supabase Edge Function at `supabase/functions/fetch-url-metadata`
- Frontend metadata service wrapper
- Metadata preview/apply workflow in ArticleUrlImport
- Lightweight metadata extraction for title, description, site name, canonical/final URL, source hints, and published date
- Metadata warnings for unavailable metadata, URL differences, weak/missing published date, and fetch failures
- URL-only fallback remains available
- Metadata remains transient draft data and is not stored automatically
- No database writes from the Edge Function
- No full article body extraction, paywall bypass, auto-summary, auto-tagging, source auto-creation, or auto-save

## Current Status

Complete for v1.1. The Edge Function has been deployed and validated with live article metadata.

---

# Review Queue v1

## Implemented
- `ingestion_candidates` table created
- Candidate records remain separate from approved `articles`
- Candidate statuses: pending, accepted, rejected, duplicate
- Import source values: manual_url, rss, browser_extension, connector
- `/ingestion` route added
- Ingestion sidebar navigation added
- Save to Review Queue action from URL Import
- Candidate list/review UI
- Accept candidate as article
- Reject candidate
- Mark candidate duplicate
- Candidate-to-article conversion records `converted_article_id`
- Direct ArticleForm creation workflow preserved
- Accept/Reject/Duplicate workflow tested successfully

## Current Status

Complete for v1. Review Queue now acts as the staging layer between URL/RSS intake and approved article records. With subsequent UX passes, it also functions as the analyst triage workspace for previewing, filtering, opening, accepting, rejecting, and marking candidates duplicate.

---

# RSS Ingestion v1

## Implemented
- `rss_feeds` table created
- RSS feed TypeScript types added
- rssFeedService added
- RSS feed management UI added
- `/rss` route added
- RSS sidebar navigation added
- Manual Fetch Feed Now workflow
- Deployed Supabase Edge Function at `supabase/functions/fetch-rss-feed`
- RSS 2.0 parsing
- Atom parsing
- RSS feed items create `ingestion_candidates`
- RSS candidates use `import_source = rss`
- Duplicate skipping against existing ingestion candidates and existing articles
- RSS fetch summary UI with fetched, created, skipped, warning, and error counts
- RSS workflow validated end-to-end

## Not Yet Implemented
- RSS scheduling/automation
- Feed discovery
- OPML import/export
- Feed health monitoring beyond last checked timestamp

## Current Status

Complete for v1. RSS feeds now create Review Queue candidates, not articles, and remain behind analyst review.

---

# Review Queue UX v1.1

## Implemented
- Pending tab
- Accepted tab
- Rejected tab
- Duplicate tab
- Counts by status
- Pending as default view
- Items disappear from Pending after Accept, Reject, or Mark Duplicate
- Automatic workflow-style queue behavior selects the next pending candidate after review

## Current Status

Complete for v1.1. Review Queue now separates pending work from reviewed history.

---

# Review Queue UX v1.2

## Implemented
- Narrower queue list on larger screens
- Wider review panel on larger screens
- Sticky candidate review panel on larger screens
- Independently scrolling queue list
- Mobile single-column layout preserved

## Current Status

Complete for v1.2. Review Queue now reduces scrolling and keeps the active review form in view for analyst efficiency.

---

# Review Queue Preview Enhancement v1

## Implemented
- Candidate cards show compact preview text
- Review panel has a dedicated Preview section
- Shared preview helper added for candidate preview selection
- Preview priority uses `candidate.description`, `raw_metadata.description`, then `raw_metadata.summary`
- Fallback shown when no preview is available
- No AI summaries, first paragraph extraction, article fetch, or article-body storage

## Current Status

Complete for v1. Review Queue now surfaces existing candidate summaries during triage without adding new ingestion behavior.

---

# Review Queue UX v1.3

## Implemented
- Client-side queue search
- Search matches candidate title, URL fields, description, and preview text
- Source filter
- Import-source filter
- Clear filters button
- Filtered empty state
- Filters apply within the selected status tab
- Status tab counts remain status-wide, not filtered counts

## Current Status

Complete for v1.3. Review Queue now supports faster candidate discovery and narrowing at prototype scale.

---

# Review Queue UX v1.4

## Implemented
- Analyst-centered candidate review layout
- Actions moved to the top of the review panel
- Title and Preview moved higher as primary review surfaces
- Compact metadata section for source, published date, and import source
- Tags moved above technical URL details
- Description/Summary moved below tags
- URL, Canonical URL, and Final URL grouped under Technical Details
- Actions repeated at the bottom

## Current Status

Complete for v1.4. Candidate review is now organized around analyst decisions rather than database field order.

---

# Review Queue Article Links

## Implemented
- Candidate title opens the source article in a new tab
- Review panel includes an Open Article link when a URL exists
- Technical URL fields include Open links
- Queue card selection behavior preserved

## Current Status

Complete. Analysts can open source articles quickly from both queue and review surfaces.

---

# Filtering & Search v1

## Implemented
- ArticleFilters component
- Search article title
- Search article summary
- Filter articles by one tag
- Filter articles by one source
- Clear filters
- Filtered result count
- Filtered empty state
- Client-side filtering over loaded `ArticleWithTags[]`

## Not Yet Implemented
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL state
- Saved filters

## Current Status

Complete for v1.

---

# Article Management v1

## Implemented
- Edit article title
- Edit article URL
- Edit article summary
- Edit article source
- Edit article published date
- Edit article tags
- Add/remove tags from existing articles
- Retag existing articles
- Delete articles
- Reused ArticleForm for create/edit modes
- Inline/page-level edit panel
- Edit/cancel support
- Edit/Delete actions in ArticleList
- Native `window.confirm` delete confirmation
- Articles reload after successful edit/delete

## Not Yet Implemented
- Article detail page
- Advanced article workflow states
- Transactional article/tag updates

## Current Status

Complete for v1.

---

# Placeholder Or Planned Areas

## Entities

EntitiesPage exists as a placeholder only. No entity schema, service, or CRUD workflow is implemented yet.

## Events, Timelines, Notes, Settings

Events v1 is implemented. Timeline, notes, and settings workflows are not implemented yet.

## RSS, AI, Financial Signals

RSS Ingestion v1 is implemented for manual feed fetching into Review Queue candidates. RSS scheduling/automation, AI-assisted workflows, and Financial Signals remain future-phase concepts.

---

# Current Frontend Architecture

## Current Structure

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

# Current Architectural Conventions

# Services

## Pattern
- One service file per domain/entity
- Supabase logic isolated to services
- Components/pages do not directly query Supabase

## Current Services
- sourceService.ts
- articleService.ts
- tagService.ts
- eventService.ts
- urlMetadataService.ts
- ingestionCandidateService.ts

---

# Types

## Conventions
- lowercase filenames
- singular naming
- one type file per entity/domain

Examples:
- source.ts
- article.ts
- tag.ts

---

# Current Database Direction

## Current Implemented Direction

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

## Next Milestone

The next milestone is a decision point between:
- Bulk actions
- Keyboard shortcuts
- RSS Automation Planning
- Article Detail Pages
- Source Management Cleanup
- Auth/RLS Planning

## Expanded Long-Term Direction

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

# Immediate Priorities

Next priority:
1. Decide next milestone: Bulk actions, Keyboard shortcuts, RSS Automation Planning, Article Detail Pages, Source Management Cleanup, or Auth/RLS Planning
2. Article detail page / advanced article workflows
3. Source search/filtering or source delete planning

Ingestion roadmap status:
- Manual entry is the current ingestion workflow.
- Seed Data Script v1 is implemented as repeatable fictional prototype/demo data.
- URL Import v1 is implemented.
- URL Metadata Fetch v1.1 is implemented through a deployed Supabase Edge Function.
- Review Queue v1 is implemented as the staging layer for ingestion candidates.
- RSS Ingestion v1 is implemented with manual Fetch Feed Now into Review Queue candidates.
- Review Queue UX v1.1-v1.4 is implemented with status tabs, status counts, Pending workflow behavior, sticky review panel, scrollable queue list, candidate previews, client-side queue search/filter controls, analyst-centered review layout, and article-opening links.
- Current ingestion flow: Manual URL -> Metadata Fetch -> Save to Review Queue; RSS Feed -> Fetch Feed Now -> ingestion_candidates; Review Queue -> accept/reject/duplicate; Accepted -> Article.
- RSS scheduling, browser extension capture, and custom connectors remain planned and should feed Review Queue candidates rather than articles directly.

Open Filtering/Search follow-ups:
- Date filtering
- Multi-tag filtering
- Server-side filtering/search
- URL state
- Saved filters

---

# Mid-Term Priorities

- Entity modeling
- Global timeline module
- Watchlists
- Correlation workflows
- Financial Signals exploration
- AI-assisted summaries

---

# Long-Term Priorities

- Intelligence graph
- Signal detection
- Trend analysis
- Predictive indicators
- Multi-tenant architecture
- Advanced OSINT tooling

---

# Known Technical Debt

## Current Areas To Improve
- Search/filtering is client-side only
- Data normalization
- UI consistency
- Empty shared UI primitives for Button, Input, Textarea, and EmptyState
- Future dashboard expansion scope
- Timeline schema design
- Form validation consistency
- Better typing standardization across components
- Frontend-driven article creation and tag assignment are not transactionally coupled
- Article update and tag replacement are not transactionally coupled
- Article retagging uses delete-then-insert tag replacement
- Event article-link replacement uses delete-then-insert behavior
- Documentation drift between implemented and planned features

---

# Current Security/Auth Status

- No application auth flow is implemented yet.
- RLS is currently disabled for this prototype.
- No local migrations or RLS policies are present in the repo.
- Supabase security must be revisited before public or multi-user deployment.
- Treat the app as private/internal at this stage.

---

# Current Philosophy

## Current Development Focus

Prioritize:
- stable architecture
- modularity
- maintainability
- clean relationships
- operational usefulness

Avoid:
- premature complexity
- overengineering
- unnecessary infrastructure
- premature AI integration

Current focus is building a stable intelligence platform foundation before advanced intelligence workflows.
