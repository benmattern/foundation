import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const deno = process.platform === "win32"
  ? "node_modules/deno/deno.exe"
  : "node_modules/deno/deno";
for (const name of ["collect-feeds", "fetch-rss-feed", "fetch-url-metadata"]) {
  const result = spawnSync(resolve(deno), [
    "check",
    "--frozen",
    "--config",
    `supabase/functions/${name}/deno.json`,
    `supabase/functions/${name}/index.ts`,
  ], {
    stdio: "inherit",
    env: { ...process.env, DENO_DIR: resolve("node_modules/.cache/deno") },
  });
  if (result.error) throw result.error;
  if (result.status) {
    process.exitCode = result.status;
    break;
  }
}
