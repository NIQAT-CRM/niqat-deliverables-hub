"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUser } from "@/lib/notify";

export type AssetState = { error: string | null };

async function staff() {
  const me = await getCurrentUser();
  return me && (me.role === "admin" || me.role === "management") ? me : null;
}

export async function createLecturerAssetUploadUrl(input: {
  lecturerId: string;
  filename: string;
}): Promise<{ path: string | null; token: string | null; error: string | null }> {
  if (!(await staff())) return { path: null, token: null, error: "Not authorized." };
  const safe = input.filename.replace(/[^\w.\-]+/g, "_");
  const path = `${input.lecturerId}/${crypto.randomUUID()}-${safe}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("lecturer-files").createSignedUploadUrl(path);
  if (error || !data) return { path: null, token: null, error: "Could not start the upload." };
  return { path, token: data.token, error: null };
}

export async function recordLecturerAsset(input: {
  lecturerId: string;
  path: string | null;
  name: string;
  type: string | null;
  size: number | null;
  asset_kind: string;
  program_id: string | null;
  title: string;
  description: string;
  source: "file" | "link";
  link_url: string | null;
}): Promise<AssetState> {
  const me = await staff();
  if (!me) return { error: "Not authorized." };

  const admin = createAdminClient();
  const isLink = input.source === "link";
  const path = isLink ? `link:${crypto.randomUUID()}` : input.path;
  if (!path) return { error: "Missing file." };
  if (isLink && !input.link_url) return { error: "Enter a link." };

  const { error } = await admin.from("files").insert({
    owner_id: input.lecturerId,
    uploaded_by: me.id,
    path,
    name: input.name || input.title || "Untitled",
    type: isLink ? null : input.type,
    size: isLink ? null : input.size,
    asset_kind: input.asset_kind,
    program_id: input.program_id || null,
    title: input.title || null,
    description: input.description || null,
    source: input.source,
    link_url: isLink ? input.link_url : null,
  });
  if (error) return { error: "Could not save the asset." };
  if (input.asset_kind === "feedback_proof") {
    await notifyUser(input.lecturerId, "feedback_added", input.lecturerId);
  }
  revalidatePath(`/admin/lecturers/${input.lecturerId}`);
  revalidatePath("/admin/data");
  revalidatePath("/admin/feedback");
  return { error: null };
}

export async function deleteAsset(fileId: string): Promise<AssetState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: "Only admins can delete." };
  const admin = createAdminClient();
  const { data: row } = await admin.from("files").select("path, source, owner_id").eq("id", fileId).maybeSingle();
  if (!row) return { error: "Not found." };
  if (row.source !== "link" && row.path) {
    await admin.storage.from("lecturer-files").remove([row.path]);
  }
  const { error } = await admin.from("files").delete().eq("id", fileId);
  if (error) return { error: "Could not delete." };
  revalidatePath("/admin/data");
  revalidatePath(`/admin/lecturers/${row.owner_id}`);
  return { error: null };
}

export async function setFeatured(fileId: string, value: boolean): Promise<AssetState> {
  if (!(await staff())) return { error: "Not authorized." };
  const admin = createAdminClient();
  const { error } = await admin.from("files").update({ featured: value }).eq("id", fileId);
  if (error) return { error: "Could not update." };
  revalidatePath("/admin/data");
  revalidatePath("/admin");
  return { error: null };
}

export async function createShareLink(
  fileId: string,
  days = 7,
): Promise<{ url: string | null; expires: string | null; error: string | null }> {
  const me = await staff();
  if (!me) return { url: null, expires: null, error: "Not authorized." };
  const admin = createAdminClient();
  const { data: row } = await admin.from("files").select("id, path, source, link_url").eq("id", fileId).maybeSingle();
  if (!row) return { url: null, expires: null, error: "Not found." };

  const seconds = Math.min(30, Math.max(1, days)) * 86400;
  let url: string | null = null;
  if (row.source === "link") {
    url = row.link_url;
  } else {
    const { data, error } = await admin.storage.from("lecturer-files").createSignedUrl(row.path, seconds);
    if (error || !data) return { url: null, expires: null, error: "Could not create link." };
    url = data.signedUrl;
  }
  // log the share in the audit trail
  try {
    await admin.from("audit_log").insert({ actor_id: me.id, action: "share", target_type: "file", target_id: fileId, metadata: { days } });
  } catch { /* non-critical */ }

  const expires = new Date(Date.now() + seconds * 1000).toLocaleDateString();
  return { url, expires, error: null };
}
