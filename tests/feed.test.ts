// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseFeedXml } from "../supabase/functions/_shared/feed";

const base = new URL("https://publisher.example/news/feed.xml");
const rss = (body: string) =>
  `<rss version="2.0"><channel><title>Publisher</title>${body}</channel></rss>`;
describe("validating feed parser", () => {
  it("preserves RSS identifiers, entities, categories, author, dates and relative links", () => {
    const result = parseFeedXml(
      rss(
        `<item><title>Chips &amp; &#x53;upply</title><link>../article</link><guid isPermaLink="false">001</guid><pubDate>2026-10-16T12:00:00Z</pubDate><dc:creator xmlns:dc="urn:dc">Reporter</dc:creator><category>Technology</category><description><![CDATA[<p>A report</p>]]></description></item>`,
      ),
      base,
    );
    expect(result.feedTitle).toBe("Publisher");
    expect(result.items[0]).toMatchObject({
      title: "Chips & Supply",
      link: "https://publisher.example/article",
      guid: "001",
      authors: ["Reporter"],
      categories: ["Technology"],
      description: "A report",
      publishedAt: "2026-10-16T12:00:00.000Z",
    });
  });
  it("supports prefixed Atom, xml:base, alternate links and published fallback", () => {
    const result = parseFeedXml(
      `<a:feed xmlns:a="http://www.w3.org/2005/Atom" xml:base="https://publisher.example/root/"><a:title>Atom</a:title><a:entry xml:base="sub/"><a:id>tag:001</a:id><a:link rel="self" href="internal"/><a:link rel="alternate" href="story"/><a:updated>2026-10-16</a:updated><a:author><a:name>Alice</a:name></a:author><a:category term="Policy"/></a:entry></a:feed>`,
      base,
    );
    expect(result.items[0]).toMatchObject({
      guid: "tag:001",
      link: "https://publisher.example/root/sub/story",
      authors: ["Alice"],
      categories: ["Policy"],
    });
  });
  it("reports skipped invalid schemes and missing links, retains bad-date warnings", () => {
    const warnings: string[] = [];
    const result = parseFeedXml(
      rss(
        `<item><link>ftp://example.com/a</link></item><item><title>No link</title></item><item><link>/ok</link><pubDate>nonsense</pubDate></item>`,
      ),
      base,
      warnings,
    );
    expect(result.items).toHaveLength(1);
    expect(warnings).toHaveLength(2);
    expect(result.items[0].warnings).toHaveLength(1);
    expect(result.items[0].publishedAt).toBeNull();
  });
  it("supports empty feeds but rejects unsupported and malformed documents", () => {
    expect(parseFeedXml(rss(""), base).items).toEqual([]);
    for (const xml of [
      "",
      "<html/>",
      "<rss><channel><item><link>/x</link></item>",
      "<rss/>",
      "<rss><channel></rss>",
    ]) {
      expect(() => parseFeedXml(xml, base)).toThrow();
    }
  });
  it("rejects entity declarations, oversized bodies and credential URLs", () => {
    expect(() =>
      parseFeedXml(`<!DOCTYPE rss [<!ENTITY x "bad">]>${rss("")}`, base),
    ).toThrow(/DTD/);
    expect(() => parseFeedXml("x".repeat(1024 * 1024 + 1), base)).toThrow(
      /limit/,
    );
    expect(
      parseFeedXml(
        rss("<item><link>https://user:secret@example.com/a</link></item>"),
        base,
      ).items,
    ).toEqual([]);
  });
  it("reports the finite window and caps excerpts", () => {
    const warnings: string[] = [];
    const items = parseFeedXml(
      rss(
        Array.from(
          { length: 51 },
          (_, i) =>
            `<item><link>/a/${i}</link><description>${"x".repeat(
              700,
            )}</description></item>`,
        ).join(""),
      ),
      base,
      warnings,
    ).items;
    expect(items).toHaveLength(50);
    expect(items[0].description?.length).toBe(700);
    expect(warnings[0]).toMatch(/50 of 51/);
    const capped = parseFeedXml(
      rss(
        `<item><link>/long</link><description>${"x".repeat(25000)}</description></item>`,
      ),
      base,
    ).items[0];
    expect(capped.description?.length).toBe(20003);
  });
});
