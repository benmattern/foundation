# Milestone 04: Connected research without AI

Status: implemented and locally verified, 2026-10-16; not deployed.
Reviewed working tree over 28b326a13e1542affeb0053d32f70e332937e988.
See ../reviews/04-connected-research.md for evidence, design choices and rollout limits.
Milestone 03 local acceptance preceded Milestone 04 implementation.

## Outcome

After keeping articles, the analyst can investigate questions, record an answer,
and see supporting/conflicting material and shared real-world actors. Every
connection is inspectable. No generative AI, embeddings, new model hosting or
automatic conclusions are required.

The first useful demonstration: one article supports two research questions;
two separately published articles mention the same confirmed company/person;
the analyst follows that entity to related evidence and writes a sourced finding.

## Distinct research objects

| Object | Meaning |
|---|---|
| Project | Overall research area and collection scope |
| Question | A specific investigation within that project |
| Article | An approved project-specific source record |
| Article note | Analyst commentary about that article |
| Question-article link note | Why this article matters to this question |
| Research note/finding | Analyst synthesis citing supporting or conflicting evidence |
| Entity | A stable identity for a person, organization/company/institution or place |
| Event | Existing discrete development linked to articles |

Reuse existing Events and article-event linking; do not replace them with entity
tags or infer that every mention describes the same event. Preserve publisher
excerpt, analyst summary/note and research findings as distinct concepts.
Do not relabel mixed legacy summaries as verified publisher excerpts. Preserve
old values; show their legacy provenance honestly.

## Research questions and evidence workflow

- Add a clear Research destination or equivalent project overview section.
- Create/edit/archive a question with title, description and simple status
  (open, monitoring, answered, archived or a documented minimal equivalent).
- A question page shows its evolving answer/notes, linked articles and unresolved
  follow-ups. From a populated Library, offer Create research question and
  Add to question as contextual next steps.
- Many-to-many question/article links: one article may support several questions
  without duplicating its stored record. A question can hold many articles.
- Link/unlink individually or from selected Library items. Search existing
  questions; no need to copy URLs. A link can record why it matters and whether
  it is supporting, challenging or background evidence.
- Keep question status/answer under analyst control. Counts/new evidence are
  indicators, not automatic conclusions.
- Provide article notes and question notes with clear save/saved/error states.
  Start with simple readable editing, not a large document suite.
- A research note/finding can cite actual linked article IDs, titles and optional
  stored supporting passage from available text. Capture retrieval/publication
  dates where available. Separate observed claim from analyst interpretation and
  open uncertainties. Do not require every field before saving a draft.
- Link resolution must remain meaningful after title/source metadata changes.
  Handle unlinking/archive/deletion without silently destroying prose or leaving
  a false claim that missing evidence is still available. Show unavailable
  evidence references or preserve a minimal provenance snapshot as appropriate.
- Do not use a global article summary field for question-specific reasoning.
- Scope all questions, notes and links to the active authorized project.
  Cross-project linking is deferred; reuse across questions within one project
  is required.

## Entities and aliases

Start with a practical relational registry, not a graph platform.
Entities have stable ID, preferred name, type, aliases and optional explanatory
description/reference. Companies and public institutions may be organization
subtypes. Include people and places. An event remains an event record.

An owner-wide identity registry can be reused across their private projects,
but project links/notes/visibility counts are scoped. Reusing an identity must
not expose another project's research or another owner's private entity records.
Explicitly document this scope and enforce it in SQL/RLS/foreign keys and RPCs.

- Search/select an existing entity when linking from an article.
- Select a name/passage in the article's available text to Link entity/Create
  entity; provide a manual search/add fallback for keyboard/mobile selection.
- Use type/description/aliases to disambiguate names. Never assume all people
  with an identical name are the same person.
- Normalize matching carefully and preserve original spellings. Aliases may
  overlap: surface ambiguity, do not silently enforce global unique names.
- Add/edit aliases with visible impact. Do not silently merge entities because
  their spelling resembles another. Destructive merging is deferred; provide
  duplicate warnings and editable links instead.
- Manual entity linking is useful even when no excerpt/full text is available.

## Non-AI mention suggestions

Use known preferred names/approved aliases and explicit text matching over the
title, supplied excerpt and any separately attributed preview text.
Unknown-name discovery through statistical NLP is deferred, as are inferred roles,
ownership, sentiment and inferred relationships.

