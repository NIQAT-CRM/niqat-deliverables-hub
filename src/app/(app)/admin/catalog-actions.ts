"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string | null };

async function requireAdmin() {
  const me = await getCurrentUser();
  return me && me.role === "admin" ? me : null;
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
  revalidatePath("/admin/programs");
  return { error: null };
}

export async function assignLecturer(input: {
  lecturerId: string;
  programId: string;
}): Promise<Result> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  if (!input.lecturerId || !input.programId) return { error: "Choose an instructor and a program." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("lecturer_programs")
    .insert({ lecturer_id: input.lecturerId, program_id: input.programId });
  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { error: "Already assigned to this program." };
    }
    return { error: "Could not assign the instructor." };
  }
  revalidatePath("/admin/programs");
  return { error: null };
}

export async function unassignLecturer(input: {
  lecturerId: string;
  programId: string;
}): Promise<Result> {
  if (!(await requireAdmin())) return { error: "Admins only." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("lecturer_programs")
    .delete()
    .eq("lecturer_id", input.lecturerId)
    .eq("program_id", input.programId);
  if (error) return { error: "Could not update the assignment." };
  revalidatePath("/admin/programs");
  return { error: null };
}
