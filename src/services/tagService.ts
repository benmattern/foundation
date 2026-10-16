import { queryAll } from "./queryAll";
import { supabase } from "../lib/supabaseClient";
import type { Tag } from "../types/tag";

export type CreateTagInput = {
  name: string;
  description: string;
};

export function getTags(): Promise<Tag[]> {
  return queryAll<Tag>((from, to) =>
    supabase.from("tags").select("*").order("id").range(from, to)
  );
}

export async function createTag(tag: CreateTagInput): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      name: tag.name,
      description: tag.description || null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) throw error;
}
