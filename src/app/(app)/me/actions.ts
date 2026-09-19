"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { ok: boolean; error: string | null };

type SaveInput = {
  bio: string;
  contact_links: Record<string, string>;
};

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("locked")) {
    return "Your profile is locked. Request an edit before making changes.";
  }
  return "Something went wrong while saving. Please try again.";
}

export async function saveProfile(
  input: SaveInput,
  intent: "save" | "submit",
): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You're signed out. Please sign in again." };

  const cleanLinks: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.contact_links || {})) {
    const v = (value || "").trim();
    if (v) cleanLinks[key] = v;
  }

  const patch: Record<string, unknown> = {
    bio: (input.bio || "").trim(),
    contact_links: cleanLinks,
  };
  if (intent === "submit") patch.status = "locked";

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/me");
  return { ok: true, error: null };
}

export async function requestEdit(): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You're signed out. Please sign in again." };

  // Only the status changes here — required by the profile lock guard.
  const { error } = await supabase
    .from("profiles")
    .update({ status: "edit_requested" })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath("/me");
  return { ok: true, error: null };
}
