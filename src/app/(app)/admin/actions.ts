"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProvisionState = { error: string | null };

export async function provisionLecturerAction(
  _prev: ProvisionState,
  formData: FormData,
): Promise<ProvisionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { error: "Only admins can add lecturers." };
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!fullName || !email) return { error: "Name and email are required." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "lecturer" },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { error: "A user with this email already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function reopenProfile(
  lecturerId: string,
): Promise<{ error: string | null }> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { error: "Only admins can reopen profiles." };
  }
  const supabase = await createClient();
  // Admin sets the profile back to draft (approves an edit request / unlocks).
  // Allowed by RLS (is_admin) and the profile guard (admins bypass).
  const { error } = await supabase
    .from("profiles")
    .update({ status: "draft" })
    .eq("user_id", lecturerId);
  if (error) return { error: "Could not reopen the profile." };
  revalidatePath("/admin");
  return { error: null };
}

export type ImportRow = { full_name: string; email: string; password: string };
export type ImportResult = {
  created: number;
  failures: { email: string; reason: string }[];
  error: string | null;
};

export async function importLecturers(rows: ImportRow[]): Promise<ImportResult> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { created: 0, failures: [], error: "Only admins can import lecturers." };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { created: 0, failures: [], error: "No rows found in the file." };
  }
  if (rows.length > 500) {
    return { created: 0, failures: [], error: "Please import 500 rows or fewer at a time." };
  }

  const admin = createAdminClient();
  let created = 0;
  const failures: { email: string; reason: string }[] = [];

  for (const raw of rows) {
    const full_name = (raw.full_name || "").trim();
    const email = (raw.email || "").trim().toLowerCase();
    const password = (raw.password || "").trim();

    if (!email) {
      failures.push({ email: "(blank)", reason: "Missing email" });
      continue;
    }
    if (!full_name) {
      failures.push({ email, reason: "Missing name" });
      continue;
    }
    if (password.length < 8) {
      failures.push({ email, reason: "Password must be at least 8 characters" });
      continue;
    }

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "lecturer" },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      failures.push({
        email,
        reason:
          msg.includes("already") || msg.includes("registered")
            ? "Already exists"
            : error.message,
      });
      continue;
    }
    created += 1;
  }

  revalidatePath("/admin");
  return { created, failures, error: null };
}
