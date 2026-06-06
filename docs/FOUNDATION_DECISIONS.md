# FOUNDATION Architectural Decisions

# Purpose Of This Document

This document records important architectural, structural, and strategic decisions made during development of FOUNDATION.

The purpose is to:
- preserve reasoning,
- prevent architectural drift,
- maintain consistency,
- and provide continuity across future development sessions.

This is not intended to be exhaustive documentation.

It is intended to capture:
- major choices,
- important conventions,
- and key tradeoffs.

---

# Core Project Identity

## Decision
FOUNDATION will be developed as a modular OSINT/intelligence platform rather than:
- a simple news aggregator,
- a pure AI tool,
- or a generalized dashboard application.

## Reasoning
The long-term vision requires:
- structured intelligence workflows,
- scalable relationship modeling,
- operational dashboards,
- and analytical tooling.

The project direction is inspired by:
- intelligence workstations,
- observatories,
- geopolitical monitoring systems,
- and long-horizon strategic analysis concepts.

---

# Technology Stack

# Frontend Stack

## Decision
Use:
- React
- TypeScript
- Vite
- Tailwind CSS

## Reasoning
This stack provides:
- rapid development,
- modular architecture,
- strong ecosystem support,
- modern UI flexibility,
- and scalability without unnecessary complexity.

Vite was chosen for:
- speed,
- simplicity,
- and developer experience.

TypeScript was chosen to improve:
- maintainability,
- consistency,
- and long-term scalability.

Tailwind was chosen to:
- accelerate UI iteration,
- enforce design consistency,
- and simplify component styling.

---

# Backend Stack

## Decision
Use:
- Supabase
- PostgreSQL

## Reasoning
Supabase provides:
- authentication,
- PostgreSQL hosting,
- REST/RPC access,
- row-level security,
- and rapid backend iteration.

This avoids premature backend complexity while still supporting:
- scalable schema design,
- relational modeling,
- and future extensibility.

PostgreSQL was chosen because:
- relational data is central to the project,
- structured intelligence relationships matter,
- and SQL querying aligns with analytical workflows.

---

# Deployment Strategy

## Decision
Deploy frontend using:
- GitHub
- Render Static Site

## Reasoning
This deployment model:
- minimizes operational complexity,
- supports rapid iteration,
- provides automatic deployment,
- and keeps infrastructure lightweight during early development.

Current deployment flow:

```txt
VS Code
  -> Git
    -> GitHub
      -> Render Auto Deploy
```

---

# Frontend Architecture

# Route-Based Architecture

## Decision
Use:
- route-based pages
- shared layouts
- reusable components

## Reasoning
This architecture:
- scales cleanly,
- avoids oversized App.tsx files,
- improves maintainability,
- and supports future expansion.

---

# Service Layer Architecture

## Decision
All Supabase/database access should be isolated inside service files.

Examples:
- sourceService.ts
- articleService.ts
- tagService.ts

## Reasoning
This:
- separates UI from data access,
- simplifies components,
- improves maintainability,
- and allows future backend flexibility.

Pages and components should not directly query Supabase.

---

# Type Organization

## Decision
Use:
- lowercase filenames
- singular naming
- one file per entity/domain

Examples:
- source.ts
- article.ts
- tag.ts

## Reasoning
This improves:
- consistency,
- readability,
- import predictability,
- and long-term maintainability.

---

# Component Architecture

## Decision
Use reusable:
- forms
- lists
- cards
- layout components

Examples:
- SourceForm
- SourceList
- ArticleForm
- ArticleList

## Reasoning
This:
- reduces duplication,
- improves consistency,
- and supports scalable UI growth.

---

# UI Direction

## Decision
FOUNDATION should use:
- dark themes
- operational dashboard styling
- intelligence/workstation aesthetics
- modular layouts

## Design Inspirations
- observatories
- intelligence workstations
- strategic operations centers
- monitoring systems

## Reasoning
The visual identity should reinforce:
- operational awareness,
- structured analysis,
- and intelligence workflows.

The UI should feel:
- focused,
- modern,
- analytical,
- and information-dense without becoming cluttered.

---

# Data Architecture

# Relational Intelligence Model

## Decision
The core architecture direction is:

```txt
Sources -> Articles -> Tags -> Entities -> Events -> Timelines
```

## Reasoning
This progression allows:
- incremental complexity,
- stable schema growth,
- and increasingly sophisticated analytical capabilities.

The project intentionally begins with:
- articles and tags
before:
- entities and graph relationships.

---

