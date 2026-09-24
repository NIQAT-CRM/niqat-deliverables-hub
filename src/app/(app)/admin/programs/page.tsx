import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProgramsManager } from "@/components/app/ProgramsManager";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const me = await requireUser();
  const supabase = await createClient();

  const [{ data: programs }, { data: lecturers }, { data: lp }] = await Promise.all([
    supabase.from("programs").select("id, name, type").order("name"),
    supabase.from("users").select("id, full_name, email").eq("role", "lecturer").is("archived_at", null).order("full_name"),
    supabase.from("lecturer_programs").select("program_id, lecturer:lecturer_id(id, full_name, email)"),
  ]);

  const membersByProgram: Record<string, { id: string; name: string }[]> = {};
  for (const row of (lp ?? []) as Record<string, unknown>[]) {
    const pid = row.program_id as string;
    const lec = Array.isArray(row.lecturer) ? row.lecturer[0] : row.lecturer;
    const l = lec as { id?: string; full_name?: string; email?: string };
    if (l?.id) (membersByProgram[pid] ||= []).push({ id: l.id, name: l.full_name || l.email || "—" });
  }

  const programRows = ((programs ?? []) as { id: string; name: string; type: string }[]).map((p) => ({
    ...p,
    members: membersByProgram[p.id] ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Programs</h1>
        <p className="mt-1 text-sm text-muted">Diplomas, courses, and services — and which instructors deliver them.</p>
      </div>
      <ProgramsManager
        programs={programRows}
        lecturers={(lecturers ?? []) as { id: string; full_name: string | null; email: string }[]}
        canManage={me.role === "admin"}
      />
    </div>
  );
}
