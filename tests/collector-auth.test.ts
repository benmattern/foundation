// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
let handler: (request: Request) => Promise<Response>;
beforeEach(async () => {
  vi.resetModules();
  mocks.getUser.mockReset().mockResolvedValue({
    data: { user: null },
    error: new Error("Invalid token"),
  });
  mocks.rpc.mockReset().mockResolvedValue({ data: [], error: null });
  mocks.from.mockReset();
  mocks.createClient.mockReset().mockReturnValue({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    from: mocks.from,
  });
  vi.stubGlobal("Deno", {
    env: {
      get: (key: string) =>
        key === "INGESTION_SCHEDULER_SECRET"
          ? "test-scheduler-secret"
          : "local-test-setting",
    },
    serve: (callback: typeof handler) => {
      handler = callback;
    },
  });
  await import("../supabase/functions/collect-feeds/index");
});
afterEach(() => vi.unstubAllGlobals());
it("rejects anonymous requests and arbitrary scheduler credentials before database access", async () => {
  for (const headers of [{}, { "x-scheduler-secret": "incorrect" }]) {
    expect(
      (await handler(
        new Request("https://local/collect", {
          method: "POST",
          headers,
          body: "{}",
        }),
      )).status,
    ).toBe(401);
  }
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalled();
});
it("validates bearer tokens against Auth rather than trusting a publishable key", async () => {
  const response = await handler(
    new Request("https://local/collect", {
      method: "POST",
      headers: { authorization: "Bearer invalid-key" },
      body: '{"feed_id":"x"}',
    }),
  );
  expect(response.status).toBe(401);
  expect(mocks.getUser).toHaveBeenCalledWith("invalid-key");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("requires an enabled project subscription for verified users", async () => {
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "owner" } },
    error: null,
  });
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  mocks.from.mockReturnValue(chain);
  const response = await handler(
    new Request("https://local/collect", {
      method: "POST",
      headers: { authorization: "Bearer token" },
      body: '{"feed_id":"feed","project_id":"project"}',
    }),
  );
  expect(response.status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("allows the server scheduler path and handles CORS/methods", async () => {
  const response = await handler(
    new Request("https://local/collect", {
      method: "POST",
      headers: { "x-scheduler-secret": "test-scheduler-secret" },
      body: "{}",
    }),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ outcomes: [] });
  expect(mocks.rpc).toHaveBeenCalledWith("due_feeds");
  expect(mocks.getUser).not.toHaveBeenCalled();
  expect(
    (await handler(new Request("https://local/collect", { method: "OPTIONS" })))
      .status,
  ).toBe(200);
  expect((await handler(new Request("https://local/collect"))).status).toBe(
    405,
  );
});
