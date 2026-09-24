"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string | null };

async function staff() {
  const me = await getCurrentUser();
  return me && (me.role === "admin" || me.role === "management" || me.role === "marketing") ? me : null;
}

export async function createCollection(input: { name: string; description: string }): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Not authorized." };
  const name = input.name.trim();
  if (!name) return { error: "Collection name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("collections").insert({ name, description: input.description.trim() || null, created_by: me.id });
  if (error) return { error: "Could not create the collection." };
  revalidatePath("/admin/collections");
  return { error: null };
}

export async function deleteCollection(id: string): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { error: "Could not delete the collection." };
  revalidatePath("/admin/collections");
  return { error: null };
}

export async function addAssetsToCollection(collectionId: string, fileIds: string[]): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Not authorized." };
  if (!collectionId || fileIds.length === 0) return { error: "Choose a collection and assets." };
  const supabase = await createClient();
  const rows = fileIds.map((fid) => ({ collection_id: collectionId, file_id: fid }));
  const { error } = await supabase.from("collection_items").upsert(rows, { onConflict: "collection_id,file_id", ignoreDuplicates: true });
  if (error) return { error: "Could not add to the collection." };
  revalidatePath(`/admin/collections/${collectionId}`);
  return { error: null };
}

export async function removeFromCollection(collectionId: string, fileId: string): Promise<Result> {
  const me = await staff();
  if (!me) return { error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("collection_items").delete().eq("collection_id", collectionId).eq("file_id", fileId);
  if (error) return { error: "Could not remove from the collection." };
  revalidatePath(`/admin/collections/${collectionId}`);
  return { error: null };
}
