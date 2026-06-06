import type { ArticleWithTags } from "../types/article";
import type { Source } from "../types/source";

const trackingParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

export type UrlImportResult = {
  normalizedUrl: string;
  matchedSource: Source | null;
  duplicateArticle: ArticleWithTags | null;
};

export function normalizeImportUrl(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Enter a URL to import.");
  }

  const valueWithProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
  const url = new URL(valueWithProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be imported.");
  }

  trackingParams.forEach((param) => url.searchParams.delete(param));
  url.hash = "";

  return url.toString();
}

export function createUrlImportResult(params: {
  inputUrl: string;
  articles: ArticleWithTags[];
  sources: Source[];
}): UrlImportResult {
  const normalizedUrl = normalizeImportUrl(params.inputUrl);

  return {
    normalizedUrl,
    matchedSource: findMatchingSource(normalizedUrl, params.sources),
    duplicateArticle: findDuplicateArticle(normalizedUrl, params.articles),
  };
}

function findDuplicateArticle(
  normalizedUrl: string,
  articles: ArticleWithTags[]
): ArticleWithTags | null {
  return (
    articles.find((article) => {
      try {
        return normalizeImportUrl(article.url) === normalizedUrl;
      } catch {
        return article.url.trim() === normalizedUrl;
      }
    }) ?? null
  );
}

function findMatchingSource(
  normalizedUrl: string,
  sources: Source[]
): Source | null {
  const importedHostname = getComparableHostname(normalizedUrl);

  if (!importedHostname) return null;

  return (
    sources.find((source) => {
      const sourceHostname = getComparableHostname(source.url);

      return sourceHostname === importedHostname;
    }) ?? null
  );
}

function getComparableHostname(value: string): string | null {
  try {
    return new URL(normalizeImportUrl(value)).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}
