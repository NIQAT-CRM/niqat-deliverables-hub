import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GroupsManager } from "@/components/app/GroupsManager";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: programs }, { data: groups }, { data: lecturers }, { data: lp }] =
    await Promise.all([
      supabase.from("programs").select("id, name, type").order("name"),
      supabase.from("groups").select("id, name, program_id, mutual_access").order("name"),
      supabase.from("users").select("id, full_name, email").eq("role", "lecturer").order("full_name"),
      supabase.from("lecturer_programs").select("program_id, lecturer:lecturer_id(full_name, email)"),
    ]);

  const membersByProgram: Record<string, { program_id: string; name: string }[]> = {};
  for (const row of (lp ?? []) as Record<string, unknown>[]) {
    const pid = row.program_id as string;
    const lec = Array.isArray(row.lecturer) ? row.lecturer[0] : row.lecturer;
    const name = (lec as { full_name?: string; email?: string })?.full_name ||
      (lec as { email?: string })?.email || "—";
    (membersByProgram[pid] ||= []).push({ program_id: pid, name });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Groups</h1>
        <p className="mt-1 text-sm text-muted">
          Programs, groups, and derived membership. Shared access lets group members see each
          other's tagged files.
        </p>
      </div>
      <GroupsManager
        programs={(programs ?? []) as { id: string; name: string; type: string }[]}
        groups={(groups ?? []) as { id: string; name: string; program_id: string | null; mutual_access: boolean }[]}
        lecturers={(lecturers ?? []) as { id: string; full_name: string | null; email: string }[]}
        membersByProgram={membersByProgram}
      />
    </div>
  );
}
