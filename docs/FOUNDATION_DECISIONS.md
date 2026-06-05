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
