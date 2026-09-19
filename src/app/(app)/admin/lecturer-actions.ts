"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

export async function addGrant(input: {
  userId: string;
  lecturerId: string;
  can_view: boolean;
  can_download: boolean;
  can_delete: boolean;
  can_export: boolean;
}): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: "Only admins can manage grants." };
  if (!input.userId) return { error: "Choose a team member." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("grants")
    .select("id")
    .eq("user_id", input.userId)
    .eq("scope_type", "lecturer")
    .eq("scope_id", input.lecturerId)
    .maybeSingle();

  const payload = {
    can_view: input.can_view,
    can_download: input.can_download,
    can_delete: input.can_delete,
    can_export: input.can_export,
  };

  const { error } = existing
    ? await supabase.from("grants").update(payload).eq("id", existing.id)
    : await supabase.from("grants").insert({
        user_id: input.userId,
        scope_type: "lecturer",
        scope_id: input.lecturerId,
        ...payload,
      });

  if (error) return { error: "Could not save the grant." };
  revalidatePath(`/admin/lecturers/${input.lecturerId}`);
  return { error: null };
}

export async function removeGrant(grantId: string, lecturerId: string): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: "Only admins can manage grants." };
  const supabase = await createClient();
  const { error } = await supabase.from("grants").delete().eq("id", grantId);
  if (error) return { error: "Could not remove the grant." };
  revalidatePath(`/admin/lecturers/${lecturerId}`);
  return { error: null };
}

export async function addFeedback(input: {
  lecturerId: string;
  content: string;
}): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) return { error: "You're signed out." };
  const content = input.content.trim();
  if (!content) return { error: "Write some feedback first." };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "You don't have permission to manage feedback." };
  const { error } = await supabase.from("feedback").insert({
    lecturer_id: input.lecturerId,
    kind: "text",
    content,
    is_master: false,
    created_by: me.id,
  });
  if (error) return { error: "Could not save the feedback." };
  revalidatePath(`/admin/lecturers/${input.lecturerId}`);
  return { error: null };
}

export async function deleteFeedback(
  feedbackId: string,
  lecturerId: string,
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) return { error: "Not authorized." };
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "Not authorized." };
  const { error } = await supabase.from("feedback").delete().eq("id", feedbackId);
  if (error) return { error: "Could not delete the feedback." };
  revalidatePath(`/admin/lecturers/${lecturerId}`);
  return { error: null };
}
