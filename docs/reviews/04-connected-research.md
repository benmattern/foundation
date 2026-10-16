# Connected research implementation handoff

Date: 2026-10-16.
Reviewed baseline: 7cd42fbe1eb0c2e1cd03981a16a67bab5cbc2050.
Status: approved next milestone; start after Milestone 03 local acceptance.
Specification: [Milestone 04](../milestones/04-connected-research.md).
Predecessor: [Milestone 03](../milestones/03-selective-intake.md).

## Owner direction

The owner wants a useful next step after collecting a Library: investigate
research questions, connect an article to more than one question, and demonstrate
relationships through people, businesses, institutions, places and developments.
Repeated coverage is worth surfacing, while AI remains optional.

## Baseline and rationale

EntitiesPage is currently a placeholder; no entity registry/alias/linking or
research-question schema was found in the repository inventory.
Event services already provide project-scoped discrete events and article links.
Reuse that event model instead of replacing it with tags or duplicate identities.

Questions, topics, entity identities, event identity and analyst findings have
different responsibilities. Stable identity/aliases enable explicit connections.
Known-name matching and manual linking provide useful non-AI support; unknown-name
discovery, inferred relations and automatic event grouping remain out of scope.

An article can link to many questions within its project. Owner-wide identity
reuse must not disclose research from another project or owner. Suggestions are
distinct from confirmations, and mention/coverage counts are not corroboration.

This is a design handoff only. No application or schema feature described in
Milestone 04 has been implemented by this documentation change. Inspect the actual
Milestone 03 result before selecting final schema/normalization reuse.

## Return report

Record branch/commit, implemented schema/privileges and upgrade checks, object
scope, identity/alias ambiguity behavior, citation integrity on unlink/delete,
mention provenance and confirmation states, coverage counting limits, exact
tests/results, visual inspection, demo and remaining hosted checks.

Demonstrate: one kept article linked to two questions; two articles connected to
one confirmed entity; a saved research note referencing actual evidence. State
what was reviewed locally versus verified on the hosted system. Material
deviations include alternatives, consequences and a recommendation.
