# Ingestion assessment and architecture review

Assessment date: 2026-10-16.
Reviewed repository: benmattern/foundation, main at
030030562e3bf6298005814ff56f78093631fc51.
Scope: repository inspection and documentation only. No application, hosted
database, function deployment, or production configuration changes.

## Conclusion

Extend the existing ingestion workflow. A substantial part of the manual
experience exists already. The next useful package is project-scoped,
scheduled ingestion with configurable rules and efficient human review,
independent of AI and of the analyst's Mac.

Scheduling cannot be added reliably by placing a timer around the current
Edge Function. The function fetches/parses; the browser performs persistence
and duplicate checks. Reliability and access controls belong in the same
milestone as automation.

## Evidence and verification limits

The assessment read the current project docs and application/configuration
text files from the pinned commit. Image assets and Supabase CLI temporary
files were not needed. This is not a live Supabase or Render audit.

| Evidence | Result |
|---|---|
| Application and ingestion source inspection | Completed |
| Repository migration/config/scheduler inventory | No migration directory, tracked Supabase config, scheduler, or CI workflow found |
| Package scripts | Build, lint, dev, preview; no test script |
| Clean dependency install | Failed in this environment; see below |
| Full frontend build and lint | Not run: clean installation failed |
| Isolated parser/URL probes | Executed with Node's TypeScript stripping and a stubbed Deno.serve; no network or database |
| Hosted functions, database constraints/RLS, actual collection | Not independently verified |

The clean-install command was npm ci --ignore-scripts --no-audit --no-fund
--fetch-retries=0 --fetch-timeout=15000 under Node 24.19.0/npm 11.9.0.
npm rejected the lockfile: missing @emnapi/core and @emnapi/runtime versions,
and conflicting/missing @emnapi/wasi-threads versions. This establishes a
reproducibility failure here, not that the user's existing install or hosted
deployment is broken. Reproduce on the chosen supported runtime; repair and
commit the lockfile during implementation. No dependency files were changed.

## What exists today

| Capability | Repository evidence | Assessment |
|---|---|---|
| Source create/list/detail/edit | src/services/sourceService.ts; SourcesPage and SourceDetailPage | Present; source deletion/search/catalog recommendations absent |
| Article creation/edit/delete/tags | src/services/articleService.ts; ArticleForm and ArticlesPage | Present; multi-step writes are not atomic |
| URL capture and metadata preview | ArticleUrlImport; src/lib/urlImport.ts; fetch-url-metadata function | Present; manual fallback retained |
| Feed management | RssFeedsPage, RssFeedForm, RssFeedList; src/types/rssFeed.ts | Create/edit/list and active flag exist |
| RSS and Atom fetch/parse | supabase/functions/fetch-rss-feed/index.ts | Present with redirect, timeout, response-size and item limits |
| Feed-to-candidate persistence | src/services/rssFeedService.ts | Browser-driven after function invocation |
| Review inbox | IngestionQueuePage, IngestionCandidateList, IngestionCandidateReview | Status tabs, previews, single-item review, source/import/search filters |
| Duplicate checking | rssFeedService.createKnownUrlSet | In-memory normalized-URL comparison against fetched article/candidate lists |
| Provenance | Candidate fields and raw_metadata containing feed/item information | Basic origin and dates retained; authors/categories not systematically extracted |
| Projects and project subscriptions | App routes, application types and services | Absent |
| Scheduled collection, rule-based routing/tagging, bulk review | Repository source inventory | Absent |

## Findings that affect the next implementation

### 1. Collection persistence must move server-side

rssFeedService.fetchRssFeed invokes the fetch function, loads articles and
candidates, then creates candidates one by one in the browser. Closing the
browser can interrupt staging. last_checked_at is updated after the loop,
including runs with item-level creation errors. The UI summary is transient.

Recommendation: one server collection service for manual and scheduled runs,
with durable run records, explicit partial-failure outcomes, bounded batches,
retry state, and concurrency control. Keep the browser as a requester/viewer.

### 2. Duplicate detection is advisory, not concurrency-safe

The browser's knownUrls set prevents sequential repeats within its loaded
snapshot. It does not coordinate simultaneous clients or a future scheduler.
Queries have no explicit pagination; results can be limited by the hosted API's
row cap. Feed GUIDs are retained in metadata but not used as durable identities.

Recommendation: canonical URL identity plus feed-scoped item IDs, indexed
database uniqueness and atomic upsert/association. Preserve multiple origins.
A repeat in the same project should not create another inbox item; the same
article must remain available to other projects.

### 3. Acceptance needs one transaction and retry-safe behavior

acceptIngestionCandidate first calls createArticle (article insert then tag
insert), then changes candidate status. The page separately edits the candidate
before this sequence. Failure can leave an article created while its candidate
is pending. Review buttons have no in-flight guard; repeated clicks can overlap.

