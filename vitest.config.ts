import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    env: {
      VITE_SUPABASE_URL: "https://foundation-test.invalid",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_test_only",
    },
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
