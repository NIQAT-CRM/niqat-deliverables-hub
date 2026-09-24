"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null };

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Incorrect email or password." };
  }

  // Block archived accounts.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: row } = await supabase.from("users").select("archived_at").eq("id", user.id).maybeSingle();
    if (row?.archived_at) {
      await supabase.auth.signOut();
      return { error: "This account is no longer active. Contact an admin." };
    }
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
