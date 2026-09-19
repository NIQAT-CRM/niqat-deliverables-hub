"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TEAM_CAPABILITIES } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

type Result = { error: string | null };

async function admin() {
  const me = await getCurrentUser();
  return me && me.role === "admin" ? me : null;
}

const CAP_KEYS = new Set<string>(TEAM_CAPABILITIES.map((c) => c.key));

export async function createTeam(name: string): Promise<Result> {
  if (!(await admin())) return { error: "Admins only." };
  const n = name.trim();
  if (!n) return { error: "Team name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({ name: n });
  if (error) return { error: "Could not create the team." };
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function deleteTeam(teamId: string): Promise<Result> {
  if (!(await admin())) return { error: "Admins only." };
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return { error: "Could not delete the team." };
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function setTeamCapability(
  teamId: string,
  cap: string,
  value: boolean,
): Promise<Result> {
  if (!(await admin())) return { error: "Admins only." };
  if (!CAP_KEYS.has(cap)) return { error: "Unknown capability." };
  const supabase = await createClient();
  const { error } = await supabase.from("teams").update({ [cap]: value }).eq("id", teamId);
  if (error) return { error: "Could not update the capability." };
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function addTeamMember(teamId: string, userId: string): Promise<Result> {
  if (!(await admin())) return { error: "Admins only." };
  if (!userId) return { error: "Choose a team member." };
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: userId });
  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) return { error: "Already in this team." };
    return { error: "Could not add the member." };
  }
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function removeTeamMember(teamId: string, userId: string): Promise<Result> {
  if (!(await admin())) return { error: "Admins only." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);
  if (error) return { error: "Could not remove the member." };
  revalidatePath("/admin/settings");
  return { error: null };
}

export async function setUserRole(userId: string, role: UserRole): Promise<Result> {
  const me = await admin();
  if (!me) return { error: "Admins only." };
  if (userId === me.id) return { error: "You can't change your own role." };
  const valid: UserRole[] = ["admin", "management", "marketing", "lecturer"];
  if (!valid.includes(role)) return { error: "Invalid role." };
  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);
  if (error) return { error: "Could not update the role." };
  revalidatePath("/admin/settings");
  return { error: null };
}
