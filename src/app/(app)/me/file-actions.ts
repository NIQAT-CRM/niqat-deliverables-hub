"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/notify";
import { FILE_CATEGORIES } from "@/lib/files";

const BUCKET = "lecturer-files";

export type FileActionState = { error: string | null };

const VALID = new Set<string>(FILE_CATEGORIES.map((c) => c.value));

export async function recordFile(input: {
  path: string;
  name: string;
  type: string;
  size: number;
  category: string;
  groupId?: string | null;
}): Promise<FileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Please sign in again." };

  const category = VALID.has(input.category) ? input.category : "other";

  const { error } = await supabase.from("files").insert({
    owner_id: user.id,
    path: input.path,
    name: input.name,
    type: input.type || null,
    size: Number.isFinite(input.size) ? input.size : null,
    uploaded_by: user.id,
    category,
    group_id: input.groupId || null,
  });

  if (error) return { error: "Could not save the file record." };
  await notifyAdmins("file_uploaded", user.id);
  revalidatePath("/me");
  return { error: null };
}

export async function createDownloadUrl(
  fileId: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row } = await supabase
    .from("files")
    .select("path, name, owner_id")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return { url: null, error: "File not found." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.path, 60, { download: row.name });
  if (error || !data) return { url: null, error: "Could not create a download link." };

  // Staff (non-owner) download: write an audit entry via log_download + record last-download.
  if (user && user.id !== row.owner_id) {
    try {
      await supabase.rpc("log_download", { p_file_id: fileId });
    } catch {
      /* audit logging is non-critical to the download itself */
    }
    try {
      const admin = createAdminClient();
      await admin
        .from("files")
        .update({ last_downloaded_at: new Date().toISOString(), last_downloaded_by: user.id })
        .eq("id", fileId);
    } catch {
      /* tracking is non-critical */
    }
  }

  return { url: data.signedUrl, error: null };
}

export async function deleteFile(fileId: string): Promise<FileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Please sign in again." };

  const { data: row } = await supabase
    .from("files")
    .select("id, path")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return { error: "File not found." };

  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([row.path]);
  if (storageErr) return { error: "Could not delete the file. Please try again." };

  const { error: rowErr } = await supabase.from("files").delete().eq("id", row.id);
  if (rowErr) return { error: "The file was removed but its record could not be cleared." };

  revalidatePath("/me");
  return { error: null };
}


export async function requestFileDeletion(fileId: string): Promise<FileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Please sign in again." };
  const { data: row } = await supabase.from("files").select("id, owner_id").eq("id", fileId).maybeSingle();
  if (!row || row.owner_id !== user.id) return { error: "File not found." };
  // Append-only: record a request for admin review — no deletion happens here.
  await supabase.from("deletion_requests").insert({ file_id: fileId, requested_by: user.id, status: "pending" });
  await notifyAdmins("file_deletion_requested", user.id);
  return { error: null };
}
