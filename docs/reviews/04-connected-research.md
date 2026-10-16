# Connected research implementation review

Date: 2026-10-16. Branch: `docs/selective-intake-connected-research`.
Reviewed working tree over `28b326a13e1542affeb0053d32f70e332937e988`.
Status: implemented after Milestone 03 local acceptance; locally verified, not deployed.
Specification: [Milestone 04](../milestones/04-connected-research.md).

## Delivered behavior

Research is a visible destination. Questions support title/description,
open/monitoring/answered/archived status, an evolving answer and unresolved
follow-ups. Library selection carries articles into question creation or an
existing question. Article/question links are many-to-many, with independent
supporting/challenging/background relationships and notes. Unlink preserves
reasoning and can be reversed. The same article can serve multiple questions.

Article notes are a separate record, never a replacement for legacy mixed
summaries. Findings separate observed claim, analyst interpretation and uncertainty;
each can remain a draft. Citations store actual same-project linked article IDs,
title/URL/publication/capture snapshots and optional available passages with field
and origin attribution. SQL rejects fabricated passages and foreign/unlinked new
citations. After unlinking/deleting evidence, existing prose and snapshots remain
readable and are labelled unavailable. Available article IDs resolve current
metadata even after title edits. The unavailable article route retains note/link
context; existing event records survive article removal.

Entities form an owner-wide registry of stable person/organization/place IDs,
approved aliases, description and optional reference. Associations/counts are
project-scoped. Overlapping aliases are allowed and warned about, never merged.
An article can search/select an identity, create a distinct identity, or fill a
manual passage through text selection. Labelled keyboard/mobile text entry works
without selection. Manual associations are explicitly analyst decisions.

Known-name rescan is explicit: preview, choose suggestions, save, then confirm or
dismiss individually or in a scoped batch. It reuses the intake Unicode/literal
matcher and scans only identified available title/acquisition/preview fields;
legacy mixed summaries and article notes are excluded. Ambiguous and short aliases
are flagged; no hit is auto-confirmed. Saved records retain alias, text snapshot,
source field, normalized span, matcher version 1, state and audit history. Retry
fingerprints preserve existing confirmations/dismissals; alias edits never rewrite
historical evidence. Explicit manual confirmation can reverse dismissal.

Article views expose questions, notes, confirmed/suggested identities, existing
events, research history and related articles. Entity views list this project's
confirmed evidence and linked questions. Related articles share confirmed identities,
linked questions or manually linked existing events. Coverage deduplicates acquired
item IDs (fallback exact URL) and reports source/collector records and unknown source.
An original-publisher count is not established from feed/source labels. Neither
syndication nor repeated reporting is presented as independent corroboration.

## Schema, security and retry behavior

Additive migration 014 creates research_questions, question_articles,
article_notes, research_findings, entities, entity_mentions and research_history.
No existing article/event/research ID or legacy summary is rewritten. Composite
ownership/project FKs reject mismatched joins. New tables enable RLS, revoke
inherited API writes/TRUNCATE and grant owner reads; writes use authenticated,
validated security-definer RPCs with a fixed search path and project authorization.
Audit rows are append-only through triggers; identity changes use null project
because the registry is owner-wide. Browser history is a bounded latest-100 view;
the durable audit itself is not truncated.

Edits compare stored revisions, including rejecting null expectations. UI drafts
survive errors. Stable per-form create-request UUIDs make question/finding/entity
and vocabulary creates safe to retry after ambiguous network responses. Evidence
links and article notes serialize creation and reject stale overwrites. Suggestion
retries deduplicate rather than revive dismissed links. Article removal sets only
research article references to null while retaining project, snapshots and prose;
existing tag/event join removal still follows the prior article-delete workflow.

## Verification evidence

- `npm ci`: clean locked install passed, 275 packages and zero audit vulnerabilities.
  Dependencies did not change between milestones.
- `npm run lint` and `npm run build`: passed without errors or warnings.
- `npm test`: 59 tests across 12 files. Includes existing regressions, fresh/legacy
  migration upgrades, RLS/privilege denial, cross-owner/project joins, null/stale
  CAS, create retries, independent question notes, citation validation, preservation
  after unlink/delete, event survival and retained mention review/audit state.
- `npm run check:functions`: all three Edge Functions type-check with frozen locks.
  This validates the collector's shared matcher; no new Edge Function was needed.
- `npm run test:postgres`: 11 PASS groups using independent connections in a
  disposable PostgreSQL 18 cluster. Includes collector leases/staging/acceptance,
  Pause/Unfollow races, stale decisions/validators, concurrent research edits,
  evidence-link/note creation, mention retries and create-request replay.
- `npm run test:e2e`: eight mocked browser journeys covering prior workflows,
  selective intake, Library selection, two questions with independent link notes,
  answer/finding saves, dictionary confirmation/dismissal/rescan, manual linking,
  entity coverage, failed-save draft preservation and project switching.
- Screenshots at desktop 1440 and mobile 390 were rendered and visually inspected
  for question, article and entity views; readable wrapping and no horizontal
  overflow. Fictional artifacts are in `artifacts.local/research/`.

An over-parallelized verification batch caused a 5-second UI-test timeout and a
30-second legacy browser-journey timeout under machine contention. The suites were
rerun separately, as the existing CI workflow runs them. No arbitrary sleeps or
production fixtures were added. GitHub CI itself was not triggered by this task.

## Design boundaries and demo

The scan prioritizes preferred names for up to 500 identities, then approved
aliases within 1,000 total dictionary entries, 22 fields of at most 20,000
characters and 200 suggestions per preview. Text is normalized once per field.
These are finite local dictionary checks, not comprehensive entity discovery.
Use manual search/linking for identities outside the scan window. No AI, embeddings,
automatic conclusions, identity merging, notifications or graph platform was added.

Legacy articles with no separately attributed acquisition expose their saved title
and legacy summary honestly; only the title participates in dictionary matching.
Full article text is not claimed. Event context reuses existing manual article-event
joins instead of adding a second event identity or automatic event grouping.

Demo: select two Library articles, create a question, record an evolving answer,
set separate link relationships/notes, and save a finding with a real citation.
Create a second question and link the first article with independent reasoning.
Create an organization identity, preview known-name hits, confirm one and dismiss
another, then rescan to see their states retained. Link that identity manually to
the second article; follow it to confirmed project coverage and related questions.

## Rollout and remaining checks

No production credentials, hosted data mutations, deployment, push or merge were
used for this work. Milestones 01/02 remain the deployed baseline. Local browser
APIs are mocked; SQL tests are not hosted Supabase Auth/PostgREST acceptance.

After separate rollout authorization: take/verify a backup and current hosted
schema/grants; apply 012, 013, 014 in order; deploy the format-2-aware collector
first and verify it before releasing the frontend. Update fetch-rss-feed as well
for the longer-excerpt parser. Keep new rule editing unavailable until the new
collector is running; legacy rules remain compatible throughout. Verify the
scheduler, old disabled subscriptions, real-account
RLS, deep-link rewrites, real metadata preview failures and the signed-in research
demo against preserved existing records. Preserve the established owner mapping;
these migrations do not reassign legacy data. No unresolved product decision
blocks local completion.

Create-request retries also compare a stored content fingerprint. Reusing a saved
request with edited content reports a conflict instead of silently ignoring the
new draft. Version-1 stored scores are used unchanged across JavaScript/SQL
Unicode case-folding differences; older scoreless results receive a server
fallback score, returned to the pane so its explanation agrees with ordering.
