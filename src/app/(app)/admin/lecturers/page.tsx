import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReopenButton } from "@/components/app/ReopenButton";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type LecturerRow = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  profiles: { status: ProfileStatus }[] | { status: ProfileStatus } | null;
};

function statusOf(row: LecturerRow): ProfileStatus | null {
  const p = row.profiles;
  if (!p) return null;
  return Array.isArray(p) ? p[0]?.status ?? null : p.status;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminLecturers() {
  const me = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email, created_at, profiles(status)")
    .eq("role", "lecturer")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as LecturerRow[];
  const isAdmin = me.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Lecturers</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "lecturer" : "lecturers"}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link href="/admin/lecturers/import">
              <Button variant="secondary">Import CSV</Button>
            </Link>
            <Link href="/admin/lecturers/new">
              <Button>Add lecturer</Button>
            </Link>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-10 text-center shadow-card">
          <p className="text-sm text-muted">
            No lecturers yet.{isAdmin ? " Add your first one to get started." : ""}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr className="text-[11px] uppercase tracking-wide text-faint">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Profile</th>
                {isAdmin && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = statusOf(row);
                const canReopen =
                  isAdmin && (status === "locked" || status === "edit_requested");
                return (
                  <tr key={row.id} className="border-b border-line2 last:border-0 hover:bg-ground/50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/lecturers/${row.id}`} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-niqat-soft text-xs font-bold text-niqat">
                          {initials(row.full_name || row.email)}
                        </span>
                        <span className="font-semibold text-ink hover:text-niqat">
                          {row.full_name || "—"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{row.email}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={status} />
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-4">
                          {canReopen && <ReopenButton lecturerId={row.id} />}
                          <Link
                            href={`/admin/lecturers/${row.id}`}
                            className="text-sm font-medium text-niqat hover:text-niqat-hover"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
