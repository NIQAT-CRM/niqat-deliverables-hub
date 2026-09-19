"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTeam,
  deleteTeam,
  setTeamCapability,
  addTeamMember,
  removeTeamMember,
} from "@/app/(app)/admin/settings-actions";
import { TEAM_CAPABILITIES } from "@/lib/permissions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Member = { user_id: string; name: string };
type Team = {
  id: string;
  name: string;
  members: Member[];
} & Record<string, boolean | string | Member[]>;
type Staff = { id: string; full_name: string | null; email: string; role: string };

const selectCls =
  "h-[42px] rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

export function TeamsManager({ teams, staff }: { teams: Team[]; staff: Staff[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [addSel, setAddSel] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  function run(fn: () => Promise<{ error: string | null }>) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {err && <p className="rounded-control bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">{err}</p>}

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-line2 bg-ground/40 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs text-muted">New team</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Education Team" />
        </div>
        <Button type="button" disabled={pending} onClick={() => run(async () => { const r = await createTeam(name); if (!r.error) setName(""); return r; })}>
          Create team
        </Button>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-muted">No teams yet.</p>
      ) : (
        <div className="space-y-4">
          {teams.map((t) => (
            <div key={t.id} className="rounded-card border border-line bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-ink">{t.name}</h3>
                <button
                  onClick={() => run(() => deleteTeam(t.id))}
                  disabled={pending}
                  className="text-sm font-medium text-muted hover:text-ink disabled:opacity-50"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">Permissions</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {TEAM_CAPABILITIES.map((c) => (
                    <label key={c.key} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={!!t[c.key]}
                        disabled={pending}
                        onChange={(e) => run(() => setTeamCapability(t.id, c.key, e.target.checked))}
                        className="h-4 w-4 accent-niqat"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-faint">Members</p>
                {t.members.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">No members.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {t.members.map((m) => (
                      <li key={m.user_id} className="flex items-center justify-between text-sm">
                        <span className="text-ink">{m.name}</span>
                        <button
                          onClick={() => run(() => removeTeamMember(t.id, m.user_id))}
                          disabled={pending}
                          className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={addSel[t.id] ?? ""}
                    onChange={(e) => setAddSel((p) => ({ ...p, [t.id]: e.target.value }))}
                    className={selectCls}
                  >
                    <option value="">Add member…</option>
                    {staff
                      .filter((s) => !t.members.some((m) => m.user_id === s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {(s.full_name || s.email) + " · " + s.role}
                        </option>
                      ))}
                  </select>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={pending || !addSel[t.id]}
                    onClick={() => run(async () => { const r = await addTeamMember(t.id, addSel[t.id] || ""); if (!r.error) setAddSel((p) => ({ ...p, [t.id]: "" })); return r; })}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
