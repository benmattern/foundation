export const viewKeys = [
  "q",
  "source",
  "tag",
  "since",
  "until",
  "period",
  "order",
  "status",
  "route",
  "import",
];
export function viewFilters(params: URLSearchParams) {
  return Object.fromEntries([...params].filter(([k]) => viewKeys.includes(k)));
}
export function resolveView(
  filters: Record<string, string>,
  now = new Date(Math.floor(Date.now() / 86400000) * 86400000),
) {
  const p = new URLSearchParams(filters);
  if (filters.period) {
    p.delete("since");
    p.delete("until");
    p.set(
      "since",
      new Date(now.getTime() - Number(filters.period) * 86400000).toISOString(),
    );
  }
  return p;
}
