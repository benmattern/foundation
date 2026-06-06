type RssFeedItem = {
  title: string | null;
  link: string;
  guid: string | null;
  description: string | null;
  publishedAt: string | null;
  raw: Record<string, unknown>;
  warnings: string[];
};

type FetchRssFeedResponse = {
  feedTitle: string | null;
  feedUrl: string;
  finalUrl: string | null;
  items: RssFeedItem[];
  warnings: string[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const maxRedirects = 3;
const timeoutMs = 5000;
const maxResponseBytes = 1024 * 1024;
const maxItems = 50;
const userAgent = "FOUNDATION RSS Fetch v1";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await request.json();
    const feedUrl = validateUrl(body?.url);
    const warnings: string[] = [];
    const fetchResult = await fetchXmlWithRedirects(feedUrl, warnings);
    const parsed = parseFeedXml(fetchResult.xml, fetchResult.finalUrl, warnings);

    const response: FetchRssFeedResponse = {
      feedTitle: parsed.feedTitle,
      feedUrl: feedUrl.toString(),
      finalUrl: fetchResult.finalUrl.toString(),
      items: parsed.items,
      warnings,
    };

    if (response.items.length === 0) {
      response.warnings.push("No RSS or Atom feed items were found.");
    }

    return jsonResponse(response, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch RSS feed.";

    return jsonResponse({ error: message }, 400);
  }
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function validateUrl(value: unknown): URL {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("A feed URL is required.");
  }

  const url = new URL(value.trim());

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https feed URLs can be fetched.");
  }

  return url;
}

