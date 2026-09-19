"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string | null };

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return null;
  return me;
}

export async function createProgram(input: {
  name: string;
  type: "diploma" | "course" | "service";
}): Promise<Result> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const name = input.name.trim();
  if (!name) return { error: "Program name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("programs").insert({ name, type: input.type });
  if (error) return { error: "Could not create the program." };
  revalidatePath("/admin/groups");
  return { error: null };
}

export async function createGroup(input: {
  name: string;
  programId: string | null;
  mutual: boolean;
}): Promise<Result> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const name = input.name.trim();
  if (!name) return { error: "Group name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("groups").insert({
    name,
    program_id: input.programId || null,
    mutual_access: input.mutual,
  });
  if (error) return { error: "Could not create the group." };
  revalidatePath("/admin/groups");
  return { error: null };
}

export async function setMutualAccess(groupId: string, value: boolean): Promise<Result> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ mutual_access: value })
    .eq("id", groupId);
  if (error) return { error: "Could not update the group." };
  revalidatePath("/admin/groups");
  return { error: null };
}

export async function assignLecturer(input: {
  lecturerId: string;
  programId: string;
}): Promise<Result> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  if (!input.lecturerId || !input.programId) return { error: "Choose a lecturer and a program." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("lecturer_programs")
    .insert({ lecturer_id: input.lecturerId, program_id: input.programId });
  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { error: "That lecturer is already in this program." };
    }
    return { error: "Could not assign the lecturer." };
  }
  revalidatePath("/admin/groups");
  return { error: null };
}