# Tags Before Entities

## Decision
Implement:
- tags/topics
before:
- structured entities.

## Reasoning
Tags:
- are operationally useful immediately,
- simplify classification,
- help establish taxonomy,
- and avoid premature schema complexity.

Entities will require:
- stronger normalization,
- relationship modeling,
- and more mature schema design.

---

# ArticleWithTags Derived Type

## Decision
Use `ArticleWithTags` as a derived application type rather than expanding the base `Article` type.

## Reasoning
The base `Article` type represents the raw articles table shape. `ArticleWithTags` represents composed application data used by the article list and filtering UI.

This keeps:
- database-row types clear,
- relationship-enriched view types explicit,
- and future article relationships easier to add without blurring raw schema types.

---

# Service-Layer Article/Tag Composition

## Decision
Compose articles with tags in `articleService.ts` using articles, article_tags, and tags queries rather than relying on nested Supabase relationship selects.

## Reasoning
This avoids coupling early application behavior to Supabase-generated relationship naming.

The current approach:
- keeps Supabase access centralized in services,
- makes the composition logic explicit,
- preserves page/component simplicity,
- and is appropriate for the current prototype dataset size.

Nested Supabase relationships can be revisited later if query volume or performance requires it.

---

# Filtering & Search Before Events

## Decision
Complete Filtering & Search v1 before planning or implementing events.

## Reasoning
Filtering and search make the current Sources -> Articles <-> Tags model operationally useful.

This sequence:
- improves analyst workflow immediately,
- validates the usefulness of tags,
- keeps the app focused on core article workflows,
- and avoids adding event complexity before the existing article corpus can be searched and narrowed.

---

# Client-Side Filtering & Search v1

## Decision
Use client-side filtering for Filtering & Search v1.

Implemented filters:
- search article title,
- search article summary,
- filter by one tag,
- filter by one source,
- clear filters,
- filtered result count,
- filtered empty state.

## Reasoning
The current dataset is expected to be small enough for client-side filtering.

This approach:
- avoids premature server-side query complexity,
- avoids URL state and saved-filter architecture too early,
- keeps the service layer focused on loading article/source/tag data,
- and gives immediate workflow value with low implementation risk.

Future server-side filtering/search can be added when data volume, pagination, full-text search, RLS, or performance constraints justify it.

---

# ArticleForm Reuse For Article Management v1

## Decision
Reuse `ArticleForm` for both article creation and article editing.

## Reasoning
Article creation and editing share the same core fields:
- source
- title
- URL
- published date
- summary
- tags

Reusing the form keeps UI behavior consistent, avoids a duplicate edit form, and preserves the current component architecture.

---

# Inline Article Editing For v1

## Decision
Use an inline/page-level edit panel for Article Management v1 instead of a modal or dedicated article detail route.

## Reasoning
The application does not yet have a modal system or article detail routing pattern.

Inline editing:
- keeps ArticlesPage as the orchestration layer,
- minimizes routing complexity,
- avoids modal accessibility/focus concerns,
- and fits the current card-based interface.

A dedicated article detail page remains a future workflow.

---

# Native Delete Confirmation For v1

## Decision
Use native `window.confirm` for article deletion confirmation in Article Management v1.

## Reasoning
This keeps deletion protection simple without introducing a modal system or new design-system primitives.

A custom confirmation component can be introduced later when the UI system matures.

---

# Full Tag Replacement For Article Retagging

## Decision
Retag existing articles by replacing the full set of `article_tags` rows for the article.

Current behavior:
- delete existing `article_tags` rows for the article,
- deduplicate selected tag IDs,
- insert the selected tag IDs,
- allow empty selection to remove all tags.

## Reasoning
Full replacement is simpler and more predictable than calculating tag add/remove diffs in the UI.

This keeps retagging logic centralized in `articleService.ts` and keeps ArticleForm focused on collecting selected tag IDs.

---

# Article Management Before Events

## Decision
Complete Article Management v1 before Event v1 implementation.

## Reasoning
Article records are the central intelligence object in the current platform.

Before adding events, articles should be manageable after creation:
- editable metadata,
- editable source,
- editable published date,
- editable tags,
- retagging,
- and deletion.

This strengthens the existing Sources -> Articles <-> Tags workflow before introducing a new intelligence object.

---

# Events As Analyst-Created Intelligence Objects

## Decision
Implement Event v1 as analyst-created intelligence objects rather than automated or AI-generated detections.

## Reasoning
The current platform is still establishing core intelligence workflows.

