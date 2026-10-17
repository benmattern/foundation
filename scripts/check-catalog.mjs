import { sourceCatalog } from "../src/lib/sourceCatalog.ts";
import { parseFeedXml } from "../supabase/functions/_shared/feed.ts";
// Explicit opt-in publisher requests only. No Supabase credentials or writes.
let failures = 0;
for (const source of sourceCatalog.filter((s) => s.feedUrl)) {
  try {
    const response = await fetch(source.feedUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(`${source.name}: HTTP ${response.status}`);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 1048576)
        throw Error("Feed exceeds the 1 MiB application limit");
      chunks.push(chunk);
    }
    const warnings = [];
    const { items } = parseFeedXml(
      Buffer.concat(chunks).toString("utf8"),
      new URL(response.url),
      warnings,
    );
    console.log(
      JSON.stringify({
        id: source.id,
        verified_at: new Date().toISOString(),
        status: response.status,
        bytes: size,
        items: items.length,
        dated: items.filter((i) => i.publishedAt).length,
        described: items.filter((i) => i.description).length,
        warnings,
      }),
    );
    if (!items.length) throw Error("No usable items");
  } catch (e) {
    failures++;
    console.error(`${source.id}: ${e.message}`);
  }
}
process.exitCode = failures ? 1 : 0;
