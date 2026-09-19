"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/(app)/admin/settings-actions";
import type { UserRole } from "@/lib/types";

type Row = { id: string; full_name: string | null; email: string; role: UserRole };
const ROLES: UserRole[] = ["admin", "management", "marketing", "lecturer"];

export function RoleManager({ users, meId }: { users: Row[]; meId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line">
          <tr className="text-[11px] uppercase tracking-wide text-faint">
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Email</th>
            <th className="px-5 py-3 font-semibold">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line2 last:border-0">
              <td className="px-5 py-3 font-medium text-ink">{u.full_name || "—"}</td>
              <td className="px-5 py-3 text-muted">{u.email}</td>
              <td className="px-5 py-3">
                <select
                  defaultValue={u.role}
                  disabled={pending || u.id === meId}
                  onChange={(e) =>
                    startTransition(async () => {
                      await setUserRole(u.id, e.target.value as UserRole);
                      router.refresh();
                    })
                  }
                  className="h-9 rounded-control border border-line bg-field px-2 text-sm text-ink focus:border-niqat focus:outline-none disabled:opacity-60"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {u.id === meId && <span className="ml-2 text-xs text-faint">(you)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
