# Selective intake implementation review

## Production release - 2026-10-16

Status: deployed. [PR #3](https://github.com/benmattern/foundation/pull/3) merged
at `849a09d5fffd53c9f4bc6ca812573f0a05dbabfc`. Implementation: `182b2e6`;
release head including browser synchronization fixes: `b50d26d`.
[GitHub CI run 38973287830](https://github.com/benmattern/foundation/actions/runs/38973287830)
passed every check: clean install, lint, build, 59 tests, 11 PostgreSQL check groups,
all three function checks and eight Linux Chromium browser journeys. Linux CI
exposed missing waits for form/project navigation; the tests now wait for visible
new-question/new-project headings. No arbitrary sleeps were added.

The owner authorized deployment. A fresh consistent public schema/data plus
migration-ledger backup was saved privately and restored into a disposable local
PostgreSQL 18 cluster. All 1,950 original rows across 17 tables restored exactly
and survived migrations 012-014 unchanged (excluding newly added columns).
Production then applied those migrations in one transaction with ledger entries;
the same complete row/value comparison and RLS/TRUNCATE checks passed before commit.
At cutover, preserved data included 59 articles, six events, 19 event links,
21 sources, 12 tags, 54 tag links, 422 candidates, seven feeds, 11 subscriptions
and three projects. No legacy ownership reassignment or reset was performed.

The format-2-aware collect-feeds v3 and longer-excerpt fetch-rss-feed v5 were
released before the frontend; fetch-url-metadata v4 was unchanged. All three
functions are ACTIVE and reject anonymous POST with 401. The existing five-minute
foundation-ingestion cron remains active; its 22:10 UTC post-deployment invocation
succeeded and received HTTP 200 without timeout. This proves orchestration, not
unrestricted access to every publisher or full article text.

Hosted SQL-role verification passed pinned vocabulary/CAS, source state versus
shared availability, Later/restore/preview/acceptance, independent question notes,
validated citation passages, entity types and mention review/rescan idempotency,
retained prose after deletion, cross-project/owner denial and anonymous denial.
Every fictional verification write was rolled back; no test records remain.
These checks exercise hosted SQL authorization, not end-user Auth/browser login.

[The live application](https://foundation-ljfo.onrender.com) serves the exact
locally tested JavaScript/CSS bytes and new feature markers. All 12 routes passed
direct visits, refreshes and anonymous sign-in gates, including /research,
/entities and /articles/:id. Desktop 1440/mobile 390 sign-in screens were rendered
and visually inspected: required fields work, no horizontal overflow, console
errors, page errors or failed requests. Public frontend verification completed
at 2026-10-16T22:09:41.433Z. Entry asset: `index-BkKXpD8R.js`.

Remaining acceptance: a real-account signed-in browser journey through collection,
rule editing, preview retrieval and the complete research demo. No owner password,
auth session or login link was requested or created. Existing publisher availability
failures remain operational checks; HTTP 200 from the scheduler is not a claim
that every feed succeeded. Backups, credentials and detailed private evidence stay
ignored under .deployment.local/release03-04 and must never be printed or committed.

<details>
<summary>Local implementation review before authorized deployment</summary>


Date: 2026-10-16. Branch: docs/selective-intake-connected-research.
Reviewed baseline: 28b326a13e1542affeb0053d32f70e332937e988.
Status: implemented and locally accepted in the working tree; not deployed.
Specification: [Milestone 03](../milestones/03-selective-intake.md).

## Delivered

Following, Discover and Your saved sources replace the top-level collection tab.
Legacy view=available/view=collection and /rss routes remain compatible. Follow,
Pause, Resume, Unfollow and explicit refollow preserve evidence and subscription
rules. Additive migration 012 backfills disabled subscriptions as paused. Source
state uses feed locks and revision conflicts, without reactivating shared feeds.

Project creation explicitly chooses all incoming or restricted intake. Descriptive
metadata remains inactive until copied into a rule draft. Format 2 implements
bounded OR groups of AND conditions, ANY terms per condition, field selection,
whole-term or literal-substring modes and exclusion precedence. Legacy rules keep
their existing substring evaluator. Owner-wide named groups have immutable pinned
versions; adopting a new version is explicit. Missing text stays reviewable.
Whole-term boundaries use Unicode letters/marks/numbers/underscore; apostrophes
and hyphens are boundaries. No geographic inference or synonyms are invented.

Preview and reapply use the collector's shared evaluator. Preview is a bounded
20-item sample, not an accuracy estimate. Positive distinct-term weights are
maximum title 3/category 2/excerpt 1, capped at 150; repeated occurrences do not
inflate rank. SQL ordering precedes 50-item pagination, with date/ID ties. Score
version 1 and stored matches explain the result; relevance is not credibility.

Feed excerpts retain up to 20,000 characters under the existing feed-size limit.
Original acquisition remains separate from analyst edits. On-demand authenticated
page metadata is saved with URL/time in a separate preview table, explicitly
selected for later rule reapplication. It is metadata, not promised full text or
server-attested publisher content. Failed previews do not block review.

Later is pending+deferred, separately listed and recoverable, with review history.
Keep, Dismiss, Later, Duplicate and navigation are visible. Optional N/P/L/D
shortcuts start disabled and ignore typing, dialogs, modifiers and busy states.
No destructive blind undo of Keep was introduced.

## Verification

- npm ci: passed, 275 packages, zero audit vulnerabilities. Initial retry was
  necessary because a running browser test held a Windows native-module lock.
- npm test: 50 passing tests, including fresh/legacy migration checks, ownership,
  pinned version/CAS tests, durable source states, Later/preview isolation and
  relevance across pagination; Unicode and legacy matcher fixtures pass.
- npm run lint and npm run build: passed with no warnings/errors.
- npm run check:functions: all three functions type-check. Dependency cache
  refill required network permission; no hosted requests were made.
- npm run test:postgres: seven independent-connection scenarios passed, including
  Unfollow against in-flight staging, project isolation and stale decisions.
- Existing five mocked browser journeys passed. Added selective-intake journey
  passes restricted setup, Pause/Unfollow/refollow and Later/restore.
- Desktop 1440 and mobile 390 rule-editor screenshots rendered and visually
  inspected; controls wrap, labels remain readable, no horizontal overflow.
  Fictional artifacts: artifacts.local/selective/rules-{1440,390}.png.

## Demo and rollout

Create a restricted project with Taiwan/Japan terms; Follow a Discover feed;
Pause, Unfollow and re-follow it; Check now and defer/restore an Inbox item. Open
Project settings to add AND/OR conditions, pin vocabulary, preview and save.

Apply migrations 012 and 013 in sequence only after backup and hosted authorization;
release the format-2-aware collector first, verify it, then release the frontend.
The collector remains compatible with legacy rules during this ordered cutover.
No hosted database, credentials, deployment, merge or live acceptance was used.
Live signed-in collection, scheduler, page-metadata/network behavior and existing
legacy data reconciliation remain rollout checks. Local browser APIs are mocked.
Continue to Milestone 04; no unresolved owner decision blocks local work.

## Final cross-milestone regression and persistence audit

Milestone 04 reused the shared matcher and preserved selective intake. Final
regression includes 59 tests, eight browser journeys, 11 PostgreSQL PASS groups,
clean lint/build and all three function checks. The new intake browser journey
also fetches/stores separate preview metadata, explicitly opts it into matching,
and verifies shortcut suppression while typing and Later via an enabled shortcut.
A UI test edits a vocabulary group, retains the old pin, then explicitly adopts
and previews the new version. Later badges remain distinct from active pending.

The final source audit also guards new feed subscriptions under paused/unfollowed
sources. Source decisions and subscription creation acquire the same project/source
advisory lock before feed locks; old source-enable calls enter the durable state
operation. Direct rule edits reject null expected versions. Vocabulary creation
uses a stable request token so network retries cannot create a second group.
Previewing a project draft applies existing feed overrides, with that fact visible
in each result, and matched passages are shown. Manual/legacy acquisition is
labelled separately from feed-supplied text. Migrations remain undeployed.

Create-request retries also compare a stored content fingerprint. Reusing a saved
request with edited content reports a conflict instead of silently ignoring the
new draft. Version-1 stored scores are used unchanged across JavaScript/SQL
Unicode case-folding differences; older scoreless results receive a server
fallback score, returned to the pane so its explanation agrees with ordering.

</details>
