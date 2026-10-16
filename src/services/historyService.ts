import { supabase } from "../lib/supabaseClient";
import { activeProjectId } from "./projectService";
export async function getCandidateHistory(
  candidateId: string,
  itemId?: string | null,
) {
  const [review, origins, rules] = await Promise.all([
    supabase.from("review_history").select("*").eq("candidate_id", candidateId)
      .eq("project_id", activeProjectId()).order("reviewed_at", {
        ascending: false,
      }).limit(50),
    itemId
      ? supabase.from("item_origins").select("*").eq("item_id", itemId).order(
        "observed_at",
        { ascending: false },
      ).limit(50)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("rule_evaluations").select("*").eq(
      "candidate_id",
      candidateId,
    ).eq("project_id", activeProjectId()).order("evaluated_at", {
      ascending: false,
    }).limit(50),
  ]);
  if (review.error || origins.error || rules.error) {
    throw review.error || origins.error || rules.error;
  }
  return {
    review: review.data,
    origins: origins.data,
    ruleEvaluations: rules.data,
  };
}
