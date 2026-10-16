import { isUnsafeIp, resolveHostAddresses } from "./network.ts";
const maxRedirects = 3;
const timeoutMs = 5000;
const maxResponseBytes = 1024 * 1024;
const userAgent = "FOUNDATION RSS Fetch v1";

export function validateUrl(value: unknown): URL {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("A feed URL is required.");
  }

  const url = new URL(value.trim());

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https feed URLs can be fetched.");
  }

  return url;
}

export async function fetchXmlWithRedirects(
  initialUrl: URL,
  warnings: string[],
  validators: { etag?: string | null; modified?: string | null } = {},
): Promise<
  {
    finalUrl: URL;
    xml: string;
    etag: string | null;
    modified: string | null;
    notModified?: boolean;
  }
> {
  let currentUrl = initialUrl;

  for (
    let redirectCount = 0;
    redirectCount <= maxRedirects;
    redirectCount += 1
  ) {
    await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl.toString(), {
        headers: {
          "User-Agent": userAgent,
          ...(validators.etag ? { "If-None-Match": validators.etag } : {}),
          ...(validators.modified
            ? { "If-Modified-Since": validators.modified }
            : {}),
          Accept:
            "application/rss+xml,application/atom+xml,application/xml,text/xml,text/plain",
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status === 304) {
        return {
          finalUrl: currentUrl,
          xml: "",
          etag: validators.etag ?? null,
          modified: validators.modified ?? null,
          notModified: true,
        };
      }
      if (isRedirect(response.status)) {
        await response.body?.cancel();
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
        throw new Error(
          `RSS feed fetch failed with status ${response.status}.`,
        );
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!isFeedContentType(contentType)) {
        throw new Error("URL did not return an RSS, Atom, or XML response.");
      }

      if (contentType.toLowerCase().includes("text/plain")) {
        warnings.push(
          "Feed returned text/plain; parsing as XML because some feeds are misconfigured.",
        );
      }

      return {
        etag: response.headers.get("etag"),
        modified: response.headers.get("last-modified"),
        finalUrl: currentUrl,
        xml: await readLimitedText(response),
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
      await reader.cancel();
      throw new Error(
        "RSS feed exceeds the response size limit; no items were processed.",
      );
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
  if (
    !["http:", "https:"].includes(url.protocol) || url.username || url.password
  ) {
    throw new Error(
      "Only public HTTP(S) URLs without credentials are allowed.",
    );
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("Localhost feed URLs cannot be fetched.");
  }

  if (isUnsafeIp(hostname)) {
    throw new Error(
      "Private, loopback, or link-local IP feed URLs cannot be fetched.",
    );
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
    throw new Error(
      "Feed hostname resolves to a private or unsafe IP address.",
    );
  }
}

function isIpAddress(value: string): boolean {
  return isIpv4(value) || value.includes(":");
}

function isIpv4(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}
