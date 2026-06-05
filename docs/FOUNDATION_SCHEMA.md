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

The schema is intentionally evolving in layers:

```txt
Sources
  -> Articles
    -> Tags
    -> Entities
      -> Events
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

## Current Direction

Articles are currently the central operational intelligence object.

They are expected to eventually connect to:
- tags
- entities
- events
- timelines
- relationships

---

## Current Relationships

Implemented in the app:

```txt
sources
  -> articles
```

Schema direction documented for next implementation:

```txt
articles
  -> article_tags
  -> tags
```

Future:

```txt
articles
  -> article_entities
  -> entities
```

```txt
articles
  -> article_events
  -> events
```

---

# tags

## Current Implementation Status

The tags and article_tags tables have been created. Standalone Tags CRUD is operational in the app:
- create tags
- list tags
- delete tags

Article-to-tag assignment is not yet implemented.

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

This relationship is documented and table-backed, but the app does not yet provide assignment, display, or filtering workflows.

---

# article_tags

## Purpose

Join table connecting articles and tags.

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| article_id | uuid | FK -> articles.id |
| tag_id | uuid | FK -> tags.id |
| created_at | timestamptz | Creation timestamp |

---

## Relationship Type

Many-to-many:

```txt
articles <-> tags
```

---

## Current App Status

The `ArticleTag` TypeScript type exists. Article-tag service functions and UI workflows are not implemented yet.

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

# events

## Purpose

Represents discrete geopolitical, technological, or operational developments.

Examples:
- military exercises
- sanctions
- elections
- diplomatic meetings
- product launches

---

## Planned Relationship Direction

```txt
articles
  -> article_events
  -> events
```

---

## Potential Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| title | text | Event title |
| description | text | Event description |
| event_date | timestamptz | Primary event timestamp |
| event_type | text | Classification |
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

Current order of implementation:

```txt
Sources
  -> Articles
    -> Tags
      -> Events
        -> Entities
```

Entities intentionally come later.

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

Until migrations are added, verify schema, constraints, and RLS directly in Supabase before assuming production security behavior.

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

Current highest-priority schema/application work:

1. Article <-> Tag relationship management
2. Article tag display and filtering
3. Events
4. article_events
5. Search/filtering support

These systems will establish the operational intelligence foundation for FOUNDATION.
