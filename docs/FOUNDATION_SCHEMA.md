# FOUNDATION Schema

# Purpose Of This Document

This document defines the current and planned database schema direction for FOUNDATION.

The purpose is to:
- document current tables,
- preserve relationship architecture,
- clarify schema intent,
- and maintain consistency as the platform evolves.

This document should evolve alongside migrations, new entities, and architectural changes.

---

# Current Schema Philosophy

FOUNDATION is being designed as a relational intelligence platform, not a flat content repository.

The current implemented model is:

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
    <-> Events v1
       -> Event Refinement v1
```

The schema is intentionally evolving in layers:

```txt
Sources
  -> Articles
    -> Tags
    -> Events
    -> Entities
      -> Timelines
        -> Relationships
```

This allows gradual complexity, stable iteration, and future analytical expansion.

---

# Current Tables

# sources

## Purpose

Represents external intelligence sources.

Examples:
- news organizations
- government agencies
- think tanks
- research institutions
- RSS feeds

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Source name |
| url | text | Source URL |
| category | text | Source category |
| notes | text | Optional notes |
| created_at | timestamptz | Creation timestamp |

---

## Current Relationships

```txt
sources
  -> articles
```

One source can have many articles.

---

# articles

## Purpose

Represents individual intelligence items.

Examples:
- news articles
- reports
- press releases
- analysis pieces
- official statements

---

## Current Fields Reflected In App Types

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| source_id | uuid | Nullable FK to sources.id |
| title | text | Article title |
| url | text | Article URL |
| summary | text | Optional summary |
| published_at | timestamptz | Optional published timestamp |
| created_at | timestamptz | Creation timestamp |

---

## Current Relationships

Implemented in the app:

```txt
sources
  -> articles
```

```txt
articles
  -> article_tags
  -> tags
```

```txt
articles
  -> article_events
  -> events
```

Future:

```txt
articles
  -> article_entities
  -> entities
```

---

# tags

## Current Implementation Status

The tags and article_tags tables are operational in the app:
- create tags
- list tags
- delete tags
- assign multiple tags to new articles
- display tag badges on article records
- filter articles by one tag in Filtering & Search v1

## Purpose

Represents operational intelligence classifications/topics.

Tags are intentionally lightweight and flexible.

Examples:
- Taiwan
- China
- Semiconductors
- Export Controls
- PLA Navy

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Unique tag name |
| description | text | Optional description |
| created_at | timestamptz | Creation timestamp |

---

## Current Relationship Direction

```txt
articles
  -> article_tags
  -> tags
```

Many-to-many relationship.

One article can have many tags.

One tag can belong to many articles.

---

# article_tags

## Purpose

Join table connecting articles and tags.

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| article_id | uuid | FK -> articles.id; on delete cascade |
| tag_id | uuid | FK -> tags.id; on delete cascade |
| created_at | timestamptz | Creation timestamp; default now() |

---

## Keys And Constraints

The table uses a composite primary key:

```txt
(article_id, tag_id)
```

This prevents duplicate tag assignments for the same article.

---

## Relationship Type

Many-to-many:

```txt
articles <-> tags
```

---

## Current App Status

The `ArticleTag` TypeScript type exists.

Article-tag service logic is operational through article creation:
- Article creation inserts the article row first.
- Selected tag IDs are inserted into `article_tags`.
- Articles reload after successful creation.

Article-tag replacement is operational through Article Management v1:
- Editing an article can replace its assigned tags.
- Existing `article_tags` rows for the article are deleted.
- Selected tag IDs are reinserted.
- Empty tag selection removes all tags from the article.
- Tag IDs are deduplicated before insertion.

---

# Derived Application Types

# ArticleWithTags

`ArticleWithTags` is a derived frontend/application type, not a database table.

It represents an article row composed with its related tag records:

```txt
ArticleWithTags = Article & { tags: Tag[] }
```

Current use:
- ArticlesPage loads composed article records with tags.
- ArticleList displays tag badges from `ArticleWithTags.tags`.
- ArticleFilters performs client-side tag/source/search filtering over loaded `ArticleWithTags[]`.
- Article Management v1 uses `ArticleWithTags` to populate edit state and retag existing articles.

---

# FoundationEventWithArticles

`FoundationEventWithArticles` is a derived frontend/application type, not a database table.

It represents an event row composed with its linked article records:

```txt
FoundationEventWithArticles = FoundationEvent & { articles: Article[] }
```

Current use:
- EventsPage loads composed event records with linked articles.
- EventList displays event summaries and linked article counts.
- EventDetailPage displays event metadata and supporting articles.
- EventForm uses article IDs to create or replace event/article links.
- EventFilters performs client-side event status/type/search filtering over loaded `FoundationEventWithArticles[]`.

---

# Filtering & Search v1

Filtering & Search v1 required no schema changes.

Current implementation:
- client-side only
- searches article title
- searches article summary
- filters by one tag
- filters by one source
- supports clear filters
- displays filtered result count
- displays filtered empty state

Not implemented:
- date filtering
- multi-tag filtering
- server-side filtering/search
- URL query params
- saved filters

---

# Article Management v1

Article Management v1 required no schema changes.

Current implementation uses the existing `articles` table and `article_tags` join table to:
- edit article title
- edit article URL
- edit article summary
- edit article source
- edit article published date
- edit article tags
- add/remove tags from existing articles
- retag existing articles
- delete articles

Article deletion relies on the existing `articles` table and the `article_tags.article_id -> articles.id on delete cascade` relationship.

Article retagging is implemented in the service layer with delete-then-insert replacement of `article_tags` rows.

---

# Event Refinement v1

Event Refinement v1 required no schema changes.

Current implementation:
- client-side only
- searches event title
- searches event description
- filters by event status
- filters by event type
- supports clear filters
- displays filtered event result count
- displays filtered event empty state

Shared event status/type options are application constants in `src/types/event.ts`, not database tables.

Not implemented:
- event tags
- event entity linking
- timeline visualization
- event AI suggestions
- event severity/confidence scoring
- event date ranges
- server-side event search/filtering
- URL query params
- saved event filters

---

# events

## Current Implementation Status

The events table is operational in the app:
- create events
- list events
- view event detail pages
- edit events
- delete events
- link articles to events
- unlink articles from events

## Purpose

Represents analyst-created intelligence objects for discrete geopolitical, technological, or operational developments.

Examples:
- military exercises
- sanctions
- elections
- diplomatic meetings
- product launches
- export controls
- cyber incidents

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | Event title |
| description | text | Optional event description |
| event_type | text | Event classification |
| status | text | Constrained event status |
| occurred_at | timestamptz | Optional primary event timestamp |
| location | text | Optional location |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Update timestamp |

---

## Status Values

Implemented event statuses:
- draft
- active
- resolved
- archived

---

## Current Relationship Direction

```txt
articles
  -> article_events
  -> events
