# Milestone 01: Project-aware automated ingestion

Status: locally implemented and tested; hosted rollout pending, 2026-10-16.
Baseline: main at 030030562e3bf6298005814ff56f78093631fc51.
Assessment: ../reviews/01-ingestion.md.
The checked criteria below reflect local tests only; hosted verification is
separate. Implementation extends documentation commit f87efb7 in the working tree.
The owner approved the review recommendations. See the updated assessment for
evidence, deviations and external prerequisites.

## Outcome

An analyst creates a research project, enables sources, receives scheduled
RSS/Atom intake, adjusts transparent filtering/tagging rules, and reviews
material efficiently. Everything works with AI absent and the Mac switched off.
Extend existing RSS, URL capture, article, event and review functionality.

## Boundaries

Included: minimal owner authentication/access controls, migration baseline,
research projects, curated source discovery, RSS/Atom collection, subscriptions,
deterministic rules, durable candidate tagging, bulk review, and operational
status. Treat this as one coherent milestone with the internal stages below.

Excluded: AI implementation, local workers, paid publisher login/API connectors,
automated source discovery, unrestricted full-text crawling, OPML, social/map/
dataset connectors, organization administration, trading, and graph features.
Do not build a generic connector marketplace.

## Proposed data design

Finalize exact names after verifying the existing live schema. Preserve existing
IDs, source/article/event links, dates, and origin metadata.

- Sources describe publishers, with catalog topic/region/language metadata.
- Existing rss_feeds describe collection endpoints. One source can have many.
  Keep operational feed availability distinct from a project's subscription.
- Research projects belong to an authenticated owner.
- Project subscriptions select sources and their feeds, with enable state and
  rules. A project-level source toggle affects only that project's intake.
- Collection run records persist attempts, successes, warnings, counts, errors,
  retry timing and leases. Store feed identifiers and origin associations.
- Stable collected-item identity allows reuse within the owner, with project
  candidates/associations unique by project and item. Evaluate reuse of current
  candidates rather than assuming a mandatory new content store.
- Review status, routing, candidate tags and rule results belong to the project.
  Project/article associations hold project-specific accepted tags/state.
  Existing global article tags remain legacy metadata; never use them as a
  substitute for project-specific annotations.
- Retain separate original acquisition fields, analyst edits and rule annotations.
  Store rule version, matched terms/fields and classification time.

Document unique keys, foreign keys, indexes, ownership and RLS/RPC authorization.
A project_id filter in JavaScript is not isolation. Do not share licensed or
private content between owners.

## User behavior

1. Create/edit/archive a project with name, description, topics and keywords.
2. Search/filter a small source catalog by topic/region/language. Show connector
   type, available content level, feed health and access requirements.
3. Enable a source, choose its feeds and customize project rules. Add a source
   and feed manually at any time. Pausing preserves previous research.
4. Request a manual check or let the scheduler collect while no browser is open.
5. Review Pending and Outside scope views; inspect why an item was routed/tagged.
6. Edit fields, add/remove tags, accept, reject, mark duplicate, or restore
   rejected/outside-scope material to pending as appropriate.
7. Select visible items for bulk tagging/routing/review. Indicate selected count,
   scope and per-item failures. Never silently select all unseen query results.
8. Filter by source, review state, tags and date; search on the server with
   pagination and stable ordering. Preserve project/filter state on navigation.
9. View last attempt, last success, running/paused/error state, and run history.

Pausing is enforced on the server: recheck subscription enable state before
publishing staged results; no new candidates after pause takes effect.
Disabling one project does not disable another. A feed with no enabled
subscriptions should not continue automatic polling.

Re-enabling collects the current available feed window without duplicates.
Do not promise retrieval of articles already missing from the publisher feed.

## Rule semantics for v1

- Case-insensitive literal terms/phrases over title, excerpt and publisher
  categories when supplied. Define normalization and phrase behavior explicitly.
- Include-any terms: empty means include all; otherwise at least one must match.
- Exclude-any terms: a match routes outside scope even if inclusion also matches.
- Default tags and keyword-to-tag rules are separate controls from inclusion.
- Project defaults are inherited; a subscription can explicitly override them.
  Empty override and inherited value must be distinguishable.
- Outside scope is a recoverable route, not automatic rejection or deletion.
- Missing searchable text is flagged for manual review, not asserted irrelevant.
- Preview rule changes against a bounded recent sample before saving.
- Saved changes affect future intake by default. Reapplying to existing candidates
  is an explicit action that preserves analyst decisions/tags and records version.
