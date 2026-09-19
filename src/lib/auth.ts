import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaff, type UserRole } from "@/lib/types";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: data?.email ?? user.email ?? "",
    fullName: data?.full_name ?? null,
    role: (data?.role ?? "lecturer") as UserRole,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Where each role lands after login. */
export function roleHome(role: UserRole): string {
  return isStaff(role) ? "/admin" : "/me";
}