```

Many-to-many relationship.

One event can be supported by many articles.

One article can support many events.

---

# article_events

## Purpose

Join table connecting articles and events.

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| article_id | uuid | FK -> articles.id; on delete cascade |
| event_id | uuid | FK -> events.id; on delete cascade |
| created_at | timestamptz | Creation timestamp; default now() |

---

## Keys And Constraints

The table uses a composite primary key:

```txt
(article_id, event_id)
```

This prevents duplicate article links for the same event.

---

## Relationship Type

Many-to-many:

```txt
articles <-> events
```

---

## Current App Status

Event/article linking is operational through Event v1:
- Event creation can insert linked `article_events` records.
- Event editing can replace linked articles.
- Existing `article_events` rows for the event are deleted.
- Selected article IDs are reinserted.
- Empty article selection removes all article links from the event.
- Article IDs are deduplicated before insertion.

---

# Planned Tables

# entities

## Purpose

Represents structured real-world objects.

Examples:
- countries
- organizations
- companies
- technologies
- individuals

---

## Planned Relationship Direction

```txt
articles
  -> article_entities
  -> entities
```

---

## Potential Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Entity name |
| entity_type | text | Country/org/company/etc |
| description | text | Optional notes |
| created_at | timestamptz | Creation timestamp |

---

# timelines

## Purpose

Represents chronological analytical views of:
- entities
- events
- regions
- organizations
- technologies

---

## Planned Direction

Timelines may eventually become:
- generated views,
- query layers,
- or dedicated schema objects.

Current implementation approach is undecided.

---

# financial_signals

## Purpose

Potential future area for market, company, sector, and economic signals relevant to geopolitical analysis.

Current status:
- conceptual only
- no schema implemented
- no application workflow implemented

---

# relationships

## Purpose

Represents explicit structured connections between entities.

Examples:
- organization ownership
- strategic alliances
- technology dependencies
- geopolitical relationships

---

## Long-Term Direction

Potential future structure:

```txt
entities
  -> relationships
  -> entities
```

---

# Current Relationship Strategy

# Phase 1 Strategy

Current focus:
- simple relational modeling
- stable schema growth
- operational usefulness

Current implemented relationship:

```txt
Sources
  -> Articles
    <-> Tags
       -> Filtering/Search v1
       -> Article Management v1
    <-> Events v1
       -> Event Refinement v1
```

Next milestone:
- Dashboard v1 / Events v1.1 decision point

Entities, timelines, and advanced event refinements intentionally come later unless explicitly reprioritized.

---

# Current Data Modeling Principles

## Normalize Carefully

Avoid:
- premature over-normalization,
- excessive abstraction,
- and unnecessary complexity.

Prioritize:
- usability,
- maintainability,
- and schema clarity.

---

# Relationship Philosophy

The schema is intended to support:
- analytical workflows,
- structured intelligence,
- and future relationship mapping.

This is not:
- a simple CMS,
- a blogging platform,
- or a flat news archive.

The schema is designed for:
- correlation,
- filtering,
- classification,
- and operational awareness.

---

# Planned Future Schema Features

# Search Infrastructure

Potential future additions:
- full-text search
- vector search
- semantic indexing
- hybrid filtering

---

# AI-Assisted Metadata

Potential future additions:
- AI-generated summaries
- auto-tagging
- entity extraction
- topic clustering

---

# Intelligence Graph Direction

Long-term possibilities:
- relationship graphing
- connected intelligence analysis
- multi-hop relationship exploration
- signal correlation

Current status:
- conceptual only
- not yet implemented

---

# Multi-Tenant Direction

Potential future schema support:
- organizations
- workspaces
- user roles
- tenant isolation

Not currently implemented.

---

# Security And Migration Tracking

No database migrations, RLS policies, or auth configuration are currently tracked in this repo.

RLS is currently disabled for the prototype. Supabase security must be revisited before public or multi-user deployment.

---

# Current Schema Constraints

Avoid introducing:
- graph databases
- distributed data systems
- event streaming architectures
- excessive schema abstraction

until:
- core workflows stabilize,
- operational requirements mature,
- and relationship patterns become clearer.

---

# Current Schema Priority

The next schema-impacting direction has not started.

Current candidate directions:
1. Dashboard v1 / Events v1.1 decision point
2. Dashboard Improvements v1
3. Article detail page / advanced article workflows

Filtering & Search v1, Article Management v1, and Event Refinement v1 are complete and required no schema changes. Event v1 is implemented with `events` and `article_events`.
