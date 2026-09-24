"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProgram, assignLecturer, unassignLecturer } from "@/app/(app)/admin/catalog-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Program = { id: string; name: string; type: string; members: { id: string; name: string }[] };
type Lecturer = { id: string; full_name: string | null; email: string };

const selectCls = "h-[42px] w-full rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

export function ProgramsManager({ programs, lecturers, canManage }: { programs: Program[]; lecturers: Lecturer[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState<"diploma" | "course" | "service">("diploma");
  const [aLect, setALect] = useState<Record<string, string>>({});

  function run(fn: () => Promise<{ error: string | null }>, after?: () => void) {
    setErr(null);
    start(async () => {
      const res = await fn();
      if (res.error) setErr(res.error);
      else { after?.(); router.refresh(); }
    });
  }

  return (
    <div className="space-y-6">
      {err && <p className="rounded-control bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">{err}</p>}

      {canManage && (
        <div className="flex flex-wrap items-end gap-3 rounded-card border border-line2 bg-ground/40 p-4">
          <div className="min-w-[200px] flex-1">
            <label className="text-xs text-muted">New program / service</label>
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
          <Button type="button" disabled={pending} onClick={() => run(() => createProgram({ name: pName, type: pType }), () => setPName(""))}>Add</Button>
        </div>
      )}

      {programs.length === 0 ? (
        <p className="text-sm text-muted">No programs yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((p) => (
            <div key={p.id} className="rounded-card border border-line bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink">{p.name}</h3>
                <span className="rounded-full bg-line2 px-2 py-0.5 text-xs text-muted">{p.type}</span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-faint">Instructors ({p.members.length})</p>
              {p.members.length === 0 ? (
                <p className="mt-1 text-sm text-muted">None assigned.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {p.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between">
                      <span className="text-ink">{m.name}</span>
                      {canManage && (
                        <button onClick={() => run(() => unassignLecturer({ lecturerId: m.id, programId: p.id }))} disabled={pending} className="text-xs text-muted hover:text-ink">Remove</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && (
                <div className="mt-3 flex items-center gap-2">
                  <select value={aLect[p.id] ?? ""} onChange={(e) => setALect((x) => ({ ...x, [p.id]: e.target.value }))} className={selectCls}>
                    <option value="">Assign instructor…</option>
                    {lecturers.filter((l) => !p.members.some((m) => m.id === l.id)).map((l) => (
                      <option key={l.id} value={l.id}>{l.full_name || l.email}</option>
                    ))}
                  </select>
                  <Button variant="secondary" type="button" disabled={pending || !aLect[p.id]} onClick={() => run(() => assignLecturer({ lecturerId: aLect[p.id] || "", programId: p.id }), () => setALect((x) => ({ ...x, [p.id]: "" })))}>Add</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
