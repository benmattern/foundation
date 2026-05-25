import { supabase } from "../lib/supabaseClient";
import type { Tag } from "../types/tag";

export type CreateTagInput = {
  name: string;
  description: string;
};

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return data ?? [];
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