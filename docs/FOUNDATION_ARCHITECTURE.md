# FOUNDATION Architecture

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
