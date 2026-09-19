"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/notify";

const BUCKET = "lecturer-files";

export type FileActionState = { error: string | null };

export async function recordFile(input: {
  path: string;
  name: string;
  type: string;
  size: number;
}): Promise<FileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Please sign in again." };

  const { error } = await supabase.from("files").insert({
    owner_id: user.id,
    path: input.path,
    name: input.name,
    type: input.type || null,
    size: Number.isFinite(input.size) ? input.size : null,
    uploaded_by: user.id,
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
  const { data: row } = await supabase
    .from("files")
    .select("path, name")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return { url: null, error: "File not found." };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.path, 60, { download: row.name });
  if (error || !data) return { url: null, error: "Could not create a download link." };
  return { url: data.signedUrl, error: null };
}

export async function deleteFile(fileId: string): Promise<FileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Please sign in again." };

  // Fetch the row first (RLS ensures the caller is allowed to see it).
  const { data: row } = await supabase
    .from("files")
    .select("id, path")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) return { error: "File not found." };

  // Remove the Storage object FIRST so we never leave an undeleted file behind.
  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([row.path]);
  if (storageErr) return { error: "Could not delete the file. Please try again." };

  // Then remove the database record (same logical operation).
  const { error: rowErr } = await supabase.from("files").delete().eq("id", row.id);
  if (rowErr) return { error: "The file was removed but its record could not be cleared." };

  revalidatePath("/me");
  return { error: null };
}
