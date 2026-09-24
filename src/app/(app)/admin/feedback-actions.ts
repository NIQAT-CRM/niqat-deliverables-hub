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

export async function addMasterFeedbackFile(input: {
  path: string;
  name: string;
  type: string;
}): Promise<Result> {
  const me = await getCurrentUser();
  if (!me) return { error: "You're signed out." };
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "You don't have permission to manage feedback." };
  const kind = input.type.startsWith("image/") ? "image" : "file";
  const { error } = await supabase.from("feedback").insert({
    lecturer_id: null,
    kind,
    content: input.name,
    file_path: input.path,
    is_master: true,
    created_by: me.id,
  });
  if (error) return { error: "Could not save the file." };
  revalidatePath("/admin/feedback");
  return { error: null };
}

export async function deleteMasterFeedback(id: string): Promise<Result> {
  const me = await getCurrentUser();
  if (!me) return { error: "Not authorized." };
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "Not authorized." };
  const { data: row } = await supabase.from("feedback").select("file_path").eq("id", id).maybeSingle();
  if (row?.file_path) {
    await supabase.storage.from("feedback").remove([row.file_path]);
  }
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { error: "Could not delete the feedback." };
  revalidatePath("/admin/feedback");
  return { error: null };
}
