"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/notify";

export type AssetState = { error: string | null };

const LECTURER_KINDS = new Set(["trainee_work", "course_material", "certificate", "other"]);

export async function recordAsset(input: {
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Please sign in again." };

  const asset_kind = LECTURER_KINDS.has(input.asset_kind) ? input.asset_kind : "other";
  const isLink = input.source === "link";
  const path = isLink ? `link:${crypto.randomUUID()}` : input.path;
  if (!path) return { error: "Missing file." };
  if (isLink && !input.link_url) return { error: "Enter a link." };

  const { error } = await supabase.from("files").insert({
    owner_id: user.id,
    uploaded_by: user.id,
    path,
    name: input.name || input.title || "Untitled",
    type: isLink ? null : input.type,
    size: isLink ? null : input.size,
    asset_kind,
    program_id: input.program_id || null,
    title: input.title || null,
    description: input.description || null,
    source: input.source,
    link_url: isLink ? input.link_url : null,
  });
  if (error) return { error: "Could not save the asset." };
  await notifyAdmins("file_uploaded", user.id);
  revalidatePath("/me");
  return { error: null };
}
