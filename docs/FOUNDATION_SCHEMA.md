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
       -> Events v1.1 Intelligence Summary
       -> Events v1.2 Activity & Analyst Workflow
       -> Seed Data Script v1
       -> Dashboard v1
       -> URL Import v1
       -> URL Metadata Fetch v1.1
       -> Review Queue v1
       -> RSS Ingestion v1
       -> Review Queue UX v1.1/v1.2
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

# FoundationEventWithArticleTags

`FoundationEventWithArticleTags` is a derived frontend/application type, not a database table.

It represents an event row composed with linked article records that include their related tags:

```txt
FoundationEventWithArticleTags = FoundationEvent & { articles: ArticleWithTags[] }
```

Current use:
- EventDetailPage loads enriched event detail data through `getEventWithArticleTagsById(id)`.
- EventIntelligenceSummary derives supporting article count, newest/oldest article, event age, last activity, and related tag aggregation.
- EventArticleTimeline renders linked articles chronologically from article dates.

Related event tags are inferred from supporting article tags. They are not stored as event-owned tags and no `event_tags` table exists.

The event article timeline is local to the event detail page and is derived from linked article dates. It is not a global Timeline module.

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

# Events v1.1 Intelligence Summary

Events v1.1 Intelligence Summary required no schema changes.

Current implementation:
- enriches event detail pages with linked articles that include tags
- derives supporting article count from linked articles
- derives newest and oldest supporting articles from linked article dates
- derives event age from `events.occurred_at`
- derives last activity from the later of `events.updated_at` and newest linked article date
- aggregates related tags from supporting article tags
- renders a chronological supporting article timeline from linked article dates

Related tags are inferred from `articles -> article_tags -> tags`.

The supporting article timeline is an event-detail view over existing linked articles, not a global timeline schema or module.

Not implemented:
- event-owned tags
- event entity linking
- global timeline module
- event AI suggestions
- event severity/confidence scoring
- event date ranges

---

# Events v1.2 Activity & Analyst Workflow

Events v1.2 Activity & Analyst Workflow required no schema changes.

Current implementation:
- derives event activity indicators from loaded events and linked articles
- derives supporting article count from linked articles
- derives last activity from `events.updated_at` and linked article dates
- derives occurred date from existing event date fields
- computes event status overview counts from loaded event data
- sorts events client-side by newest activity, newest event, oldest event, and most supporting articles

The `eventMetrics` helpers in `src/lib/eventMetrics.ts` are application logic, not schema.

Not implemented:
- event-owned tags
- event entity linking
- global timeline module
- event AI suggestions
- event severity/confidence scoring
- event date ranges
- dashboard improvements

---

# Seed Data Script v1

Seed Data Script v1 required no schema changes.

The repeatable demo seed file exists at:

```txt
supabase/seed.sql
```

Current implementation:
- seeds fictional prototype/demo data only
- uses fixed UUIDs for seeded sources, tags, articles, and events
- uses seed-only cleanup targeting known demo UUIDs
- does not truncate tables
- does not delete manually-created data outside the seed UUID set
- seeds `sources`, `articles`, `tags`, `events`, `article_tags`, and `article_events`
- uses fictional source names and fictional article URLs under `https://example.com/foundation-demo/`
- prefixes seeded article and event titles with `[DEMO]`

The seed file supports the existing implemented schema and relationship model. It is not a migration and does not create or alter tables.

---

# Dashboard v1

Dashboard v1 required no schema changes.

Current implementation:
- loads existing sources, articles with tags, tags, and events with linked articles
- derives metric cards for Active Events, Total Events, Articles, and Sources
- derives Events by status from loaded event status values
- derives Most Active Events from supporting article counts
- derives Recently Updated Events from event/article activity dates
- derives Top Tags from article tag occurrence counts
- derives Recent Articles from effective article dates

The `dashboardMetrics` helpers in `src/lib/dashboardMetrics.ts` are application logic, not schema.

Dashboard v1 is client-side for prototype scale. Server-side dashboard aggregation, materialized views, or dashboard-specific tables are not implemented.

---

# URL Import v1

URL Import v1 required no schema changes.

