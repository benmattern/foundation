import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { createServer } from "node:net";
// Own the Vite process directly: npm/cmd grandchildren can outlive Playwright on Windows.
const env = {
  ...process.env,
  VITE_SUPABASE_URL: "https://foundation-test.invalid",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_test_only",
};
delete env.NO_COLOR;
// Refuse to reuse an unrelated local server, which might have hosted credentials.
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on("error", reject);
  probe.listen(4173, "127.0.0.1", () => probe.close(resolve));
});
const server = spawn(process.execPath, [
  "node_modules/vite/bin/vite.js",
  "--host",
  "127.0.0.1",
  "--port",
  "4173",
  "--strictPort",
], { env, stdio: "ignore", windowsHide: true });
let serverError;
server.on("error", (error) => {
  serverError = error;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) {
      throw new Error(
        `Test server exited (${server.exitCode}); check port 4173 is unused.`,
      );
    }
    try {
      ready = (await fetch("http://127.0.0.1:4173", {
        signal: AbortSignal.timeout(1000),
      })).ok;
    } catch { /* Wait for Vite startup. */ }
    if (ready) break;
    await setTimeout(200);
  }
  if (!ready) throw new Error("Browser test server did not become ready.");
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      "node_modules/@playwright/test/cli.js",
      "test",
      ...process.argv.slice(2),
    ], { env, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
  process.exitCode = result;
} finally {
  // This is the exact child created above, never another process using the port.
  server.kill();
}
