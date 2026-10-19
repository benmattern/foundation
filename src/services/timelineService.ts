import { supabase } from "../lib/supabaseClient";
import { activeProjectId } from "./projectService";
import type {
  ReferenceKind,
  TimelineDetail,
  TimelineEvent,
  TimelineFilters,
  TimelineOption,
  TimelinePage,
  TimelineValues,
} from "../types/timeline";
async function rpc<T>(
  name: string,
  values: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.rpc(name, {
    p_project: activeProjectId(),
    ...values,
  });
  if (error) throw new Error(error.message);
  return data as T;
}
export const getTimelinePage = (filters: TimelineFilters, offset = 0) =>
  rpc<TimelinePage>("timeline_page", { p_filters: filters, p_offset: offset });
export const getTimelineEvent = (id: string) =>
  rpc<TimelineDetail>("timeline_event", { p_id: id });
export const getTimelineOptions = (
  kind: ReferenceKind | "source",
  search: string,
  offset = 0,
) =>
  rpc<{ items: TimelineOption[]; has_more: boolean }>("timeline_options", {
    p_kind: kind,
    p_search: search,
    p_offset: offset,
  });
export const saveTimelineEvent = (
  values: TimelineValues,
  request: string,
  existing?: TimelineDetail,
) =>
  rpc<TimelineEvent>("save_event", {
    p_id: existing?.id ?? null,
    p_values: {
      ...values,
      references: values.references.map(
        ({ kind, target_id, disposition, note }) => ({
          kind,
          target_id,
          disposition,
          note,
        }),
      ),
      version: existing?.version ?? 0,
      request_id: request,
    },
  });
export const removeTimelineEvent = (event: TimelineDetail, request: string) =>
  rpc<void>("remove_timeline_event", {
    p_id: event.id,
    p_expected: event.version,
    p_request: request,
  });
