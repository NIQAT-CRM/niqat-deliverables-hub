import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type LecturerRow = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  profiles: { status: ProfileStatus }[] | { status: ProfileStatus } | null;
};

const STATUS_LABEL: Record<ProfileStatus, string> = {
  draft: "Draft",
  locked: "Locked",
  edit_requested: "Edit requested",
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
  const canAdd = me.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Lecturers</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "lecturer" : "lecturers"}
          </p>
        </div>
        {canAdd && (
          <Link href="/admin/lecturers/new">
            <Button>Add lecturer</Button>
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-white p-10 text-center shadow-card">
          <p className="text-sm text-muted">
            No lecturers yet.{canAdd ? " Add your first one to get started." : ""}
          </p>
          {canAdd && (
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
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = statusOf(row);
                return (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {row.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">
                        {status ? STATUS_LABEL[status] : "—"}
                      </span>
                    </td>
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
