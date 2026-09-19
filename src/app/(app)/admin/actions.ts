"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
