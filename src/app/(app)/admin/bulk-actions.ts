"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { error: string | null };

export async function bulkArchive(ids: string[]): Promise<Result> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "management")) return { error: "Not authorized." };
  if (ids.length === 0) return { error: "No instructors selected." };
  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ archived_at: new Date().toISOString(), archived_by: me.id }).in("id", ids);
  if (error) return { error: "Could not archive." };
  revalidatePath("/admin/lecturers");
  return { error: null };
}

export async function bulkAssignProgram(ids: string[], programId: string): Promise<Result> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { error: "Admins only." };
  if (ids.length === 0 || !programId) return { error: "Choose instructors and a program." };
  const supabase = await createClient();
  const rows = ids.map((id) => ({ lecturer_id: id, program_id: programId }));
  const { error } = await supabase.from("lecturer_programs").upsert(rows, { onConflict: "lecturer_id,program_id", ignoreDuplicates: true });
  if (error) return { error: "Could not assign." };
  revalidatePath("/admin/lecturers");
  revalidatePath("/admin/programs");
  return { error: null };
}
