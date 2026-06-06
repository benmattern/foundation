type UrlMetadataResponse = {
  requestedUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  siteName: string | null;
  publishedAt: string | null;
  sourceHints: {
    hostname: string | null;
    siteName: string | null;
  };
  warnings: string[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const maxRedirects = 3;
const timeoutMs = 5000;
const maxResponseBytes = 768 * 1024;
const userAgent = "FOUNDATION URL Metadata Fetch v1.1";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const body = await request.json();
    const requestedUrl = validateUrl(body?.url);
    const warnings: string[] = [];
    const fetchResult = await fetchHtmlWithRedirects(requestedUrl, warnings);
    const metadata = extractMetadata(fetchResult.html, fetchResult.finalUrl, warnings);

    const response: UrlMetadataResponse = {
      requestedUrl: requestedUrl.toString(),
      finalUrl: fetchResult.finalUrl.toString(),
      canonicalUrl: metadata.canonicalUrl,
      title: metadata.title,
      description: metadata.description,
      siteName: metadata.siteName,
      publishedAt: metadata.publishedAt,
      sourceHints: {
        hostname: fetchResult.finalUrl.hostname || null,
        siteName: metadata.siteName,
      },
      warnings,
    };

    if (!response.title && !response.description && !response.publishedAt) {
      response.warnings.push("Metadata unavailable or incomplete for this URL.");
    }

    if (
      response.canonicalUrl &&
      normalizeComparableUrl(response.canonicalUrl) !==
        normalizeComparableUrl(response.requestedUrl)
    ) {
      response.warnings.push("Canonical URL differs from the requested URL.");
    } else if (
      response.finalUrl &&
      normalizeComparableUrl(response.finalUrl) !==
        normalizeComparableUrl(response.requestedUrl)
    ) {
      response.warnings.push("Final URL differs from the requested URL.");
    }

    if (!response.publishedAt) {
      response.warnings.push("Published date was not found or could not be parsed.");
    }

    return jsonResponse(response, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch URL metadata.";

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
    throw new Error("A URL is required.");
  }

  const url = new URL(value.trim());

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be fetched.");
  }

  return url;
}

async function fetchHtmlWithRedirects(
  initialUrl: URL,
  warnings: string[]
): Promise<{ finalUrl: URL; html: string }> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl.toString(), {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml",
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
          throw new Error("Too many redirects while fetching metadata.");
        }

        currentUrl = new URL(location, currentUrl);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Metadata fetch failed with status ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!isHtmlContentType(contentType)) {
        throw new Error("URL did not return an HTML response.");
      }

      return {
        finalUrl: currentUrl,
        html: await readLimitedText(response, warnings),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Unable to fetch metadata after redirects.");
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function isHtmlContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();

  return (
    normalized.includes("text/html") ||
    normalized.includes("application/xhtml+xml")
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
      warnings.push("Metadata fetch stopped after reaching the response size limit.");
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
    throw new Error("Localhost URLs cannot be fetched.");
  }

  if (isUnsafeIp(hostname)) {
    throw new Error("Private, loopback, or link-local IP URLs cannot be fetched.");
  }

  if (!isIpAddress(hostname)) {
    await assertSafeDns(hostname);
  }
}

