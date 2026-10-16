import { sourceCatalog } from "../src/lib/sourceCatalog.ts";
import { parseFeedXml } from "../supabase/functions/_shared/feed.ts";
// Explicit opt-in publisher requests only. No Supabase credentials or writes.
for (const source of sourceCatalog) {
  const response = await fetch(source.feedUrl, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const warnings = [];
  const { items } = parseFeedXml(
    await response.text(),
    new URL(response.url),
    warnings,
  );
  console.log(
    `${source.name}: HTTP ${response.status}; ${items.length} usable items; ${warnings.length} warnings`,
  );
}