Recommendation: an authorized database operation that locks/checks the candidate,
writes the article and tags, links the project, and marks acceptance atomically.
A repeat returns the established result. Include authorization and concurrent
accept/reject semantics. Bulk work must report per-item outcomes.

### 4. A real schema baseline is missing

FOUNDATION_SCHEMA.md describes the tables, but the repository contains no
migration history or executable schema baseline. seed.sql populates existing
tables; it does not create them. Docs report RLS disabled for the prototype.
App.tsx contains no authentication flow. Live policies and constraints are unknown.

Recommendation: obtain a schema-only export and policy/function inventory,
reconcile it with docs, then commit a reproducible baseline and additive
migrations. Do not invent existing constraints or apply a speculative migration
to the live database. Implement minimal authenticated ownership before releasing
project data or automated collection. Full organization administration can wait.

### 5. Review selection can leave the filtered list

reloadAfterReview and selectCandidateForStatus select candidates by status,
without applying current search/source/import filters. The detail panel can show
an item outside the visible filtered list. Candidate tags are transient form
state reset on selection; there is no durable pre-acceptance tagging workflow.

Recommendation: derive visible selection from the same query/filter result,
persist candidate tags, and add bulk tag/route/review actions with clear selection
scope. Preserve work on errors and avoid misleading success messages.

### 6. Existing parser and normalization need targeted hardening

The feed parser uses regular expressions rather than a validating XML parser.
It caps processing at 50 items and truncates oversized responses at 1 MiB.
Unsupported XML can appear as zero items; truncated/malformed XML may still yield
a partial result. Missing-link items are skipped without adding their warning
to the returned result. Authors and publisher categories are not extracted.

Isolated probes confirmed basic RSS, Atom and relative links produce items.
A malformed, unclosed RSS document also produced an item without rejection.
normalizeImportUrl("ftp://example.com/a") returned
"https://ftp//example.com/a" instead of rejecting the explicit unsupported scheme.
These probes are not end-to-end tests.

Recommendation: fixture coverage for XML namespaces, entities, empty/malformed/
oversized feeds, identifiers, links and dates; reject unsupported URL schemes
before adding a default scheme. Report truncation/skips explicitly and document
the finite feed-history window. Review DNS/IP and redirect protections in both
fetchers before expanding automated URL retrieval; no exploit testing occurred.

## Proposed choices for architecture review

These recommendations are proposals, not implemented or owner-approved decisions.

| Question | Alternatives | Recommendation and tradeoff |
|---|---|---|
| Next package | More isolated UI tweaks; automation only; complete ingestion workflow | Complete project-aware ingestion, internally staged; larger but demonstrable |
| Access boundary | Continue anonymous prototype; owner auth; organizations now | Authenticated owner with multiple private projects; organization roles later |
| Scheduling | Mac worker; browser polling; hosted scheduler | Hosted Supabase-side scheduling if verified available; keeps Mac out of collection |
| Content reuse | Duplicate every article; shared content with project state | Reuse content within an owner, keep project review/tags/rules separate |
| Source catalog | Automated web discovery; small curated catalog | Curated, verified feeds with topic/region/language metadata; honest coverage |
| Rule results | Delete nonmatches; reversible routing | Route outside-scope material separately, show reasons; more storage, fewer silent losses |
| AI | Required ingestion stage; optional enrichment | Optional later enrichment; collection/review remain operational without any model |
| Full text | Scrape all pages; metadata-first | Metadata/excerpts/links first; publisher-specific full text later |
| Resume behavior | Promise complete backfill; current feed window | Fetch currently available items with deduplication; older backfill explicit later |

Routine implementation choices: component breakdown, service names, query indexes,
bounded batch size, test fixtures, UI labels consistent with the existing app.

Owner/external inputs needed before hosted rollout: verified live schema export;
account ownership for legacy data; available scheduler/runtime and any costs;
deployment credentials and authorization. Use the recommendations above as
proposed defaults when drafting implementation; do not treat silence as approval
for costs, assigning legacy ownership, or mutating production.

## Handoff and next review

Implementation specification: ../milestones/01-ingestion.md.
Standing repository instructions: ../../AGENTS.md.
Application implementation has not started.

After implementation, append the branch/commit, completed acceptance criteria,
migration results, build/lint/test commands and results, live checks, architectural
deviations, decisions made, and remaining questions. For every unresolved decision,
give alternatives, consequence, and a recommendation rather than only a question.

## Publishing status

After the GitHub connection was updated, this documentation package was published
on docs/ingestion-assessment-2026-10-16 for review. Earlier write attempts had
returned HTTP 403. No application code or hosted database changes are included.