Current implementation:
- creates transient article draft data in the frontend
- normalizes URLs and removes common UTM tracking parameters
- detects duplicate existing articles by normalized URL
- matches existing sources by hostname
- prefills ArticleForm with URL and matched source
- requires analyst review before article save

URL Import v1 can either prefill the direct ArticleForm workflow or save a candidate to Review Queue. It does not create articles automatically.

---

# URL Metadata Fetch v1.1

URL Metadata Fetch v1.1 required no schema changes.

Current implementation:
- uses the deployed `fetch-url-metadata` Supabase Edge Function
- fetches lightweight URL metadata
- returns title, description, site name, published date, canonical URL, final URL, source hints, and warnings
- keeps metadata as transient draft data
- does not write to the database from the Edge Function
- does not store raw metadata automatically
- requires analyst review before article save

The Edge Function is an acquisition helper, not a schema object or ingestion persistence layer.

---

# Review Queue v1

Review Queue v1 uses the implemented `ingestion_candidates` table.

Current implementation:
- stores pre-article ingestion candidates separately from approved articles
- supports manual URL candidates from URL Import
- supports RSS candidates from RSS Ingestion v1
- stores transient URL metadata as reviewable candidate data
- allows analysts to accept, reject, or mark candidates duplicate
- converts accepted candidates into records in the existing `articles` table
- records `converted_article_id` after acceptance

Review Queue uses the existing articles schema on acceptance. It does not create a separate approved intelligence record type.

Current ingestion flow:

```txt
Manual URL
  -> Metadata Fetch
    -> ingestion_candidates

RSS Feed
  -> Fetch Feed Now
  -> ingestion_candidates

Review Queue
  -> analyst review
    -> accepted candidate creates article
    -> rejected/duplicate candidates stay out of articles
```

Candidate conversion is implemented in the service layer as sequential prototype-scale operations, not as a database transaction or stored procedure.

---

# RSS Ingestion v1

RSS Ingestion v1 uses the implemented `rss_feeds` table and the existing `ingestion_candidates` table.

Current implementation:
- stores RSS feed configuration in `rss_feeds`
- fetches feeds manually through Fetch Feed Now
- uses the deployed `fetch-rss-feed` Supabase Edge Function
- parses RSS 2.0 and Atom feed items
- creates `ingestion_candidates` for non-duplicate feed items
- marks RSS-created candidates with `import_source = rss`
- skips duplicates already present in ingestion candidates or approved articles
- records feed/item metadata in candidate `raw_metadata`

RSS feeds create candidates, not articles. Analyst review in Review Queue remains the central ingestion gate before approved article creation.

Current RSS-to-candidate workflow:

```txt
rss_feeds
  -> Fetch Feed Now
    -> fetch-rss-feed Edge Function
      -> RSS/Atom items
        -> duplicate check against ingestion_candidates and articles
          -> ingestion_candidates with import_source = rss
            -> analyst review
              -> accepted candidate creates article
```

RSS scheduling, feed discovery, OPML import/export, and broader feed-health workflows are not implemented.

---

# rss_feeds

## Purpose

Stores RSS/Atom feed configuration for manual feed ingestion.

Feed records are acquisition configuration, not approved intelligence records. Items fetched from feeds are staged as Review Queue candidates.

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| feed_url | text | RSS or Atom feed URL |
| source_id | uuid | Nullable FK to sources.id for source association |
| title | text | Optional analyst/feed title |
| is_active | boolean | Whether the feed is active for ingestion planning |
| last_checked_at | timestamptz | Last manual fetch timestamp |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Update timestamp |

---

## Current Relationships

```txt
rss_feeds
  -> sources
```

Optional source association through `source_id`.

```txt
rss_feeds
  -> ingestion_candidates
```

RSS-created candidates reference the feed in `raw_metadata.feed_id`; there is no dedicated foreign key from `ingestion_candidates` to `rss_feeds` in the documented app type.

---

## Current App Status

RSS Ingestion v1 is operational:
- Analysts can create RSS feed records.
- Analysts can list and edit RSS feed records.
- Analysts can manually fetch a feed.
- Feed items are parsed from RSS 2.0 or Atom.
- Non-duplicate feed items create Review Queue candidates.
- Fetch summary UI reports fetched, created, skipped, warning, and error information.

---

# ingestion_candidates

## Purpose

