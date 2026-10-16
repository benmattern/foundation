# FOUNDATION repository instructions

## Start here
Read docs/FOUNDATION_RECOVERY_PROMPT.md, docs/FOUNDATION_STATUS.md,
docs/FOUNDATION_BACKLOG.md, and docs/FOUNDATION_CONVENTIONS.md, then inspect
the code relevant to the task. Use docs/FOUNDATION_DECISIONS.md and
docs/FOUNDATION_SCHEMA.md for architectural and data context.

Milestone 01 ingestion is deployed; see docs/reviews/01-ingestion.md for recorded
verification and remaining live signed-in checks.
Milestone 02 workflow implementation is deployed; see
docs/milestones/02-project-workflow.md and docs/reviews/02-project-workflow.md
for the completed checklist, verification, demo and remaining hosted checks.
The owner approved the project workflow/usability implementation on 2026-10-16.
When assigned this milestone, implement it end to end and report evidence;
do not stop at another plan or seek approval for routine UI choices.
Follow the user's active task; these instructions do not independently authorize
merges, hosted mutations, deployment or use of account credentials.

## Product principles
- FOUNDATION is a research platform. Taiwan, Pacific geopolitics, and
  semiconductors are the initial domain, not restrictions on the software.
- Ingestion, source management, filtering, tagging, and review must function
  fully with AI disabled or unavailable.
- AI is an optional enhancement. Keep original evidence separate from
  generated annotations and analyst decisions.
- Distinguish a publisher/source, a connector/feed, and a project's subscription.
- Project-specific rules, review decisions, and annotations must not leak into
  another project. Project filtering alone is not authorization.
- Collection stages candidates; analyst acceptance creates approved articles.
  Preserve manual capture, existing data, and article/event relationships.
- Model/provider choice, paid publisher access, trading, and commercialization
  are not prerequisites for the ingestion milestone.

## Engineering
- Extend the React/TypeScript/Vite/Tailwind/Supabase stack and existing UI.
- Frontend database calls belong in src/services; pages orchestrate data and
  components. Put reusable helpers in src/lib and shared types in src/types.
- Backend ingestion owns persistence, duplicate enforcement, and atomic
  acceptance. Do not implement scheduled ingestion as a browser timer.
- Record SQL changes under supabase/migrations. Document and verify a live
  schema baseline before assuming current constraints or policies.
- Keep credentials server-side. Never put service-role or scheduler secrets
  in VITE variables, source control, reports, or browser requests.
- Prefer small internal changes within a complete milestone over rewrites,
  generic plugin frameworks, or speculative infrastructure.
- Make routine implementation choices independently; record consequential
  deviations and explain tradeoffs. Preserve unrelated local changes.
- Do not alter hosted databases, deploy functions, or merge changes unless
  authorized by the active task. Prepare reviewable migrations and instructions.

## Verification and handoff
Use npm ci, npm run build, and npm run lint when available. Use npm.cmd on
Windows where needed. Test changed backend behavior separately: the frontend
build does not validate Supabase Edge Functions, SQL, RLS, or scheduling.
Add meaningful coverage for retries/concurrency, filtering, migrations, and
access isolation as those behaviors are implemented.
Report commands, results, and environmental limits accurately. Never call a
deployment verified because code compiles or a historical document says so.

Update existing FOUNDATION_* docs rather than creating competing summaries.
Maintain the milestone checklist and review report, including reviewed commit,
scope completed, deviations, verification evidence, owner decisions, and
external prerequisites. Distinguish proposed, implemented, locally tested,
historically reported, and hosted-verified behavior.