async function fetchXmlWithRedirects(
  initialUrl: URL,
  warnings: string[]
): Promise<{ finalUrl: URL; xml: string }> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl.toString(), {
        headers: {
          "User-Agent": userAgent,
          Accept:
            "application/rss+xml,application/atom+xml,application/xml,text/xml,text/plain",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (isRedirect(response.status)) {
        const location = response.headers.get("location");

        if (!location) {
          throw new Error("Redirect response did not include a location.");
        }

        if (redirectCount === maxRedirects) {
          throw new Error("Too many redirects while fetching RSS feed.");
        }

        currentUrl = new URL(location, currentUrl);
        continue;
      }

      if (!response.ok) {
        throw new Error(`RSS feed fetch failed with status ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!isFeedContentType(contentType)) {
        throw new Error("URL did not return an RSS, Atom, or XML response.");
      }

      if (contentType.toLowerCase().includes("text/plain")) {
        warnings.push("Feed returned text/plain; parsing as XML because some feeds are misconfigured.");
      }

      return {
        finalUrl: currentUrl,
        xml: await readLimitedText(response, warnings),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Unable to fetch RSS feed after redirects.");
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function isFeedContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();

  return (
    normalized.includes("application/rss+xml") ||
    normalized.includes("application/atom+xml") ||
    normalized.includes("application/xml") ||
    normalized.includes("text/xml") ||
    normalized.includes("text/plain")
  );
}

async function readLimitedText(
  response: Response,
  warnings: string[]
): Promise<string> {
  const reader = response.body?.getReader();

  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    receivedBytes += value.length;

    if (receivedBytes > maxResponseBytes) {
      warnings.push("RSS feed fetch stopped after reaching the response size limit.");
      const remainingBytes = maxResponseBytes - (receivedBytes - value.length);

      if (remainingBytes > 0) {
        chunks.push(value.slice(0, remainingBytes));
      }

      break;
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(concatChunks(chunks));
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    combined.set(chunk, offset);
    offset += chunk.length;
  });

  return combined;
}

async function assertSafeUrl(url: URL): Promise<void> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("Localhost feed URLs cannot be fetched.");
  }

  if (isUnsafeIp(hostname)) {
    throw new Error("Private, loopback, or link-local IP feed URLs cannot be fetched.");
  }

  if (!isIpAddress(hostname)) {
    await assertSafeDns(hostname);
  }
}

async function assertSafeDns(hostname: string): Promise<void> {
  const addresses = await resolveHostAddresses(hostname);

  if (addresses.length === 0) {
    throw new Error("Unable to resolve feed hostname.");
  }

  if (addresses.some(isUnsafeIp)) {
    throw new Error("Feed hostname resolves to a private or unsafe IP address.");
  }
}

async function resolveHostAddresses(hostname: string): Promise<string[]> {
  const addresses: string[] = [];

  try {
    addresses.push(...(await Deno.resolveDns(hostname, "A")));
  } catch {
    // Some hosts do not have IPv4 records.
  }

  try {
    addresses.push(...(await Deno.resolveDns(hostname, "AAAA")));
  } catch {
    // Some hosts do not have IPv6 records.
  }

  return addresses;
}

function isIpAddress(value: string): boolean {
  return isIpv4(value) || value.includes(":");
}

function isIpv4(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

function isUnsafeIp(value: string): boolean {
  if (isIpv4(value)) {
    return isUnsafeIpv4(value);
  }

  if (value.includes(":")) {
    return isUnsafeIpv6(value);
  }

  return false;
}

function isUnsafeIpv4(value: string): boolean {
  const parts = value.split(".").map(Number);

  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  );
}

function isUnsafeIpv6(value: string): boolean {
  const normalized = value.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

function parseFeedXml(
  xml: string,
  finalUrl: URL,
  warnings: string[]
): { feedTitle: string | null; items: RssFeedItem[] } {
  const rssItems = getElementBlocks(xml, "item");

  if (rssItems.length > 0) {
    return parseRss(xml, rssItems, finalUrl, warnings);
  }

  const atomEntries = getElementBlocks(xml, "entry");

  if (atomEntries.length > 0) {
    return parseAtom(xml, atomEntries, finalUrl, warnings);
  }

  return {
    feedTitle: textFromFirst(xml, "title"),
    items: [],
  };
}

function parseRss(
  xml: string,
  rssItems: string[],
  finalUrl: URL,
  warnings: string[]
): { feedTitle: string | null; items: RssFeedItem[] } {
  const channel = getElementBlocks(xml, "channel")[0] ?? xml;
  const feedTitle = textFromFirst(channel, "title");

  if (rssItems.length > maxItems) {
    warnings.push(`Only the first ${maxItems} RSS items were processed.`);
  }

  const items = rssItems.slice(0, maxItems).flatMap((item) => {
    const itemWarnings: string[] = [];
    const rawLink = textFromFirst(item, "link");
    const link = absolutizeUrl(rawLink, finalUrl);

    if (!link) {
      itemWarnings.push("RSS item skipped because it did not include a valid link.");
      return [];
    }

    const rawPublishedAt = textFromFirst(item, "pubDate");
    const publishedAt = normalizeDate(rawPublishedAt);

    if (rawPublishedAt && !publishedAt) {
      itemWarnings.push("RSS item publish date could not be parsed.");
    }

    return [
      {
        title: cleanText(textFromFirst(item, "title")),
        link,
        guid: cleanText(textFromFirst(item, "guid")),
        description: excerptHtml(textFromFirst(item, "description")),
        publishedAt,
        raw: {
          title: textFromFirst(item, "title"),
          link: rawLink,
          guid: textFromFirst(item, "guid"),
          description: textFromFirst(item, "description"),
          pubDate: rawPublishedAt,
        },
        warnings: itemWarnings,
      },
    ];
  });

  return { feedTitle: cleanText(feedTitle), items };
}

function parseAtom(
  xml: string,
  atomEntries: string[],
  finalUrl: URL,
  warnings: string[]
): { feedTitle: string | null; items: RssFeedItem[] } {
  const feedTitle = textFromFirst(xml, "title");

  if (atomEntries.length > maxItems) {
    warnings.push(`Only the first ${maxItems} Atom entries were processed.`);
  }

  const items = atomEntries.slice(0, maxItems).flatMap((entry) => {
    const itemWarnings: string[] = [];
    const rawLink = getAtomEntryLink(entry);
    const link = absolutizeUrl(rawLink, finalUrl);

    if (!link) {
      itemWarnings.push("Atom entry skipped because it did not include a valid link.");
      return [];
    }

    const rawPublishedAt =
      textFromFirst(entry, "published") ?? textFromFirst(entry, "updated");
    const publishedAt = normalizeDate(rawPublishedAt);

    if (rawPublishedAt && !publishedAt) {
      itemWarnings.push("Atom entry publish date could not be parsed.");
    }

    const summary =
      textFromFirst(entry, "summary") ?? textFromFirst(entry, "content");

    return [
      {
        title: cleanText(textFromFirst(entry, "title")),
        link,
        guid: cleanText(textFromFirst(entry, "id")),
        description: excerptHtml(summary),
        publishedAt,
        raw: {
          title: textFromFirst(entry, "title"),
          link: rawLink,
          id: textFromFirst(entry, "id"),
          summary,
          published: textFromFirst(entry, "published"),
          updated: textFromFirst(entry, "updated"),
        },
        warnings: itemWarnings,
      },
    ];
  });

  return { feedTitle: cleanText(feedTitle), items };
}

function getAtomEntryLink(entry: string): string | null {
  const links = getElementTags(entry, "link");
  const alternate =
    links.find((link) => {
      const rel = getAttributeValue(link, "rel");
      return !rel || rel === "alternate";
    }) ?? links[0];

  if (!alternate) return null;

  return getAttributeValue(alternate, "href") ?? textFromBlock(alternate);
}

function getElementTags(xml: string, tagName: string): string[] {
  const blockPattern = new RegExp(
    `<(?:[\\w.-]+:)?${escapeRegExp(tagName)}\\b[^>]*>[\\s\\S]*?<\\/(?:[\\w.-]+:)?${escapeRegExp(tagName)}>`,
    "gi"
  );
  const selfClosingPattern = new RegExp(
    `<(?:[\\w.-]+:)?${escapeRegExp(tagName)}\\b[^>]*/>`,
    "gi"
  );

  return [
    ...(xml.match(blockPattern) ?? []),
    ...(xml.match(selfClosingPattern) ?? []),
  ];
}

function getElementBlocks(xml: string, tagName: string): string[] {
  const pattern = new RegExp(
    `<(?:[\\w.-]+:)?${escapeRegExp(tagName)}\\b[^>]*>[\\s\\S]*?<\\/(?:[\\w.-]+:)?${escapeRegExp(tagName)}>`,
    "gi"
  );

  return xml.match(pattern) ?? [];
}

function textFromFirst(xml: string, tagName: string): string | null {
  const block = getElementBlocks(xml, tagName)[0];

  return block ? textFromBlock(block) : null;
}

function textFromBlock(block: string): string | null {
  const content = block.replace(/^<[^>]*>/, "").replace(/<\/[^>]*>$/, "");
  const decodedCdata = content.replace(
    /<!\[CDATA\[([\s\S]*?)\]\]>/g,
    (_match, cdata: string) => cdata
  );
  const withoutNestedTags = decodedCdata.replace(/<[^>]*>/g, " ");

  return decodeXml(withoutNestedTags);
}

function getAttributeValue(block: string, attributeName: string): string | null {
  const openTag = block.match(/^<[^>]*>/)?.[0] ?? "";
  const pattern = new RegExp(
    `\\b${escapeRegExp(attributeName)}\\s*=\\s*(["'])(.*?)\\1`,
    "i"
  );
  const value = pattern.exec(openTag)?.[2] ?? null;

  return decodeXml(value);
}

function absolutizeUrl(value: string | null, baseUrl: URL): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim(), baseUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value: string | null): string | null {
  if (!value) return null;

  const cleaned = value.replace(/\s+/g, " ").trim();

  return cleaned || null;
}

function excerptHtml(value: string | null): string | null {
  const cleaned = cleanText(value?.replace(/<[^>]*>/g, " ") ?? null);

  if (!cleaned) return null;

  return cleaned.length > 600 ? `${cleaned.slice(0, 600).trim()}...` : cleaned;
}

function decodeXml(value: string | null): string | null {
  if (!value) return null;

  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
