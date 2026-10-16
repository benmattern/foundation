# Selective intake implementation handoff

Date: 2026-10-16.
Reviewed main: 7cd42fbe1eb0c2e1cd03981a16a67bab5cbc2050.
Status: approved brief prepared; application implementation has not started.
Specification: [Milestone 03](../milestones/03-selective-intake.md).
Next: [Milestone 04](../milestones/04-connected-research.md).

## Owner direction

The owner approved keeping Discover, simplifying saved-source/configuration
views and distinguishing Follow, Pause and Unfollow. They want the next
iterations to emphasize non-AI pre-sorting, clearer project setup and enough
article preview to make human review practical. Controlled geographic/keyword/
entity vocabularies are a later opportunity, not a prerequisite for this release.

## Verified current behavior

- ProjectScopeForm saves topics/keywords as descriptive fields, separate from rules.
  Its helper explicitly says these fields do not filter incoming items.
- ProjectPage hosts Advanced matching rules separately and previews a bounded
  pending sample. Reapply is explicit.
- RuleEditor and _shared/rules.ts support includeAny/excludeAny/defaultTags/
  keywordTags. Matching is normalized literal substring over title, excerpt and
  categories. No AND groups, controlled entities or semantic geographic matching.
- The server collector uses project.rules and subscription rules, not project
  topics or keywords. Exclusion wins; missing text remains pending.
- SourcesWorkspace lists existing subscriptions in Following even when disabled.
  Controls offer Follow/Pause; explicit Unfollow is absent.
- Collection details is still a source-workspace tab despite source-level
  expandable feed settings/history. Available sources means saved workspace
  records, not sources automatically relevant to this project.
- Candidate preview prefers description or lightweight metadata; it does not
  establish full article availability.

This assessment uses source inspection and owner feedback, not a fresh signed-in
hosted audit. No new tests, database changes, function deployments or application
changes were performed in preparing these documents.

## Design rationale and boundaries

Keep legacy matching behavior stable. New explicit filtering and matching modes
must not silently reinterpret existing metadata/rules. Preserve outside-scope
items and human edits. Controlled named term groups provide an inspectable
bridge toward future entity/geography tools without inventing a global ontology.

Implement the complete brief, using small internal steps and appropriate additive
migrations. Routine layout/column/component choices are delegated. Report material
deviations or external prerequisites with alternatives and a recommendation.
Do not require the owner to approve another generic plan before starting.

## Return report

After implementation, update status and add: branch/commit, changed schema and
upgrade path, behavior/limits of rules and scores, source subscription semantics,
preview provenance, exact tests/results, rendered desktop/mobile inspection,
a concise demo, remaining live checks and unresolved decisions.
Do not confuse a local mocked journey with real-account hosted verification.
