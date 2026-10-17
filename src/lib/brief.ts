import type { QuestionPacket } from "../types/session";
import type { EvidenceSnapshot } from "../types/research";
const text = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const md = (s: string) => text(s).replaceAll("[", "\\[").replaceAll("]", "\\]");
export function packetVersions(p: QuestionPacket) {
  return JSON.stringify({
    citation_availability: p.citation_availability,
    question: p.question,
    links: p.links,
    findings: p.findings,
    project: p.project,
  });
}
export function composeBrief(p: QuestionPacket) {
  const refs: { snapshot: EvidenceSnapshot; available: boolean }[] = [];
  function cite(s: EvidenceSnapshot) {
    let i = refs.findIndex((r) => r.snapshot.id === s.id);
    if (i < 0) {
      i = refs.length;
      refs.push({
        snapshot: s,
        available:
          p.citation_availability?.[s.id] ??
          p.links.some((l) => l.linked && l.article?.id === s.id),
      });
    }
    return `[${i + 1}]`;
  }
  const findings = p.findings
    .map(
      (f) =>
        `### Finding\nObserved claim (analyst): ${md(f.observed) || "(empty)"}\n\nInterpretation (analyst): ${md(f.interpretation) || "(empty)"}\n\nUncertainties: ${md(f.uncertainties) || "(empty)"}\n\nReferences: ${f.citations.map(cite).join(" ") || "(none)"}`,
    )
    .join("\n\n");
  const evidence = p.links
    .map(
      (l) =>
        `- ${l.disposition}: ${md(l.note) || "(why-it-matters note missing)"} ${cite(l.article_snapshot)}${!l.linked ? " — unlinked; snapshot retained" : ""}`,
    )
    .join("\n");
  // Include only selected attributed passages, never full article/legacy summary.
  const passages = p.findings
    .flatMap((f) =>
      f.citations
        .filter((c) => c.passage)
        .map(
          (c) =>
            `> ${md(c.passage!)}\n> Attribution: ${md(c.passage_origin?.origin ?? "Attribution unavailable")} ${cite(c)}`,
        ),
    )
    .join("\n\n");
  const references = refs
    .map(
      ({ snapshot: s, available }, i) =>
        `${i + 1}. ${md(s.title)}${available ? "" : " — UNAVAILABLE / unlinked evidence snapshot"}\n   Original URL: ${md(s.url ?? "(unknown)")}\n   Publication: ${s.published_at ?? "(unknown)"}; snapshot captured: ${s.captured_at ?? "(unknown)"}`,
    )
    .join("\n");
  const manifest = {
    as_of: p.as_of,
    question: { id: p.question.id, version: p.question.version },
    links: p.links.map((l) => ({
      id: l.id,
      version: l.version,
      article_id: l.article_id,
      article_revision: l.article_revision ?? null,
    })),
    findings: p.findings.map((f) => ({ id: f.id, version: f.version })),
  };
  return `# DRAFT: ${md(p.question.title)}\n\nProject: ${md(p.project.name)}\nScope: ${md(p.project.description) || "(not recorded)"}\nAs of / assembled: ${p.as_of}\n\n## Current analyst answer\n${md(p.question.answer) || "(empty — no answer recorded)"}\n\n## Selected findings\n${findings || "(none selected)"}\n\n## Selected evidence notes\n${evidence || "(none selected)"}\n\n## Attributed passages\n${passages || "(none selected)"}\n\n## Unresolved questions / next actions\n${md(p.question.followups) || "(empty)"}\n\n## Source references\n${references || "(none)"}\n\nShared entities or repeated reporting do not establish independent confirmation.\n\n## Version manifest\n${JSON.stringify(manifest, null, 2)}\n`;
}
export function briefHtml(markdown: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Research brief — draft</title><style>body{font:16px/1.6 system-ui;margin:2rem auto;padding:1rem;max-width:75ch;color:#172033;background:white}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}@media print{body{margin:0;max-width:none;padding:0}pre{font-size:11pt}}</style></head><body><pre>${text(markdown)}</pre></body></html>`;
}
export function downloadBrief(body: string, html = false) {
  const url = URL.createObjectURL(
    new Blob([body], {
      type: html ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `foundation-brief.${html ? "html" : "md"}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
