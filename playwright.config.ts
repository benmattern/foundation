import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  // Edge/native screenshots compete for Windows desktop resources. Linux CI
  // keeps Playwright's normal worker selection.
  workers: process.platform === "win32" ? 1 : undefined,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
  },
});
