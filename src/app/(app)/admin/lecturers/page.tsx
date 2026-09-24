import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InstructorGrid, type InstructorCard } from "@/components/app/InstructorGrid";
import { profileCompletion } from "@/lib/completion";
import { resolveAvatar } from "@/lib/avatar";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProfileEmbed = {
  status: ProfileStatus; avatar_url: string | null; rating: number | null;
  bio: string | null; contact_links: Record<string, string> | null; experience: unknown; certificates: unknown;
};
type Row = { id: string; full_name: string | null; email: string; archived_at: string | null; profiles: ProfileEmbed[] | ProfileEmbed | null };

function embed(row: Row): ProfileEmbed | null { const p = row.profiles; if (!p) return null; return Array.isArray(p) ? p[0] ?? null : p; }

export default async function AdminLecturers({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const showArchived = view === "archived";
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const supabase = await createClient();

  const [{ data }, { data: lp }, { data: fileOwners }, { data: progs }] = await Promise.all([
    supabase.from("users").select("id, full_name, email, archived_at, profiles(status, avatar_url, rating, bio, contact_links, experience, certificates)").eq("role", "lecturer").order("created_at", { ascending: false }),
    supabase.from("lecturer_programs").select("lecturer_id, program:program_id(name)"),
    supabase.from("files").select("owner_id"),
    supabase.from("programs").select("id, name").order("name"),
  ]);

  const allRows = (data ?? []) as unknown as Row[];
  const rows = allRows.filter((r) => (showArchived ? r.archived_at : !r.archived_at));

  const programsByLecturer: Record<string, string[]> = {};
  for (const r of (lp ?? []) as Record<string, unknown>[]) {
    const lid = r.lecturer_id as string;
    const prog = Array.isArray(r.program) ? r.program[0] : r.program;
    const name = (prog as { name?: string })?.name;
    if (name) (programsByLecturer[lid] ||= []).push(name);
  }
  const fileCount: Record<string, number> = {};
  for (const f of (fileOwners ?? []) as { owner_id: string }[]) fileCount[f.owner_id] = (fileCount[f.owner_id] ?? 0) + 1;

  const avatarById: Record<string, string> = {};
  await Promise.all(rows.map(async (r) => {
    const resolved = await resolveAvatar(supabase, embed(r)?.avatar_url ?? null);
    if (resolved) avatarById[r.id] = resolved;
  }));

  const cards: InstructorCard[] = rows.map((r) => {
    const p = embed(r);
    const teaching = programsByLecturer[r.id] ?? [];
    return {
      id: r.id, name: r.full_name || r.email, email: r.email,
      status: p?.status ?? null, rating: p?.rating ?? 0, avatar: avatarById[r.id] ?? null,
      teaching, files: fileCount[r.id] ?? 0, archived: !!r.archived_at,
      completion: profileCompletion({ bio: p?.bio, contact_links: p?.contact_links, experience: p?.experience, certificates: p?.certificates, avatar_url: p?.avatar_url }, teaching.length > 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Instructors</h1>
          <p className="mt-1 text-sm text-muted">{cards.length} {cards.length === 1 ? "instructor" : "instructors"}</p>
        </div>
        {isAdmin && !showArchived && (
          <div className="flex items-center gap-2">
            <Link href="/admin/lecturers/import"><Button variant="secondary">Import CSV</Button></Link>
            <Link href="/admin/lecturers/new"><Button>Add instructor</Button></Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Link href="/admin/lecturers" className={`rounded-control px-3 py-1.5 text-sm font-medium ${!showArchived ? "bg-niqat-soft text-niqat" : "text-muted hover:text-ink"}`}>Active</Link>
        <Link href="/admin/lecturers?view=archived" className={`rounded-control px-3 py-1.5 text-sm font-medium ${showArchived ? "bg-niqat-soft text-niqat" : "text-muted hover:text-ink"}`}>Archived</Link>
      </div>

      {cards.length === 0 ? (
        <EmptyState title={showArchived ? "No archived instructors" : "No instructors yet"} description={!showArchived && isAdmin ? "Add your first instructor to get started." : undefined}>
          {!showArchived && isAdmin && <Link href="/admin/lecturers/new"><Button>Add instructor</Button></Link>}
        </EmptyState>
      ) : (
        <InstructorGrid cards={cards} programs={(progs ?? []) as { id: string; name: string }[]} isAdmin={isAdmin} showArchived={showArchived} />
      )}
    </div>
  );
}
