export type UrlMetadataSourceHints = {
  hostname: string | null;
  siteName: string | null;
};

export type UrlMetadataResponse = {
  requestedUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  siteName: string | null;
  publishedAt: string | null;
  sourceHints: UrlMetadataSourceHints;
  warnings: string[];
};
