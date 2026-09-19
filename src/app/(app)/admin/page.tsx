import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { ReopenButton } from "@/components/app/ReopenButton";
import type { ProfileStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
          <h1 className="text-xl font-bold text-ink">Lecturers</h1>
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
        <div className="rounded-card border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-muted">
            No lecturers yet.{isAdmin ? " Add your first one to get started." : ""}
          </p>
          {isAdmin && (
            <Link href="/admin/lecturers/new" className="mt-4 inline-block">
              <Button>Add lecturer</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Profile</th>
                {isAdmin && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = statusOf(row);
                const canReopen =
                  isAdmin && (status === "locked" || status === "edit_requested");
                return (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {row.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {canReopen ? <ReopenButton lecturerId={row.id} /> : null}
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
