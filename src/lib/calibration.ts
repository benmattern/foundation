import {
  classifyItem,
  inheritRules,
  type Rules,
} from "../../supabase/functions/_shared/rules";
import { candidateEvidence } from "./candidateRules";
import type { CalibrationItem } from "../services/coverageService";
export function previewCalibration(
  items: CalibrationItem[],
  draft: Rules,
  at: string,
) {
  return items.map((c) => {
    if (c.feedback?.held_out)
      return {
        id: c.id,
        title: c.title,
        held_out: true,
        route: null,
        lost: false,
      };
    const r = classifyItem(
      candidateEvidence(c),
      inheritRules(draft, c.current_subscription_rules ?? {}),
      at,
    );
    return {
      id: c.id,
      title: c.title,
      held_out: false,
      route: r.route,
      lost: !!c.feedback?.useful && r.route === "outside_scope",
    };
  });
}