- Matching is relevance routing, not credibility assessment or factual validation.

## Collection backend

Use one authorized server path for manual and scheduled collection. The browser
requests work and reads results; it does not orchestrate item inserts.

Use bounded runtime/batches, a database claim/lease, idempotent writes, retry
backoff, explicit timeouts, sensible polling intervals and persisted outcomes.
Ensure overlapping manual/scheduled requests cannot double-process a feed.
Handle stale leases and distinguish success, partial failure and total failure.
Only mark success when its criteria are actually met.

Prefer the existing Supabase deployment boundary, subject to verifying scheduler
availability. Document the chosen mechanism, schedule, expected request volume,
credential storage and cost implications. Never require the Mac for collection.

Use a tested XML parser or demonstrate reliable equivalent coverage. Preserve
GUID/Atom ID, publisher, original URL and available author/date/category fields.
Conditional fetch and truncation handling should avoid unnecessary requests and
silent missed-item claims. Preserve retrieval limits and safe URL protections.

Candidate acceptance must be authorized, transactional and idempotent, including
edits/tags/project association and candidate status. Define concurrent accept,
reject and duplicate outcomes. Bulk processing may use per-item transactions
with durable, clear results.

## Migration and rollout

1. Reproduce dependency baseline; repair lockfile on an agreed runtime.
2. Obtain/reconcile live schema, constraints, functions, grants and policies.
   Record a sanitized baseline and fresh-install procedure.
3. Prepare additive migrations and backfill for a default legacy project.
   Legacy ownership assignment requires explicit verified owner input.
4. Test fresh setup and upgrade on disposable databases, including existing
   article/event/tag links. Back up before any authorized live migration.
5. Apply access controls across existing tables and joins, not only new tables.
   Inspect function auth; browser publishable keys are not user authorization.
6. Implement backend, then project/catalog/rules/inbox UI using the existing theme.
7. Provide environment examples without secrets, deployment instructions,
   scheduler setup/disable steps, rollback guidance and a demo walkthrough.
8. Hosted mutation/deployment requires explicit authorization. Code completion
   and hosted validation are separate states.

## Acceptance criteria

Checked items are locally verified with SQL/component/browser tests. Browser APIs
are mocked; PostgreSQL contention uses a separate disposable PostgreSQL 18 server.
No hosted deployment or browser-closed scheduled collection is claimed.

- [x] An existing-data upgrade preserves source/article/event/tag relationships.
- [x] A fresh database can be set up from tracked migrations and fictional seeds.
- [x] Authenticated access works; anonymous/cross-owner reads and writes are denied.
- [x] Two projects follow one source with different enable states and rules;
      review/tag actions in one do not change the other.
- [ ] Catalog discovery and manual source/feed addition work.
- [ ] Scheduled collection creates candidates with no browser or Mac running.
- [x] Pause/resume is enforced server-side and preserves history.
- [x] Concurrent fetches and retries produce no duplicate project candidates;
      multiple feed origins remain discoverable.
- [x] Acceptance retries/concurrency create at most one intended approved result,
      with atomic tags and status updates; failure does not leave partial writes.
- [x] Include/exclude/tag rules are explainable, previewable and versioned.
- [x] Outside-scope and rejected material can be recovered without reimporting.
- [x] Candidate tags persist before acceptance; analyst edits survive rule reruns.
- [x] Bulk actions show scope/count and per-item failures.
- [x] Paginated server queries and counts remain correct beyond the hosted row cap;
      the review panel always selects from the visible filtered result.
- [x] Feed failures/partial runs are durable and distinguish last attempt/success.
- [x] RSS/Atom fixtures cover namespaces, entities, missing fields, GUIDs, relative
      links, invalid schemes, malformed and oversized documents.
- [ ] Manual URL capture, article management, dashboard and events still work.
- [x] npm ci, build, lint and relevant frontend/backend/database tests pass,
      with existing failures and exceptions documented rather than hidden.
- [x] Demo succeeds without AI configured. No credentials are in frontend code.

## Implementation feedback contract

Update this checklist and ../reviews/01-ingestion.md at completion. Include the
branch/commit, actual schema changes, rationale for deviations, commands/results,
hosted checks still outstanding, operating costs/limits, and next decisions.
Do not mark a criterion complete without evidence. If external access blocks a
check, finish independently testable work and describe the exact prerequisite.