Staging table for ingestion candidates before they become approved article records.

An ingestion candidate is a pre-article intake record produced by URL Import, RSS ingestion, or future browser extension or connector workflows. Candidates are not approved intelligence records until an analyst reviews and accepts them.

---

## Current Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| url | text | Original or normalized candidate URL |
| canonical_url | text | Optional canonical URL from metadata |
| final_url | text | Optional final URL after redirects |
| source_id | uuid | Nullable FK to sources.id for matched source |
| title | text | Candidate title from metadata or analyst edit |
| description | text | Candidate description/summary draft |
| published_at | timestamptz | Optional candidate published timestamp |
| import_source | text | manual_url, rss, browser_extension, connector |
| status | text | pending, accepted, rejected, duplicate |
| raw_metadata | jsonb | Lightweight fetched metadata, not full article body |
| warnings | jsonb | Metadata/import warnings |
| converted_article_id | uuid | Nullable FK to articles.id after acceptance |
| rejection_reason | text | Optional analyst rejection note |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Update timestamp |
| reviewed_at | timestamptz | Optional review timestamp |

---

## Status Values

Implemented candidate statuses:
- pending
- accepted
- rejected
- duplicate

`stale` remains a possible future status but is not part of Review Queue v1.

---

## Import Source Values

Implemented import source values:
- manual_url
- rss
- browser_extension
- connector

Implemented current sources:
- manual_url
- rss

Future planned sources:
- browser_extension
- connector

---

## JSONB Fields

`raw_metadata` stores lightweight metadata returned by ingestion helpers, such as requested URL, final URL, canonical URL, title, description, site name, published date, source hints, and warnings.

`warnings` stores structured import/review warnings such as metadata unavailable, URL differences, weak or missing published date, duplicate hints, or fetch failure messages.

Neither field stores full article body content.

---

## Current Relationships

```txt
ingestion_candidates
  -> sources
```

Optional matched source through `source_id`.

```txt
ingestion_candidates
  -> articles
```

Accepted candidates may reference the approved article they created through `converted_article_id`.

---

## Current App Status

Review Queue v1 and Review Queue UX v1.1/v1.2 are operational:
- URL Import can save candidates to Review Queue.
- RSS Fetch Feed Now can save candidates to Review Queue.
- The Ingestion page lists candidates.
- The Ingestion page separates Pending, Accepted, Rejected, and Duplicate candidates into status tabs.
- Pending is the default view.
- Counts by status are displayed.
- Analysts can review and edit candidate fields.
- Analysts can accept candidates as articles.
- Analysts can reject candidates.
- Analysts can mark candidates duplicate.
- Reviewed candidates move out of Pending after action.
- Larger screens use a sticky review panel and independently scrolling queue list.
- Direct ArticleForm creation remains available.

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
       -> Events v1.1 Intelligence Summary
       -> Events v1.2 Activity & Analyst Workflow
       -> Seed Data Script v1
       -> Dashboard v1
       -> URL Import v1
       -> URL Metadata Fetch v1.1
       -> Review Queue v1
       -> RSS Ingestion v1
       -> Review Queue UX v1.1/v1.2
```

Next milestone:
- Decision point between Review Queue UX v1.3, RSS Automation Planning, Article Detail Pages, Source Management cleanup, and Auth/RLS Planning

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

The next likely schema-impacting direction has not started.

Current candidate directions:
1. Review Queue UX v1.3
2. RSS Automation Planning
3. Article detail page / advanced article workflows
4. Source search/filtering or source delete planning
5. Auth/RLS Planning

Filtering & Search v1, Article Management v1, Event Refinement v1, Events v1.1 Intelligence Summary, Events v1.2 Activity & Analyst Workflow, Seed Data Script v1, Dashboard v1, URL Import v1, URL Metadata Fetch v1.1, Review Queue v1, RSS Ingestion v1, and Review Queue UX v1.1/v1.2 are complete. Dashboard v1, URL Import v1, URL Metadata Fetch v1.1, and Review Queue UX v1.1/v1.2 required no schema changes. Event v1 is implemented with `events` and `article_events`; Review Queue v1 is implemented with `ingestion_candidates`; RSS Ingestion v1 is implemented with `rss_feeds` and RSS-created `ingestion_candidates`.
