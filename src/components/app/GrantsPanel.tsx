"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGrant, removeGrant } from "@/app/(app)/admin/lecturer-actions";
import { Button } from "@/components/ui/Button";

type StaffUser = { id: string; full_name: string | null; email: string; role: string };
type Grant = {
  id: string;
  user_id: string;
  email: string;
  can_view: boolean;
  can_download: boolean;
  can_delete: boolean;
  can_export: boolean;
};

const ACTIONS = [
  { key: "can_view", label: "View" },
  { key: "can_download", label: "Download" },
  { key: "can_delete", label: "Delete" },
  { key: "can_export", label: "Export" },
] as const;

export function GrantsPanel({
  lecturerId,
  staff,
  grants,
}: {
  lecturerId: string;
  staff: StaffUser[];
  grants: Grant[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [flags, setFlags] = useState({
    can_view: true,
    can_download: false,
    can_delete: false,
    can_export: false,
  });
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!userId) {
      setError("Choose a team member.");
      return;
    }
    startTransition(async () => {
      const res = await addGrant({ userId, lecturerId, ...flags });
      if (res.error) setError(res.error);
      else {
        setUserId("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeGrant(id, lecturerId);
      router.refresh();
    });
  }

  const granted = (g: Grant) =>
    ACTIONS.filter((a) => g[a.key]).map((a) => a.label).join(", ") || "—";

  return (
    <div className="space-y-4 rounded-card border border-line bg-card p-6 shadow-card">
      <div>
        <h2 className="font-bold text-ink">Access grants</h2>
        <p className="mt-1 text-sm text-muted">
          Give management or marketing scoped access to this lecturer.
        </p>
      </div>

      {grants.length > 0 && (
        <ul className="divide-y divide-line2">
          {grants.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <div>
                <p className="font-medium text-ink">{g.email}</p>
                <p className="text-xs text-muted">{granted(g)}</p>
              </div>
              <button
                onClick={() => remove(g.id)}
                disabled={pending}
                className="text-sm font-medium text-muted hover:text-ink disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-control border border-line2 bg-ground/40 p-4">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="h-[42px] w-full rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none"
        >
          <option value="">Choose team member…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {(s.full_name || s.email) + " · " + s.role}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-4">
          {ACTIONS.map((a) => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={flags[a.key]}
                onChange={(e) => setFlags((p) => ({ ...p, [a.key]: e.target.checked }))}
                className="h-4 w-4 accent-niqat"
              />
              {a.label}
            </label>
          ))}
        </div>
        {error && <p className="text-sm text-niqat-hover">{error}</p>}
        <Button type="button" disabled={pending} onClick={submit}>
          {pending ? "Saving…" : "Grant access"}
        </Button>
      </div>
    </div>
  );
}
