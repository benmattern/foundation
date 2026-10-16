import { createClient } from "@supabase/supabase-js";
import { parseFeedXml } from "../_shared/feed.ts";
import { fetchXmlWithRedirects, validateUrl } from "../_shared/rssFetch.ts";
import { classifyItem, inheritRules, type Rules } from "../_shared/rules.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-scheduler-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const startedAt = Date.now();
  const admin = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
            : AbortSignal.timeout(10000),
        }),
    },
  });
  try {
    const body = await request.json();
    const schedulerSecret = Deno.env.get("INGESTION_SCHEDULER_SECRET");
    const scheduled = !!schedulerSecret &&
      request.headers.get("x-scheduler-secret") === schedulerSecret;
    let owner: string | null = null;
    if (!scheduled) {
      const token = request.headers.get("authorization")?.replace(
        /^Bearer\s+/i,
        "",
      );
      if (!token) return json({ error: "Authentication required" }, 401);
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) {
        return json({ error: "Authentication required" }, 401);
      }
      owner = data.user.id;
      if (typeof body.feed_id !== "string") {
        return json({ error: "Select a feed" }, 400);
      }
      const { data: subscription, error: accessError } = await admin.from(
        "project_subscriptions",
      ).select("project_id")
        .eq("feed_id", body.feed_id).eq("project_id", body.project_id).eq(
          "owner_id",
          owner,
        ).eq("enabled", true).maybeSingle();
      if (accessError || !subscription) {
        return json({ error: "Enabled project subscription required" }, 403);
      }
    }
    const { data: feeds, error } = scheduled
      ? await admin.rpc("due_feeds")
      : await admin.from("rss_feeds").select("*").eq("is_active", true).eq(
        "id",
        body.feed_id,
      ).eq("owner_id", owner!).limit(1);
    if (error) throw error;
    const outcomes = [];
    for (const feed of feeds ?? []) {
      if (Date.now() - startedAt > 80000) break;
      const feedStartedAt = Date.now();
      const { data: runId, error: claimError } = await admin.rpc("claim_feed", {
        p_feed: feed.id,
        p_owner: feed.owner_id,
      });
      if (claimError) {
        outcomes.push({
          feedId: feed.id,
          status: "error",
          error: claimError.message,
        });
        continue;
      }
      if (!runId) {
        outcomes.push({ feedId: feed.id, status: "paused_or_running" });
        continue;
      }
      const warnings: string[] = [];
      let staged = 0;
      let fetched = 0;
      try {
        const { data: subscriptions, error: subscriptionError } = await admin
          .from("project_subscriptions")
          .select("project_id,rules,projects!inner(rules,archived)").eq(
            "feed_id",
            feed.id,
          ).eq("enabled", true).limit(101);
        if (subscriptionError) throw subscriptionError;
        if ((subscriptions?.length ?? 0) > 100) {
          throw new Error(
            "Feed exceeds the supported 100-subscription batch; reduce fanout before retrying.",
          );
        }
        const response = await fetchXmlWithRedirects(
          validateUrl(feed.feed_url),
          warnings,
          { etag: feed.etag, modified: feed.last_modified },
        );
        const parsed = response.notModified
          ? { items: [] }
          : parseFeedXml(response.xml, response.finalUrl, warnings);
        fetched = parsed.items.length;
        let failures = 0;
        for (const item of parsed.items) {
          if (
            Date.now() - feedStartedAt > 60000 ||
            Date.now() - startedAt > 100000
          ) {
            warnings.push(
              "Collection time budget reached; remaining items will be retried.",
            );
            failures++;
            break;
          }
          const identity = new URL(item.link);
          identity.hash = "";
          for (
            const name of [
              "utm_source",
              "utm_medium",
              "utm_campaign",
              "utm_term",
              "utm_content",
            ]
          ) identity.searchParams.delete(name);
          const results: Record<string, unknown> = {};
          for (const subscription of subscriptions ?? []) {
            const project = subscription.projects as unknown as {
              rules: Rules;
              archived: boolean;
            };
            if (project.archived) continue;
            const classification = classifyItem(
              item,
              inheritRules(project.rules, subscription.rules ?? {}),
              new Date().toISOString(),
            );
            results[subscription.project_id] = {
              projectRules: project.rules,
              subscriptionRules: subscription.rules,
              classification,
            };
          }
          const { data: count, error } = await admin.rpc("stage_feed_item", {
            p_run: runId,
            p_identity: identity.href,
            p_origin: item.guid ? `id:${item.guid}` : `url:${identity.href}`,
            p_item: {
              ...item,
              feedUrl: feed.feed_url,
              finalFeedUrl: response.finalUrl.href,
            },
            p_results: results,
          });
          if (error) {
            failures++;
            warnings.push(error.message);
          } else staged += Number(count);
        }
        const status = failures > 0 && failures === parsed.items.length
          ? "error"
          : failures ||
              warnings.some((warning) => /skipped/.test(warning))
          ? "partial"
          : "success";
        const { data: finalStatus, error: finishError } = await admin.rpc(
          "finish_feed",
          {
            p_run: runId,
            p_status: status,
            p_warnings: warnings,
            p_etag: response.etag,
            p_modified: response.modified,
            p_fetched: fetched,
          },
        );
        if (finishError) throw finishError;
        outcomes.push({
          feedId: feed.id,
          status: finalStatus ?? status,
          fetched,
          staged,
          warnings,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const { error: finishError } = await admin.rpc("finish_feed", {
          p_run: runId,
          p_status: "error",
          p_warnings: warnings,
          p_error: message,
          p_fetched: fetched,
        });
        outcomes.push({
          feedId: feed.id,
          status: "error",
          fetched,
          staged,
          error: message,
          ...(finishError ? { persistenceError: finishError.message } : {}),
        });
      }
    }
    return json({ outcomes });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : String(error),
    }, 400);
  }
});
