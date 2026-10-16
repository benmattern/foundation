import { fetchXmlWithRedirects, validateUrl } from "../_shared/rssFetch.ts";
import { requireCaller } from "../_shared/auth.ts";
import { parseFeedXml } from "../_shared/feed.ts";

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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    try {
      await requireCaller(request);
    } catch {
      return jsonResponse({ error: "Authentication required." }, 401);
    }
    const body = await request.json();
    const feedUrl = validateUrl(body?.url);
    const warnings: string[] = [];
    const fetchResult = await fetchXmlWithRedirects(feedUrl, warnings);
    const parsed = parseFeedXml(
      fetchResult.xml,
      fetchResult.finalUrl,
      warnings,
    );

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
    const message = error instanceof Error
      ? error.message
      : "Unable to fetch RSS feed.";

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
