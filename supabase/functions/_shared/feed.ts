import { XMLParser, XMLValidator } from "fast-xml-parser";

export type FeedItem = {
  title: string | null;
  link: string;
  guid: string | null;
  description: string | null;
  publishedAt: string | null;
  authors: string[];
  categories: string[];
  raw: Record<string, unknown>;
  warnings: string[];
};

type Node = Record<string, unknown>;
const object = (value: unknown): Node =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Node)
    : {};
const list = (value: unknown): unknown[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];
function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  return typeof object(value)["#text"] === "string"
    ? text(object(value)["#text"])
    : null;
}
function plain(value: unknown): string | null {
  return (
    text(value)
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  );
}
function url(value: unknown, base: URL): string | null {
  const input = text(value);
  if (!input) return null;
  try {
    const result = new URL(input, base);
    return ["http:", "https:"].includes(result.protocol) &&
      !result.username &&
      !result.password
      ? result.href
      : null;
  } catch {
    return null;
  }
}
function baseFor(node: Node, parent: URL): URL {
  const base = text(node["@_base"]);
  return base ? new URL(base, parent) : parent;
}

/** Bounded, validating metadata parser. DTDs/entities are never fetched or expanded. */
export function parseFeedXml(
  xml: string,
  finalUrl: URL,
  warnings: string[] = [],
  maxItems = 50,
) {
  if (new TextEncoder().encode(xml).length > 1024 * 1024) {
    throw new Error("Feed exceeds the 1 MiB limit.");
  }
  if (/<!\s*(DOCTYPE|ENTITY)\b/i.test(xml)) {
    throw new Error("Feed DTDs and entity declarations are unsupported.");
  }
  if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > 1000) {
    throw new Error("Invalid item limit.");
  }
  const valid = XMLValidator.validate(xml);
  if (valid !== true) throw new Error(`Malformed feed XML: ${valid.err.msg}`);
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    processEntities: true,
    htmlEntities: true,
  });
  const document = object(parser.parse(xml));
  const rss = object(document.rss);
  const atom = object(document.feed);
  const isRss = "rss" in document;
  if (!isRss && !("feed" in document)) {
    throw new Error("Unsupported feed format; expected RSS 2.0 or Atom.");
  }
  const root = isRss ? object(rss.channel) : atom;
  if (isRss && !("channel" in rss)) {
    throw new Error("RSS feed is missing its channel.");
  }
  const rootBase = baseFor(root, isRss ? baseFor(rss, finalUrl) : finalUrl);
  const entries = list(root[isRss ? "item" : "entry"]);
  if (entries.length > maxItems) {
    warnings.push(
      `Only the first ${maxItems} of ${entries.length} items were processed; older feed items are outside this check's window.`,
    );
  }
  const items: FeedItem[] = [];
  for (const [index, value] of entries.slice(0, maxItems).entries()) {
    const item = object(value);
    const itemWarnings: string[] = [];
    let base: URL;
    try {
      base = baseFor(item, rootBase);
    } catch {
      warnings.push(`Item ${index + 1} skipped: invalid xml:base.`);
      continue;
    }
    const links = list(item.link);
    const alternate = links.find(
      (link) => !object(link)["@_rel"] || object(link)["@_rel"] === "alternate",
    );
    const rawLink = isRss ? text(item.link) : text(object(alternate)["@_href"]);
    const guid = text(item[isRss ? "guid" : "id"]);
    const guidLink =
      isRss && object(item.guid)["@_isPermaLink"] !== "false" ? guid : null;
    const link = url(rawLink ?? guidLink, base);
    if (!link) {
      warnings.push(
        `Item ${index + 1} skipped: missing or invalid HTTP(S) article link.`,
      );
      continue;
    }
    const date = text(
      isRss ? (item.pubDate ?? item.date) : (item.published ?? item.updated),
    );
    const parsedDate = date ? new Date(date) : null;
    const publishedAt =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : null;
    if (date && !publishedAt) {
      itemWarnings.push("Publish date could not be parsed.");
    }
    const description = plain(
      isRss
        ? (item.description ?? item.encoded)
        : (item.summary ?? item.content),
    );
    const authors = list(item.author ?? item.creator)
      .map((author) => plain(object(author).name ?? author))
      .filter((author): author is string => !!author);
    const categories = list(item.category)
      .map((category) => plain(isRss ? category : object(category)["@_term"]))
      .filter((category): category is string => !!category);
    items.push({
      title: plain(item.title),
      link,
      guid,
      publishedAt,
      authors,
      categories,
      description:
        description && description.length > 20000
          ? `${description.slice(0, 20000).trim()}...`
          : description,
      raw: item,
      warnings: itemWarnings,
    });
  }
  return { feedTitle: plain(root.title), items };
}
