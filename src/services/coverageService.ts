import { supabase } from "../lib/supabaseClient";
import { activeProjectId } from "./projectService";
import { sessionRpc } from "./sessionService";
import { queryAll } from "./queryAll";
import type { CatalogSource } from "../lib/sourceCatalog";
import type { IngestionCandidate } from "../types/ingestionCandidate";
import type { Rules } from "../../supabase/functions/_shared/rules";
export type CatalogSelection = {
  catalog_id: string;
  source_id: string;
  topics: string[];
  region: string;
};
export const getCatalogSelections = () =>
  queryAll<CatalogSelection>((from, to) =>
    supabase
      .from("project_catalog_sources")
      .select("*")
      .eq("project_id", activeProjectId())
      .order("catalog_id")
      .range(from, to),
  );
export const selectCatalogSource = (source: CatalogSource) =>
  sessionRpc<string>("select_catalog_source", { p_catalog: source });
export type TuningExample = {
  useful: boolean;
  held_out: boolean;
  version: number;
};
export type CalibrationItem = IngestionCandidate & {
  feedback: TuningExample | null;
  first_rule_result: IngestionCandidate["rule_result"];
  current_project_rules: Rules;
  current_subscription_rules: Partial<Rules> | null;
};
export type CalibrationWindow = {
  as_of: string;
  since: string;
  until: string;
  source_id: string | null;
  collected: number;
  pending_route: number;
  outside: number;
  kept: number;
  dismissed: number;
  duplicate: number;
  deferred: number;
  unreviewed: number;
  sample_population: number;
  has_more: boolean;
  items: CalibrationItem[];
};
export const calibrationWindow = (
  since: string,
  until: string,
  source: string | null = null,
  after: string | null = null,
  sample = false,
) =>
  sessionRpc<CalibrationWindow>("calibration_window", {
    p_since: since,
    p_until: until,
    p_source: source,
    p_after: after,
    p_sample: sample,
  });
export const saveTuningExample = (
  candidate: CalibrationItem,
  useful: boolean,
  heldOut: boolean,
) =>
  sessionRpc<TuningExample>("save_tuning_example", {
    p_candidate: candidate.id,
    p_useful: useful,
    p_held_out: heldOut,
    p_expected: candidate.feedback?.version ?? 0,
  });