Analyst-created events:
- keep humans in control of event definition,
- avoid premature AI inference,
- provide immediate workflow value,
- and create a stable foundation for future assisted event detection.

---

# Article/Event Relationship Through article_events

## Decision
Link articles and events through the `article_events` join table.

## Reasoning
Articles and events are many-to-many:
- one event can be supported by many articles,
- one article can support many events,
- and article evidence should remain explicit.

The join table keeps the relationship normalized and compatible with future event search, timelines, entity links, and analyst workflows.

---

# Event Detail Pages In Event v1

## Decision
Add event detail pages during Event v1 instead of limiting events to a list-only workflow.

## Reasoning
Events are higher-level intelligence objects than individual article cards.

Detail pages provide room for:
- event metadata,
- linked supporting articles,
- edit/delete actions,
- and future refinement such as event timelines, entity links, or analyst notes.

---

# Event Tags, Entities, And AI Suggestions Deferred

## Decision
Defer event tags, event entity linking, and AI event suggestions until after Event v1.

## Reasoning
Event v1 should prove the core manual workflow first:
- create events,
- edit events,
- delete events,
- and link supporting articles.

Adding event tags, entities, or AI suggestions too early would increase schema and UI complexity before the analyst-driven event model is validated.

---

# Service-Layer Replacement For Event Article Links

## Decision
Retain event/article link management in `eventService.ts` and replace the full set of linked articles on event edit.

Current behavior:
- delete existing `article_events` rows for the event,
- deduplicate selected article IDs,
- insert the selected article IDs,
- allow empty selection to remove all article links.

## Reasoning
Full replacement is simple, predictable, and consistent with Article Management v1 retagging behavior.

This keeps link mutation logic centralized in the service layer and avoids UI-side diffing logic during the prototype stage.

---

# Client-Side Event Filtering & Search v1

## Decision
Use client-side filtering/search for Event Refinement v1.

Implemented filters:
- search event title,
- search event description,
- filter by event status,
- filter by event type,
- clear filters,
- filtered result count,
- filtered empty state.

## Reasoning
Events are currently loaded as `FoundationEventWithArticles[]`, and the prototype dataset is expected to remain small enough for client-side filtering.

This approach:
- mirrors Article Filtering/Search v1,
- avoids premature server-side query complexity,
- avoids URL state and saved-filter architecture too early,
- keeps eventService focused on loading and mutating event data,
- and adds immediate analyst workflow value with low risk.

Server-side event search/filtering can be revisited when event volume, pagination, full-text search, RLS, or performance constraints justify it.

---

# EventFilters Component

## Decision
Introduce `EventFilters` as a focused control component for Event Refinement v1.

## Reasoning
This mirrors the existing `ArticleFilters` pattern and keeps `EventsPage` responsible for orchestration while keeping filter controls reusable and presentation-focused.

EventList remains focused on rendering event records and empty states rather than owning filtering behavior.

---

# Shared Event Option Constants

## Decision
Move event status/type option lists into shared constants in `src/types/event.ts`.

Current constants:
- `eventStatusOptions`
- `eventTypeOptions`

## Reasoning
EventForm and EventFilters both need the same event status/type options.

Shared constants:
- prevent local option drift,
- keep event-domain values close to event types,
- and avoid creating a heavier configuration layer before the app needs one.

These constants are application-level UI/type helpers, not database tables.

---

# Event Service Unchanged For Event Refinement v1

## Decision
Do not modify `eventService.ts` for Event Refinement v1.

## Reasoning
The refinement is entirely client-side:
- EventsPage owns filter state,
- EventFilters renders controls,
- EventList renders filtered events,
- and eventService continues loading composed event/article data.

This preserves the service-layer boundary and avoids adding server-side filtering before there is an operational need.

---

# Event Intelligence Summary Before Dashboard v1

## Decision
Implement Events v1.1 Intelligence Summary before Dashboard v1.

## Reasoning
Event detail pages are the first place where event records become analytical workspaces rather than simple CRUD records.

Adding event-level intelligence summaries before dashboard work:
- makes event detail pages more operationally useful,
- validates which event metrics are valuable,
- keeps Dashboard v1 from inventing metrics before event workflows mature,
- and uses existing article/tag/event data without schema changes.

---

# Related Event Tags Derived From Supporting Articles

## Decision
Derive related event tags from tags on supporting articles rather than storing event-owned tags.

## Reasoning
FOUNDATION already has article tags and article-event links.

