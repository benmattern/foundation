import { useState } from "react";
import { createUrlImportResult } from "../lib/urlImport";
import type { UrlImportResult } from "../lib/urlImport";
import { fetchUrlMetadata } from "../services/urlMetadataService";
import type { ArticleWithTags } from "../types/article";
import type { Source } from "../types/source";
import type { UrlMetadataResponse } from "../types/urlMetadata";
import { Card } from "./ui/Card";

type Props = {
  articles: ArticleWithTags[];
  sources: Source[];
  onImportDraft: (
    result: UrlImportResult,
    metadata?: UrlMetadataResponse
  ) => void;
};

export function ArticleUrlImport({
  articles,
  sources,
  onImportDraft,
}: Props) {
  const [url, setUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastResult, setLastResult] = useState<UrlImportResult | null>(null);
  const [metadata, setMetadata] = useState<UrlMetadataResponse | null>(null);
  const [metadataError, setMetadataError] = useState("");
  const [metadataLoading, setMetadataLoading] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      const result = createUrlImportResult({
        inputUrl: url,
        articles,
        sources,
      });

      setErrorMessage("");
      setMetadata(null);
      setMetadataError("");
      setLastResult(result);
      onImportDraft(result);
    } catch (error) {
      setLastResult(null);
      setMetadata(null);
      setMetadataError("");
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to import this URL."
      );
    }
  }

  async function handleFetchMetadata() {
    if (!lastResult) return;

    setMetadataLoading(true);
    setMetadataError("");
    setMetadata(null);

    try {
      const response = await fetchUrlMetadata(lastResult.normalizedUrl);

      setMetadata(response);
    } catch (error) {
      setMetadataError(
        error instanceof Error
          ? error.message
          : "Metadata fetch failed. Continue with manual entry."
      );
    } finally {
      setMetadataLoading(false);
    }
  }

  function applyMetadata() {
    if (!lastResult || !metadata) return;

    onImportDraft(lastResult, metadata);
  }

  function updateUrl(value: string) {
    setUrl(value);
    setLastResult(null);
    setMetadata(null);
    setMetadataError("");
    setErrorMessage("");
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Import from URL
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Start an article draft from a URL. Review and complete the article
            before saving.
          </p>
        </div>

        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/article"
            value={url}
            onChange={(event) => updateUrl(event.target.value)}
          />

          {errorMessage && (
            <p className="text-sm text-red-300">{errorMessage}</p>
          )}

          {lastResult && (
            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm">
              <p className="break-all text-slate-300">
                Draft URL: {lastResult.normalizedUrl}
              </p>
              <p className="text-slate-400">
                Source:{" "}
                {lastResult.matchedSource
                  ? lastResult.matchedSource.name
                  : "No source match found"}
              </p>
              {lastResult.duplicateArticle && (
                <p className="text-amber-300">
                  Possible duplicate: {lastResult.duplicateArticle.title}
                </p>
              )}
            </div>
          )}

          {metadataError && (
            <p className="text-sm text-amber-300">
              {metadataError} Continue with manual entry if needed.
            </p>
          )}

          {metadata && (
            <div className="space-y-3 rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 text-sm">
              <div>
                <p className="font-medium text-blue-100">Metadata Preview</p>
                <p className="text-slate-400">
                  Review these suggestions before applying them to the article
                  draft.
                </p>
              </div>

              <dl className="space-y-2">
                <div>
                  <dt className="text-slate-500">Title</dt>
                  <dd className="text-slate-200">
                    {metadata.title || "No title found"}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">Description</dt>
                  <dd className="text-slate-200">
                    {metadata.description || "No description found"}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">Published</dt>
                  <dd className="text-slate-200">
                    {metadata.publishedAt
                      ? metadata.publishedAt.slice(0, 10)
                      : "No published date found"}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">Canonical / final URL</dt>
                  <dd className="break-all text-slate-200">
                    {metadata.canonicalUrl ??
                      metadata.finalUrl ??
                      "No canonical URL found"}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">Site</dt>
                  <dd className="text-slate-200">
                    {metadata.siteName || metadata.sourceHints.hostname}
                  </dd>
                </div>
              </dl>

              {metadata.warnings.length > 0 && (
                <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
                  {metadata.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={applyMetadata}
                className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-400"
              >
                Apply Metadata
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-900 transition hover:bg-white"
          >
            Start Draft
          </button>

          {lastResult && (
            <button
              type="button"
              onClick={handleFetchMetadata}
              disabled={metadataLoading}
              className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {metadataLoading ? "Fetching Metadata..." : "Fetch Metadata"}
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
