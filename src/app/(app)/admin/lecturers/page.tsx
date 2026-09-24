import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { ReopenButton } from "@/components/app/ReopenButton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProfileEmbed = { status: ProfileStatus; avatar_url: string | null; rating: number | null };
type Row = {
  id: string;
  full_name: string | null;
  email: string;
  profiles: ProfileEmbed[] | ProfileEmbed | null;
};

function embed(row: Row): ProfileEmbed | null {
  const p = row.profiles;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default async function AdminLecturers() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const supabase = await createClient();

  const [{ data }, { data: lp }, { data: fileOwners }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, profiles(status, avatar_url, rating)")
      .eq("role", "lecturer")
      .order("created_at", { ascending: false }),
    supabase.from("lecturer_programs").select("lecturer_id, program:program_id(name)"),
    supabase.from("files").select("owner_id"),
  ]);

  const rows = (data ?? []) as unknown as Row[];

  const programsByLecturer: Record<string, string[]> = {};
  for (const r of (lp ?? []) as Record<string, unknown>[]) {
    const lid = r.lecturer_id as string;
    const prog = Array.isArray(r.program) ? r.program[0] : r.program;
    const name = (prog as { name?: string })?.name;
    if (name) (programsByLecturer[lid] ||= []).push(name);
  }

  const fileCount: Record<string, number> = {};
  for (const f of (fileOwners ?? []) as { owner_id: string }[]) {
    fileCount[f.owner_id] = (fileCount[f.owner_id] ?? 0) + 1;
  }

  const avatarByLecturer: Record<string, string> = {};
  await Promise.all(
    rows.map(async (r) => {
      const path = embed(r)?.avatar_url;
      if (!path) return;
      const { data: signed } = await supabase.storage.from("lecturer-files").createSignedUrl(path, 3600);
      if (signed?.signedUrl) avatarByLecturer[r.id] = signed.signedUrl;
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Instructors</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "instructor" : "instructors"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link href="/admin/lecturers/import">
              <Button variant="secondary">Import CSV</Button>
            </Link>
            <Link href="/admin/lecturers/new">
              <Button>Add instructor</Button>
            </Link>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No instructors yet"
          description={isAdmin ? "Add your first instructor to get started." : undefined}
        >
          {isAdmin && (
            <Link href="/admin/lecturers/new">
              <Button>Add instructor</Button>
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const p = embed(r);
            const status = p?.status ?? null;
            const name = r.full_name || r.email;
            const avatar = avatarByLecturer[r.id];
            const teaching = programsByLecturer[r.id] ?? [];
            const files = fileCount[r.id] ?? 0;
            const canReopen = isAdmin && (status === "locked" || status === "edit_requested");
            return (
              <div
                key={r.id}
                className="flex flex-col rounded-card border border-line bg-card p-5 shadow-card transition-all hover:border-niqat/40 hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-niqat-soft text-lg font-bold text-niqat ring-2 ring-white">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(name)
                    )}
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="mt-3">
                  <Link href={`/admin/lecturers/${r.id}`} className="text-base font-bold text-ink hover:text-niqat">
                    {name}
                  </Link>
                  <p className="truncate text-sm text-muted">{r.email}</p>
                  <div className="mt-1.5">
                    <RatingStars value={p?.rating ?? 0} />
                  </div>
                </div>

                <div className="mt-3 min-h-[26px]">
                  {teaching.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {teaching.map((t, i) => (
                        <span key={i} className="rounded-full bg-niqat-soft px-2 py-0.5 text-xs font-medium text-niqat">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-faint">Not assigned to a program</span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line2 pt-3">
                  <span className="text-xs text-muted">{files} {files === 1 ? "file" : "files"}</span>
                  <div className="flex items-center gap-3">
                    {canReopen && <ReopenButton lecturerId={r.id} />}
                    <Link href={`/admin/lecturers/${r.id}`} className="text-sm font-semibold text-niqat hover:text-niqat-hover">
                      View profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