Deriving related tags from supporting articles:
- avoids adding an `event_tags` table too early,
- keeps event classification grounded in linked evidence,
- prevents confusion between article taxonomy and event-owned taxonomy,
- and preserves the option to add event-owned tags later if analyst workflows require them.

Related tags in Events v1.1 are inferred context, not event-owned metadata.

---

# Event Article Timeline Is Local To Event Detail

## Decision
Implement the supporting article timeline as a local event detail view, not as a global Timeline module.

## Reasoning
The current feature only needs to order linked supporting articles by article date.

Keeping the timeline local:
- avoids premature timeline schema,
- avoids route/module complexity,
- gives immediate analytical value on event detail pages,
- and keeps the future global Timeline module open for broader entity, event, regional, and thematic timelines.

---

# Event Detail Article/Tag Enrichment For Prototype Scale

## Decision
Add `getEventWithArticleTagsById(id)` and reuse existing article/tag enrichment for event detail pages.

## Reasoning
Events v1.1 needs linked articles with tags, but only on the event detail page.

Reusing existing article enrichment:
- keeps Supabase access in services,
- avoids duplicating article/tag composition logic in components,
- keeps the Events list page unchanged,
- and is acceptable for the current prototype dataset size.

A more targeted query can be revisited if article volume or performance constraints require it.

---

# Dashboard Deferred Until Events Provide Richer Data

## Decision
Defer Dashboard v1 until events provide richer analytical data through Event v1, Event Refinement v1, and Events v1.1.

## Reasoning
Dashboard views should summarize meaningful operational workflows.

By enriching event detail pages first, Dashboard v1 can later draw from better-understood event metrics such as:
- event counts,
- supporting article counts,
- recent activity,
- related tags,
- and recent event timelines.

This reduces the risk of building dashboard widgets before the underlying event workflow has useful analytical signals.

---

# Events v1.2 Before Dashboard v1

## Decision
Implement Events v1.2 Activity & Analyst Workflow before Dashboard v1.

## Reasoning
The Events list page is the analyst's current event operations surface.

Improving event list scanning before Dashboard v1:
- makes events more useful immediately,
- validates activity metrics before promoting them into dashboard widgets,
- keeps dashboard work grounded in existing workflows,
- and avoids building dashboard summaries before event list behavior matures.

---

# Client-Side Event Activity Indicators

## Decision
Derive event activity indicators client-side from loaded event and linked article data.

Current derived indicators:
- supporting article count
- last activity
- occurred date
- event type/location metadata
- status badge

## Reasoning
The required data is already loaded as composed event records.

Client-side derivation:
- avoids schema changes,
- avoids service-layer query changes,
- keeps eventService focused on data loading/mutation,
- and is appropriate for prototype scale.

---

# Event Status Overview From Loaded Events

## Decision
Compute Draft, Active, Resolved, and Archived status overview counts from loaded event data.

## Reasoning
Status overview cards are page-level workflow indicators, not persisted metrics.

Using loaded events:
- keeps the overview consistent with the current event list,
- avoids database aggregation queries too early,
- and keeps EventsPage as the orchestration layer.

---

# Client-Side Event Sorting For Prototype Scale

## Decision
Keep event sorting client-side for Events v1.2.

Implemented sort options:
- newest activity
- newest event
- oldest event
- most supporting articles

## Reasoning
Sorting uses derived event/list metrics and the current prototype dataset is expected to stay small.

Client-side sorting:
- avoids server-side sorting complexity,
- avoids schema/index decisions too early,
- and preserves the existing eventService API.

Server-side sorting can be revisited when event volume, pagination, or performance requires it.

---

# Shared Event Metric Helpers

## Decision
Introduce shared event/date/activity helpers in `src/lib/eventMetrics.ts`.

## Reasoning
Events v1.1 and Events v1.2 both need effective article dates, event dates, and last activity calculations.

Shared helpers:
- avoid divergence between EventDetailPage and EventsPage,
- keep page components smaller,
- preserve consistent date fallback behavior,
- and fit the convention that reused derived metric logic belongs in `src/lib`.

---

# Ingestion Elevated As Strategic Roadmap Layer

## Decision
Elevate ingestion as a strategic roadmap layer, while keeping automation unimplemented for now.

Planned ingestion direction:
- manual entry remains current
- Seed Data Script v1 is implemented as near-term support
- URL import
- RSS ingestion
- browser extension capture
- review queue
- custom connectors

## Reasoning
FOUNDATION will eventually need reliable intake workflows, but the current priority remains stable schema, relationships, and analyst review.