Suggestions record article ID, entity ID, matched alias, supporting text/span or
reproducible text snapshot, source field, matcher version and suggestion state.
Use bounded, testable matching compatible with Milestone 03 text modes.
Original evidence and analyst-written text are separate inputs; do not label
a name found only in analyst notes as extracted from the publisher.

- Distinguish Suggested, Confirmed and Dismissed mentions. Only confirmed/manual
  links count as established entity associations.
- Ambiguous or short aliases require review; preserve multiple candidates until
  resolved. Never auto-confirm every dictionary hit.
- Let the analyst confirm/dismiss individually and in clearly scoped batches.
- Alias changes permit explicit rescanning with a preview; retain confirmations,
  dismissals, evidence snapshots and audit history. Retry does not duplicate links
  or revive dismissed suggestions without clear user action.
- Reuse stable term normalization/IDs where practical, but do not conflate a
  broad topic group like Supply chains with the identity of a specific company.
- No automatic claims about the complete article if only its excerpt was examined.

## Connections and repeated coverage

- Article view exposes linked questions, confirmed entities, events and notes,
  and related articles sharing those confirmed connections.
- Entity view lists this project's linked articles with source/date, mentions
  and questions. Show the supporting passage when available.
- Show factual signals such as "Mentioned in 6 articles from 4 publisher records."
  Count deduplicated acquisitions/publisher identities where established; disclose
  unknown origin and aggregators. Collected-through Hacker News is not necessarily
  the original publisher. Do not invent publisher identity from a feed label.
- Repeated coverage is not independent corroboration. Syndicated articles and
  copied announcements can repeat one underlying claim. Label counts as coverage,
  never verified truth, importance, credibility or risk.
- Highlight new confirmed mentions since the analyst's last view only if backed
  by reliable stored timestamps/state. No background notification service required.
- Use lists, chips and evidence panels first; a force-directed graph is excluded.
- Existing Events may be linked manually to a question and shown as context using
  existing article links. Reuse rather than duplicate event identity; automatic
  event extraction/grouping is excluded.

## Data, safety and resilience

Inspect actual Milestone 03 implementation before finalizing exact schema names.
Add migrations for question/article joins, notes, entities/aliases/mentions and
project associations, with composite ownership/project constraints and explicit
privileges. Do not rely on frontend filtering for authorization.
Preserve legacy IDs, notes, approved articles, events and acquired evidence.
Archive/unlink actions are reversible where practical; deletion consequences
must be explicit. Avoid deleting analyst notes when a source is unfollowed.

All writes have validation, useful errors and retry/concurrency behavior. Preserve
stale-edit conflict handling and avoid overwriting someone else's newer text.
No private credentials in source, artifacts, test fixtures or logs. Use disposable
data and mocked APIs for tests; no production-only test writes without authorization.

## Acceptance and handoff

- [x] Create a question from a project's Library and link at least two articles.
- [x] One article links to two questions with independent link notes.
- [x] Write/save/reopen an answer/note with evidence references; missing/unlinked
      evidence is represented honestly without losing analyst prose.
- [x] Create/reuse entities and aliases; link people/institutions/places manually.
- [x] Known-name suggestions show evidence, ambiguity and confirmation controls.
- [x] Rescan/retry is idempotent; confirmed and dismissed states survive changes.
- [x] Related-article and entity views show correct project-scoped connections.
- [x] Coverage counts do not count suggestions as confirmations or claim
      independent corroboration; collector origin/publisher labels stay distinct.
- [x] Existing Events, Library edits/deletes, source unfollow and research links
      interact without unintended data loss.
- [x] Anonymous/cross-owner/cross-project and mismatched-join tests deny access.
- [x] Fresh setup and upgrades preserve all prior data; new transaction/concurrency
      checks pass against disposable SQL environments.
- [x] npm ci, lint, build, unit/UI/database/function checks, PostgreSQL scenarios,
      browser journeys pass locally; existing CI workflow retained (hosted CI not run).
- [x] Desktop/mobile screens are rendered and inspected; keyboard linking/editing
      works without text selection, and empty/error states show useful next steps.
- [x] Record commit, design choices, evidence, demo and remaining hosted checks
      in ../reviews/04-connected-research.md. Update status/schema/architecture/
      decisions/backlog/recovery pointers to the actual final implementation.

Keep rollout/merge/hosted authorization separate from local implementation, as
in Milestone 03. No automatic public publishing, investment decisions or AI.
