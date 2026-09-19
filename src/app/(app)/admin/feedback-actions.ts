"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string | null };

export async function addMasterFeedback(content: string): Promise<Result> {
  const me = await getCurrentUser();
  if (!me) return { error: "You're signed out." };
  const text = content.trim();
  if (!text) return { error: "Write some feedback first." };
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "You don't have permission to manage feedback." };
  const { error } = await supabase.from("feedback").insert({
    lecturer_id: null,
    kind: "text",
    content: text,
    is_master: true,
    created_by: me.id,
  });
  if (error) return { error: "Could not save the feedback." };
  revalidatePath("/admin/feedback");
  return { error: null };
}

export async function deleteMasterFeedback(id: string): Promise<Result> {
  const me = await getCurrentUser();
  if (!me) return { error: "Not authorized." };
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "Not authorized." };
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { error: "Could not delete the feedback." };
  revalidatePath("/admin/feedback");
  return { error: null };
}
