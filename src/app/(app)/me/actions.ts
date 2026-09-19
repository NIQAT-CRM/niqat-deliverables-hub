"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/notify";

export type SaveState = { ok: boolean; error: string | null };

export type ExperienceEntry = {
  title: string;
  organization: string;
  period: string;
  description: string;
};

export type CertificateEntry = {
  name: string;
  issuer: string;
  year: string;
};

type SaveInput = {
  bio: string;
  contact_links: Record<string, string>;
  experience: ExperienceEntry[];
  certificates: CertificateEntry[];
};

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("locked")) {
    return "Your profile is locked. Request an edit before making changes.";
  }
  return "Something went wrong while saving. Please try again.";
}

function cleanText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
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
    const v = cleanText(value);
    if (v) cleanLinks[key] = v;
  }

  const experience = (input.experience || [])
    .map((e) => ({
      title: cleanText(e.title),
      organization: cleanText(e.organization),
      period: cleanText(e.period),
      description: cleanText(e.description),
    }))
    .filter((e) => e.title || e.organization || e.period || e.description);

  const certificates = (input.certificates || [])
    .map((c) => ({
      name: cleanText(c.name),
      issuer: cleanText(c.issuer),
      year: cleanText(c.year),
    }))
    .filter((c) => c.name || c.issuer || c.year);

  const patch: Record<string, unknown> = {
    bio: cleanText(input.bio),
    contact_links: cleanLinks,
    experience,
    certificates,
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

  const { error } = await supabase
    .from("profiles")
    .update({ status: "edit_requested" })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: friendly(error.message) };

  await notifyAdmins("edit_requested", user.id);
  revalidatePath("/me");
  return { ok: true, error: null };
}