Elevating ingestion now:
- clarifies product direction,
- separates test data needs from production ingestion,
- avoids premature automation,
- and keeps future ingestion aligned with analyst-controlled workflows.

---

# Seed Data Script Before Dashboard v1

## Decision
Implement Seed Data Script v1 before Dashboard v1.

## Reasoning
Dashboard v1 needs realistic data to validate useful metrics, recent intelligence views, event activity indicators, and article/tag/event counts.

Adding seed data first:
- gives the dashboard a stable demo corpus,
- improves manual testing of article and event workflows,
- validates event intelligence summaries with linked articles and tags,
- and avoids designing dashboard widgets against empty or inconsistent data.

---

# Fixed UUID Seed Strategy

## Decision
Use fixed UUIDs for all seeded sources, tags, articles, and events in `supabase/seed.sql`.

## Reasoning
Fixed UUIDs make the seed script repeatable and make relationship rows deterministic.

They also allow seed-only cleanup to target known demo records without deleting manually-created data.

---

# Demo-Only Seed Data Policy

## Decision
Seed data must be clearly fictional prototype/demo data.

Current policy:
- fictional source names,
- fictional article titles,
- fictional event titles,
- fictional summaries and event descriptions,
- article URLs under `https://example.com/foundation-demo/`,
- `[DEMO]` prefixes on seeded article and event titles.

## Reasoning
FOUNDATION works in an OSINT/geopolitical domain, so sample data can easily be mistaken for real intelligence.

The seed dataset must support testing and demonstration without implying current real-world reporting or analysis.

---

# Seed-Only Cleanup Strategy

## Decision
Make `supabase/seed.sql` rerunnable by deleting only rows matching the fixed seed UUID set.

The script:
- deletes join-table rows before base records,
- does not truncate tables,
- does not delete manually-created records outside the seed UUID set,
- and reinserts the fictional demo dataset in a transaction.

## Reasoning
This keeps the demo dataset predictable while preserving manual analyst-created data.

Rerunning the script is allowed to refresh seeded demo records because those records are seed-owned by design.

---

# Intelligence Workflow Philosophy

## Decision
FOUNDATION should prioritize:
- analyst augmentation
over:
- analyst replacement.

## Reasoning
The platform should:
- organize,
- surface,
- correlate,
- and structure information.

It should not:
- make autonomous geopolitical conclusions,
- generate unsupported predictions,
- or attempt unsupervised reasoning.

AI should assist:
- filtering,
- summarization,
- and relationship discovery.

Human analysts remain central.

---

# Development Philosophy

# Incremental Architecture

## Decision
Build:
- small,
- modular,
- stable,
- extensible systems.

Avoid:
- large premature systems.

## Reasoning
The project is currently:
- solo-developed,
- evolving rapidly,
- and architecture-sensitive.

Premature complexity would:
- slow development,
- increase maintenance burden,
- and reduce flexibility.

---

# Anti-Overengineering Policy

## Decision
Avoid introducing:
- microservices
- Kubernetes
- distributed systems
- event streaming systems
- graph databases
- complex AI orchestration

until:
- core workflows stabilize,
- schema matures,
- and operational patterns are proven.

## Reasoning
Current priorities are:
- reliable workflows,
- schema stability,
- maintainable architecture,
- and operational usefulness.

---

# Intelligence Domain Focus

## Decision
Initial focus areas include:
- Taiwan
- China
- Indo-Pacific geopolitics
- Semiconductors
- AI infrastructure
- Maritime security
- Supply chains

## Reasoning
These domains:
- are strategically significant,
- contain strong interconnected systems,
- and provide rich opportunities for structured intelligence workflows.

---

# Documentation Strategy

## Decision
Maintain dedicated project documentation including:
- ARCHITECTURE
- STATUS
- BACKLOG
- DECISIONS
- SCHEMA

## Reasoning
As the project grows:
- chat continuity becomes insufficient,
- architectural memory becomes critical,
- and operational clarity becomes necessary.

Documentation serves as:
- onboarding,
- continuity,
- architecture memory,
- and strategic alignment.

---

# Long-Term Direction

## Decision
FOUNDATION should evolve toward:
- structured intelligence analysis,
- relationship-based workflows,
- operational monitoring,
- and strategic awareness systems.

Potential future capabilities include:
- intelligence graphs
- timelines
- watchlists
- AI-assisted analysis
- signal detection
- geographic overlays
- collaborative analyst workflows

## Reasoning
The long-term vision is:
not
- a generic CRUD application,
but
- a modular civilian intelligence platform.
