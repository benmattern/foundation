import { queryAll } from "./queryAll";
import { supabase } from "../lib/supabaseClient";
import type { Source } from "../types/source";
import type { CatalogSource } from "../lib/sourceCatalog";
import { activeProjectId } from "./projectService";

export async function enableCatalogFeed(source: CatalogSource) {
  const { error } = await supabase.rpc("enable_catalog_feed", {
    p_project: activeProjectId(),
    p_catalog: source,
  });
  if (error) throw error;
}

export type CreateSourceInput = {
  name: string;
  url: string;
  category: string;
  notes: string;
};

export function getSources(): Promise<Source[]> {
  return queryAll<Source>((from, to) =>
    supabase.from("sources").select("*").order("id").range(from, to)
  );
}

export async function createSource(
  source: CreateSourceInput,
): Promise<Source> {
  const { data, error } = await supabase
    .from("sources")
    .insert({
      name: source.name,
      url: source.url,
      category: source.category || null,
      notes: source.notes || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getSourceById(id: string): Promise<Source> {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export type UpdateSourceInput = {
  name: string;
  url: string;
  category: string;
  notes: string;
};

export async function updateSource(
  id: string,
  source: UpdateSourceInput,
): Promise<Source> {
  const { data, error } = await supabase
    .from("sources")
    .update({
      name: source.name,
      url: source.url,
      category: source.category || null,
      notes: source.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
