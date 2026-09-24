"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { error: string | null };

export async function approveDeletion(requestId: string): Promise<Result> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: "Admins only." };
  const admin = createAdminClient();
  const { data: req } = await admin.from("deletion_requests").select("id, file_id").eq("id", requestId).maybeSingle();
  if (!req) return { error: "Request not found." };
  // real delete: storage object (if any) + file row
  const { data: file } = await admin.from("files").select("path, source").eq("id", req.file_id).maybeSingle();
  if (file && file.source !== "link" && file.path) {
    await admin.storage.from("lecturer-files").remove([file.path]);
  }
  await admin.from("files").delete().eq("id", req.file_id);
  await admin.from("deletion_requests").update({ status: "approved", resolved_by: me.id, resolved_at: new Date().toISOString() }).eq("id", requestId);
  revalidatePath("/admin/deletion-requests");
  revalidatePath("/admin/data");
  return { error: null };
}

export async function rejectDeletion(requestId: string): Promise<Result> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: "Admins only." };
  const admin = createAdminClient();
  const { error } = await admin.from("deletion_requests").update({ status: "rejected", resolved_by: me.id, resolved_at: new Date().toISOString() }).eq("id", requestId);
  if (error) return { error: "Could not update." };
  revalidatePath("/admin/deletion-requests");
  return { error: null };
}