async function assertSafeDns(hostname: string): Promise<void> {
  const addresses = await resolveHostAddresses(hostname);

  if (addresses.length === 0) {
    throw new Error("Unable to resolve URL hostname.");
  }

  if (addresses.some(isUnsafeIp)) {
    throw new Error("URL hostname resolves to a private or unsafe IP address.");
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

type ExtractedMetadata = {
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  siteName: string | null;
  publishedAt: string | null;
};

function extractMetadata(
  html: string,
  finalUrl: URL,
  warnings: string[]
): ExtractedMetadata {
  const jsonLd = extractJsonLdMetadata(html);
  const canonicalHref = getLinkHref(html, "canonical");
  const ogUrl = getMetaContent(html, "property", "og:url");
  const title =
    getMetaContent(html, "property", "og:title") ??
    getMetaContent(html, "name", "twitter:title") ??
    jsonLd.title ??
    getTitleTag(html);
  const description =
    getMetaContent(html, "property", "og:description") ??
    getMetaContent(html, "name", "twitter:description") ??
    getMetaContent(html, "name", "description") ??
    jsonLd.description;
  const siteName =
    getMetaContent(html, "property", "og:site_name") ??
    jsonLd.siteName ??
    finalUrl.hostname;
  const rawPublishedAt =
    getMetaContent(html, "property", "article:published_time") ??
    jsonLd.publishedAt ??
    getFirstMetaContent(html, [
      ["name", "date"],
      ["name", "pubdate"],
      ["name", "publishdate"],
      ["name", "publish_date"],
      ["name", "datePublished"],
      ["property", "datePublished"],
    ]);

  const publishedAt = normalizeDate(rawPublishedAt);

  if (rawPublishedAt && !publishedAt) {
    warnings.push("Published date metadata was present but could not be parsed.");
  }

  return {
    canonicalUrl: absolutizeUrl(canonicalHref ?? ogUrl, finalUrl),
    title: cleanText(title),
    description: cleanText(description),
    siteName: cleanText(siteName),
    publishedAt,
  };
}

function getMetaContent(
  html: string,
  attributeName: string,
  attributeValue: string
): string | null {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${attributeName}\\s*=\\s*["']${escapeRegExp(
      attributeValue
    )}["'])(?=[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'])[^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta\\b(?=[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'])(?=[^>]*\\b${attributeName}\\s*=\\s*["']${escapeRegExp(
      attributeValue
    )}["'])[^>]*>`,
    "i"
  );

  return decodeHtml(pattern.exec(html)?.[1] ?? reversePattern.exec(html)?.[1] ?? null);
}

function getFirstMetaContent(
  html: string,
  candidates: Array<[string, string]>
): string | null {
  for (const [attributeName, attributeValue] of candidates) {
    const value = getMetaContent(html, attributeName, attributeValue);

    if (value) return value;
  }

  return null;
}

function getLinkHref(html: string, relValue: string): string | null {
  const pattern = new RegExp(
    `<link\\b(?=[^>]*\\brel\\s*=\\s*["'][^"']*\\b${escapeRegExp(
      relValue
    )}\\b[^"']*["'])(?=[^>]*\\bhref\\s*=\\s*["']([^"']*)["'])[^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<link\\b(?=[^>]*\\bhref\\s*=\\s*["']([^"']*)["'])(?=[^>]*\\brel\\s*=\\s*["'][^"']*\\b${escapeRegExp(
      relValue
    )}\\b[^"']*["'])[^>]*>`,
    "i"
  );

  return decodeHtml(pattern.exec(html)?.[1] ?? reversePattern.exec(html)?.[1] ?? null);
}

function getTitleTag(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);

  return decodeHtml(match?.[1] ?? null);
}

type JsonLdMetadata = {
  title: string | null;
  description: string | null;
  siteName: string | null;
  publishedAt: string | null;
};

function extractJsonLdMetadata(html: string): JsonLdMetadata {
  const result: JsonLdMetadata = {
    title: null,
    description: null,
    siteName: null,
    publishedAt: null,
  };
  const pattern =
    /<script\b(?=[^>]*type\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]) ?? match[1]);
      const candidates = flattenJsonLd(parsed);

      for (const candidate of candidates) {
        const type = String(candidate["@type"] ?? "").toLowerCase();

        if (!type.includes("article") && !type.includes("newsarticle")) {
          continue;
        }

        result.title ??= getString(candidate.headline) ?? getString(candidate.name);
        result.description ??= getString(candidate.description);
        result.publishedAt ??= getString(candidate.datePublished);
        result.siteName ??= getPublisherName(candidate.publisher);
      }
    } catch {
      // Invalid JSON-LD is common and should not break metadata fetches.
    }
  }

  return result;
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (isRecord(value)) {
    const graph = value["@graph"];

    return [value, ...flattenJsonLd(graph)];
  }

  return [];
}

function getPublisherName(value: unknown): string | null {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const name = getPublisherName(item);

      if (name) return name;
    }
  }

  if (isRecord(value)) {
    return getString(value.name);
  }

  return null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function absolutizeUrl(value: string | null, baseUrl: URL): string | null {
  if (!value) return null;

  try {
    const url = new URL(value, baseUrl);

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

function decodeHtml(value: string | null): string | null {
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

function normalizeComparableUrl(value: string): string {
  try {
    const url = new URL(value);

    url.hash = "";

    return url.toString();
  } catch {
    return value;
  }
}
