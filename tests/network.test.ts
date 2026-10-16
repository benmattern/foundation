// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchXmlWithRedirects } from "../supabase/functions/_shared/rssFetch";
import { isUnsafeIp } from "../supabase/functions/_shared/network";
beforeEach(() => {
  vi.stubGlobal("Deno", {
    resolveDns: vi.fn(async (_host, type) =>
      type === "A" ? ["93.184.216.34"] : []
    ),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("server URL retrieval", () => {
  it("rejects unsafe IPv4 and compressed, expanded, mapped IPv6 before fetching", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (
      const value of [
        "127.0.0.1",
        "10.0.0.1",
        "169.254.169.254",
        "192.168.1.1",
        "0.0.0.0",
        "100.64.1.1",
        "224.0.0.1",
        "::",
        "::1",
        "::ffff:7f00:1",
        "0:0:0:0:0:ffff:7f00:1",
        "fe90::1",
        "fd00::1",
      ]
    ) expect(isUnsafeIp(value)).toBe(true);
    expect(isUnsafeIp("93.184.216.34")).toBe(false);
    expect(isUnsafeIp("2606:4700:4700::1111")).toBe(false);
    for (
      const value of [
        "http://127.0.0.1/",
        "http://[::ffff:7f00:1]/",
        "ftp://example.com/",
        "https://user:password@example.com/",
      ]
    ) {
      await expect(fetchXmlWithRedirects(new URL(value), [])).rejects.toThrow();
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("revalidates redirect destinations and DNS answers", async () => {
    const fetch = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/private" },
      })
    );
    vi.stubGlobal("fetch", fetch);
    await expect(fetchXmlWithRedirects(new URL("https://example.com/feed"), []))
      .rejects.toThrow(/Private/);
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.stubGlobal("Deno", { resolveDns: vi.fn(async () => ["10.0.0.1"]) });
    await expect(fetchXmlWithRedirects(new URL("https://example.com/feed"), []))
      .rejects.toThrow(/private/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("passes conditional validators and handles 304 without XML parsing", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 304 }));
    vi.stubGlobal("fetch", fetch);
    expect(
      await fetchXmlWithRedirects(new URL("https://example.com/feed"), [], {
        etag: '"version"',
      }),
    ).toMatchObject({ notModified: true, xml: "" });
    expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({
      "If-None-Match": '"version"',
    });
  });
  it("rejects oversized bodies and unsupported content, bounds redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("x".repeat(1024 * 1024 + 1), {
          headers: { "content-type": "application/xml" },
        })
      ),
    );
    await expect(fetchXmlWithRedirects(new URL("https://example.com/feed"), []))
      .rejects.toThrow(/limit/);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("<html/>", { headers: { "content-type": "text/html" } })
      ),
    );
    await expect(fetchXmlWithRedirects(new URL("https://example.com/feed"), []))
      .rejects.toThrow(/XML response/);
    const redirect = vi.fn(async () =>
      new Response(null, { status: 301, headers: { location: "/loop" } })
    );
    vi.stubGlobal("fetch", redirect);
    await expect(fetchXmlWithRedirects(new URL("https://example.com/feed"), []))
      .rejects.toThrow(/Too many redirects/);
    expect(redirect).toHaveBeenCalledTimes(4);
  });
});
