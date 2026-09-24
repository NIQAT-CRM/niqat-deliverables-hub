"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function addFeedbackFile(input: {
  lecturerId: string;
  path: string;
  name: string;
  type: string;
}): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) return { error: "You're signed out." };
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_team_capability", { p_cap: "manage_feedback" });
  if (!allowed) return { error: "You don't have permission to manage feedback." };
  const kind = input.type.startsWith("image/") ? "image" : "file";
  const { error } = await supabase.from("feedback").insert({
    lecturer_id: input.lecturerId,
    kind,
    content: input.name,
    file_path: input.path,
    is_master: false,
    created_by: me.id,
  });
  if (error) return { error: "Could not save the file feedback." };
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
  const { data: row } = await supabase.from("feedback").select("file_path").eq("id", feedbackId).maybeSingle();
  if (row?.file_path) {
    await supabase.storage.from("feedback").remove([row.file_path]);
  }
  const { error } = await supabase.from("feedback").delete().eq("id", feedbackId);
  if (error) return { error: "Could not delete the feedback." };
  revalidatePath(`/admin/lecturers/${lecturerId}`);
  return { error: null };
}

export async function setRating(input: {
  lecturerId: string;
  rating: number;
  note: string;
}): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "management")) {
    return { error: "Only admins and management can rate lecturers." };
  }
  const rating = Math.max(0, Math.min(3, Math.round(input.rating || 0)));
  const supabase = await createClient();
  // Only rating fields are sent — the profile guard permits management to change these only.
  const { error } = await supabase
    .from("profiles")
    .update({ rating, rating_note: input.note.trim() || null })
    .eq("user_id", input.lecturerId);
  if (error) return { error: "Could not save the rating." };
  revalidatePath(`/admin/lecturers/${input.lecturerId}`);
  revalidatePath("/admin/lecturers");
  return { error: null };
}



export async function archiveInstructor(lecturerId: string): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "management")) {
    return { error: "Only admins and management can archive instructors." };
  }
  const supabase = await createClient();
  // Archive only — NO data is deleted. RLS allows admin/management to update the row.
  const { error } = await supabase
    .from("users")
    .update({ archived_at: new Date().toISOString(), archived_by: me.id })
    .eq("id", lecturerId);
  if (error) return { error: "Could not archive the instructor." };
  revalidatePath("/admin/lecturers");
  revalidatePath(`/admin/lecturers/${lecturerId}`);
  return { error: null };
}

export async function restoreInstructor(lecturerId: string): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "management")) {
    return { error: "Only admins and management can restore instructors." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ archived_at: null, archived_by: null })
    .eq("id", lecturerId);
  if (error) return { error: "Could not restore the instructor." };
  revalidatePath("/admin/lecturers");
  revalidatePath(`/admin/lecturers/${lecturerId}`);
  return { error: null };
}
