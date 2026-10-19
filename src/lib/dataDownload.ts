import type { Analysis } from "../types/dataset";
export function downloadAnalysis(analysis: Analysis) {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          { format: "foundation-analysis-v1", ...analysis },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `foundation-analysis-${analysis.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
