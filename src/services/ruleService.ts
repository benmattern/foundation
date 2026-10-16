import { supabase } from "../lib/supabaseClient";
import { candidateEvidence } from "../lib/candidateRules";
import { activeProjectId } from "./projectService";
import { getIngestionCandidates } from "./ingestionCandidateService";
import {
  classifyItem,
  inheritRules,
  type Rules,
} from "../../supabase/functions/_shared/rules";
import { getProjects, getSubscriptions } from "./projectService";
export async function saveProjectRules(rules: Rules, expected: Rules) {
  const { error } = await supabase.rpc("save_project_rules", {
    p_project: activeProjectId(),
    p_rules: rules,
    p_expected: expected,
  });
  if (error) throw error;
}
export async function reapplyRules() {
  const projectId = activeProjectId();
  const [projects, subscriptions, candidates] = await Promise.all([
    getProjects(),
    getSubscriptions(),
    getIngestionCandidates(),
  ]);
  const project = projects.find((p) => p.id === projectId)!;
  let count = 0;
  for (const candidate of candidates.filter((c) => c.status === "pending")) {
    const subscription = subscriptions.find((s) =>
      s.feed_id === candidate.raw_metadata.feed_id
    );
    const rules = inheritRules(project.rules, subscription?.rules ?? {});
    const result = classifyItem(
      candidateEvidence(candidate),
      rules,
      new Date().toISOString(),
    );
    const { error } = await supabase.rpc("apply_candidate_rules", {
      p_id: candidate.id,
      p_result: result,
      p_project_rules: project.rules,
      p_subscription_rules: subscription?.rules ?? null,
    });
    if (error) {
      throw new Error(
        `Reapplied ${count} items; stopped at ${candidate.id}: ${error.message}`,
      );
    }
    count++;
  }
  return count;
}
