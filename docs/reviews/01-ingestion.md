# Ingestion assessment and architecture review

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

## Implementation handoff — 2026-10-16

The owner approved the review recommendations and requested implementation,
error/warning fixes and thorough testing. Local implementation extends
`f87efb718ddc8c801d0f399dc7e12027e4284e1c` on
`docs/ingestion-assessment-2026-10-16`; changes are in the working tree, not a
newly committed/deployed release. The original assessment below is historical.

### Implemented scope

- Verified-user sign-in, private owner projects, project selection/settings and
  archive behavior; no automatic legacy claiming or public signup.
- Project-scoped articles, events, event links, dashboards and tag assignments.
  Acquisition evidence is reused only within an owner; analyst edits remain
  independent between projects.
- Eleven tracked migrations, a baseline reconciled against the live schema,
  guarded ownership backfill, composite ownership/project
  foreign keys, RLS and privilege restrictions on all affected tables/joins/RPCs.
- Transactional article/event writes and candidate acceptance, retry-safe
  acceptance, conflicting-review outcomes, persistent candidate tags, explicit
  route overrides, and immutable acquisition/observation/review/rule history.
- One server collector for manual and scheduled requests, unique feed leases,
  bounded work, current-subscription checks, stale-worker rejection, durable
  partial/error outcomes, backoff and last-attempt/last-success separation.
- Conditional RSS/Atom fetching, subscription intake generations/validator
  invalidation, durable item identity and multiple origins, validating XML parser,
  dates/authors/categories, explicit skips/limits and hardened IP/DNS/redirect checks.
- Project/default and subscription/override rules, sample previews, versioned
  explanations, explicit reapplication preserving analyst edits/tags/routing.
- Server-side literal search, tag/date/source/import filters, stable pagination
  and counts, filter persistence, visible-only selection and durable per-item
  bulk success/failure history.
- Small publisher-verified source catalog, source/feed subscription switches,
  manual source/feed management, run history, environment example, deployment/
  scheduler/disable/rollback instructions and a non-deploying CI workflow.
- Existing React effect-state/dependency lint failures fixed with initialized,
  keyed forms and cancellable asynchronous initial loading. Review controls
  guard in-flight actions and preserve failed drafts. Vendor splitting removes
  the previous >500 kB bundle warning. URL normalization rejects explicit invalid
  schemes and embedded credentials.

### Verification evidence

Runtime: Windows, Node 24.13.0/npm 11.6.2. Local PostgreSQL: 18.1. No Docker
runtime was available. PGlite supplies the broader isolated SQL/upgrade suite;
the PostgreSQL executable supplies genuine separate-connection contention tests.

| Command / check | Result |
|---|---|
| `npm.cmd ci --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000` | Passed, 273 packages; normal install scripts enabled; no dependency warnings |
| `npm.cmd run lint` | Passed with zero errors/warnings |
| `npm.cmd run build` | Passed; largest output chunk about 230 kB, no bundle warning |
| `npm.cmd test` | 37 tests across 7 files: parser, rules, URL/network guards, forms/review, paging, collector auth, SQL/migrations/RLS/bulk/history |
| `npm.cmd run test:postgres` | Six actual concurrent-connection scenarios passed against a new localhost-only cluster; cluster stopped and removed |
| `npm.cmd run check:functions` | All three Edge Functions passed Deno checks using pinned lockfiles |
| `npm.cmd run test:e2e` | Edge browser workflow passed: sign-in, project isolation, literal server search, visible-page bulk scope, partial conflict display, restore; APIs mocked to an invalid hostname |
| `npm.cmd run check:catalog` | Federal Reserve RSS and UK Ministry of Defence Atom each returned HTTP 200, 20 usable items, zero parser warnings |
| Hosted Supabase / Render / scheduler / costs | Not changed or independently verified |
| Remote GitHub CI | Workflow prepared; not run remotely in this session |

SQL coverage includes fresh setup, required/verified ownership on upgrade,
preserved IDs and source/article/event/tag links, anonymous/cross-owner denial,
project-specific decisions, acceptance retry/rollback, literal search/counts
beyond 1,000 rows, lease expiry/replacement, durable partial outcomes, source
pause/resume, stale subscription-edit conflicts, multiple origins/observations,
repeatable fictional seeds, rule reapplication and bulk per-item failure history.
Real PostgreSQL tests establish simultaneous claim/staging/acceptance behavior,
pause serialization, accept/reject conflict handling and stale-validator defense.

The original Node 24.19/npm 11.9 lockfile failure was not reproduced initially on
this chosen runtime. Installing test/parser dependencies and reconciling the
lockfile resolved optional metadata warnings; a final normal clean install passed.
Initial sandbox-only attempts to fetch dependencies/start PostgreSQL were denied
by filesystem/network/token boundaries. Authorized retries succeeded. A Windows
startup harness pipe-inheritance issue was fixed; its stopped disposable cluster
was removed explicitly. A post-install Deno cache refill required permitted
network access, then function checks passed. These were environmental/test-harness
issues, not hosted application failures.

### Decisions and deviations

- The reviewed recommendation is implemented as owner-shared `collected_items`
  plus project-specific existing `articles`, rather than a new project/article
  overlay table. `article_tags` therefore scopes through its approved article's
  project. This preserves legacy article IDs/links while isolating all editable
  fields and tags. Original legacy assignments are retained as legacy-project data.
- Existing duplicate legacy rows/IDs are preserved; one exact-URL representative
  is associated with acquisition identity. Normalized URL collisions and ambiguous
  legacy duplicates are a pre-rollout reconciliation item, not silently merged.
- Manual capture is explicit analyst intake and starts pending instead of being
  automatically routed outside scope. Saved rules can be reapplied explicitly;
  direct analyst-approved creation remains available.
- Source and tag vocabularies are owner-wide; project article/candidate assignments
  and event links are isolated. The catalog is deliberately small. JPL's feed
  returned HTTP 403 during verification and was replaced by the working official
  UK defence feed. No access restrictions were bypassed.
- Fictional seeds are now opt-in, ownership-checked and non-deleting, rather than
  cleaning/recreating the older anonymous demo dataset. Existing demo IDs/data
  are preserved by the upgrade.
- Retention defaults to preserving research/history indefinitely; no paid plan,
  storage purge or model dependency was introduced. Polling/capacity/cost limits
  are documented in FOUNDATION_ARCHITECTURE.

### External prerequisites and remaining acceptance work

1. Supply the verified `auth.users.id` for legacy ownership. The table-only export
   did not include this, policies, grants, routines, triggers or a hosted audit.
2. Run/reconcile the read-only inventory and schema export before any existing-data
   rollout. Unknown existing policies deliberately stop migration 002. Review
   aliases/duplicate research without deleting or reassigning IDs implicitly.
3. Repeat the upgrade, user authentication, PostgREST and function integration on
   a disposable full Supabase environment; local PostgreSQL does not emulate the
   Auth server, HTTP authorization gateway, extensions or managed runtime.
4. Verify the actual scheduler, runtime/plan capacity, DNS/egress behavior and costs.
   DNS validation and the connection remain separate in the runtime; no DNS
   rebinding isolation guarantee is claimed.
5. Authorize/deploy the matching database/functions/frontend separately, enable
   the prepared Vault-backed schedule, and demonstrate collection with browsers
   closed. The complete hosted acceptance criterion remains unchecked.

No hosted database changes, deployments, messages to others, merge or push were
performed. The implementation and operating procedure are reviewable locally.

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
