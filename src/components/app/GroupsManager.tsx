"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProgram,
  createGroup,
  setMutualAccess,
  assignLecturer,
} from "@/app/(app)/admin/catalog-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Program = { id: string; name: string; type: string };
type Group = { id: string; name: string; program_id: string | null; mutual_access: boolean };
type Lecturer = { id: string; full_name: string | null; email: string };
type Member = { program_id: string; name: string };

const selectCls =
  "h-[42px] w-full rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

export function GroupsManager({
  programs,
  groups,
  lecturers,
  membersByProgram,
}: {
  programs: Program[];
  groups: Group[];
  lecturers: Lecturer[];
  membersByProgram: Record<string, Member[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [pName, setPName] = useState("");
  const [pType, setPType] = useState<"diploma" | "course" | "service">("diploma");
  const [gName, setGName] = useState("");
  const [gProgram, setGProgram] = useState("");
  const [gMutual, setGMutual] = useState(false);
  const [aLect, setALect] = useState("");
  const [aProg, setAProg] = useState("");

  function run(fn: () => Promise<{ error: string | null }>, after?: () => void) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setErr(res.error);
      else {
        after?.();
        router.refresh();
      }
    });
  }

  const programName = (pid: string | null) =>
    programs.find((p) => p.id === pid)?.name ?? "—";

  return (
    <div className="space-y-8">
      {err && (
        <p className="rounded-control bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">{err}</p>
      )}

      {/* Groups */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Groups</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted">No groups yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => {
              const members = g.program_id ? membersByProgram[g.program_id] ?? [] : [];
              return (
                <div key={g.id} className="rounded-card border border-line bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{g.name}</p>
                      <p className="text-xs text-muted">Program: {programName(g.program_id)}</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={g.mutual_access}
                        disabled={pending}
                        onChange={(e) => run(() => setMutualAccess(g.id, e.target.checked))}
                        className="h-4 w-4 accent-niqat"
                      />
                      Shared access
                    </label>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                      Members ({members.length})
                    </p>
                    {members.length === 0 ? (
                      <p className="mt-1 text-sm text-muted">No members.</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5 text-sm text-muted">
                        {members.map((m, i) => (
                          <li key={i}>{m.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 rounded-card border border-line2 bg-ground/40 p-4">
          <div className="min-w-[160px] flex-1">
            <label className="text-xs text-muted">Group name</label>
            <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="e.g. BIM Diploma – Batch 5" />
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-muted">Program</label>
            <select value={gProgram} onChange={(e) => setGProgram(e.target.value)} className={selectCls}>
              <option value="">None</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <label className="flex h-[42px] items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={gMutual} onChange={(e) => setGMutual(e.target.checked)} className="h-4 w-4 accent-niqat" />
            Shared
          </label>
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => createGroup({ name: gName, programId: gProgram || null, mutual: gMutual }), () => { setGName(""); setGProgram(""); setGMutual(false); })}
          >
            Add group
          </Button>
        </div>
      </section>

      {/* Programs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Programs</h2>
        {programs.length === 0 ? (
          <p className="text-sm text-muted">No programs yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {programs.map((p) => (
              <li key={p.id} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink">
                {p.name} <span className="text-xs text-faint">· {p.type}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-3 rounded-card border border-line2 bg-ground/40 p-4">
          <div className="min-w-[160px] flex-1">
            <label className="text-xs text-muted">Program name</label>
            <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. BIM Diploma" />
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-muted">Type</label>
            <select value={pType} onChange={(e) => setPType(e.target.value as typeof pType)} className={selectCls}>
              <option value="diploma">Diploma</option>
              <option value="course">Course</option>
              <option value="service">Service</option>
            </select>
          </div>
          <Button type="button" disabled={pending} onClick={() => run(() => createProgram({ name: pName, type: pType }), () => setPName(""))}>
            Add program
          </Button>
        </div>
      </section>

      {/* Assign */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Assign lecturer to program</h2>
        <p className="text-sm text-muted">Group membership is derived from these assignments.</p>
        <div className="flex flex-wrap items-end gap-3 rounded-card border border-line2 bg-ground/40 p-4">
          <div className="min-w-[160px] flex-1">
            <label className="text-xs text-muted">Lecturer</label>
            <select value={aLect} onChange={(e) => setALect(e.target.value)} className={selectCls}>
              <option value="">Choose lecturer…</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>{l.full_name || l.email}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="text-xs text-muted">Program</label>
            <select value={aProg} onChange={(e) => setAProg(e.target.value)} className={selectCls}>
              <option value="">Choose program…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <Button type="button" disabled={pending} onClick={() => run(() => assignLecturer({ lecturerId: aLect, programId: aProg }), () => { setALect(""); setAProg(""); })}>
            Assign
          </Button>
        </div>
      </section>
    </div>
  );
}
