import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveAvatar(supabase: SupabaseClient, value: string | null): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http")) return value; // public bucket URL — no signing (fast)
  const { data } = await supabase.storage.from("lecturer-files").createSignedUrl(value, 3600);
  return data?.signedUrl ?? null;
}
