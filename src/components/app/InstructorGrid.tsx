"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import { CompletionBar } from "@/components/ui/CompletionBar";
import { ReopenButton } from "@/components/app/ReopenButton";
import { RestoreButton } from "@/components/app/ArchiveButtons";
import { bulkArchive, bulkAssignProgram } from "@/app/(app)/admin/bulk-actions";
import { Button } from "@/components/ui/Button";
import type { ProfileStatus } from "@/lib/types";

export type InstructorCard = {
  id: string; name: string; email: string; status: ProfileStatus | null; rating: number;
  avatar: string | null; teaching: string[]; files: number; archived: boolean; completion: number;
};

function initials(name: string) { return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(); }

export function InstructorGrid({ cards, programs, isAdmin, showArchived }: { cards: InstructorCard[]; programs: { id: string; name: string }[]; isAdmin: boolean; showArchived: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [prog, setProg] = useState("");
  const canBulk = isAdmin || !showArchived; // management can archive active
  function toggle(id: string) { setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  return (
    <div className="space-y-4">
      {canBulk && sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-card p-3 shadow-card">
          <span className="text-sm font-medium text-ink">{sel.size} selected</span>
          {!showArchived && <Button variant="secondary" type="button" disabled={pending} onClick={() => { if (!window.confirm(`Archive ${sel.size} instructor(s)? Data is kept.`)) return; start(async () => { await bulkArchive([...sel]); setSel(new Set()); router.refresh(); }); }}>Archive selected</Button>}
          {isAdmin && !showArchived && (
            <div className="flex items-center gap-2">
              <select value={prog} onChange={(e) => setProg(e.target.value)} className="h-[42px] rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none"><option value="">Assign to program…</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <Button variant="secondary" type="button" disabled={pending || !prog} onClick={() => start(async () => { await bulkAssignProgram([...sel], prog); setSel(new Set()); setProg(""); router.refresh(); })}>Assign</Button>
            </div>
          )}
          <button onClick={() => setSel(new Set())} className="text-sm text-muted hover:text-ink">Clear</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.id} className={`relative flex flex-col rounded-card border bg-card p-5 shadow-card transition-all hover:border-niqat/40 hover:shadow-card-hover hover:-translate-y-0.5 ${sel.has(c.id) ? "border-niqat" : "border-line"}`}>
            {canBulk && <label className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-white/90 shadow-card"><input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-niqat" /></label>}
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-niqat-soft text-lg font-bold text-niqat ring-2 ring-white">
                {c.avatar ? (/* eslint-disable-next-line @next/next/no-img-element */ <img src={c.avatar} alt="" className="h-full w-full object-cover" />) : initials(c.name)}
              </div>
              <StatusBadge status={c.archived ? "archived" : c.status} />
            </div>
            <div className="mt-3">
              <Link href={`/admin/lecturers/${c.id}`} className="text-base font-bold text-ink hover:text-niqat">{c.name}</Link>
              <p className="truncate text-sm text-muted">{c.email}</p>
              <div className="mt-1.5"><RatingStars value={c.rating} /></div>
            </div>
            <div className="mt-3 min-h-[26px]">
              {c.teaching.length > 0 ? <div className="flex flex-wrap gap-1.5">{c.teaching.map((t, i) => <span key={i} className="rounded-full bg-niqat-soft px-2 py-0.5 text-xs font-medium text-niqat">{t}</span>)}</div> : <span className="text-xs text-faint">Not assigned to a program</span>}
            </div>
            <CompletionBar percent={c.completion} className="mt-3" />
            {c.archived && <p className="mt-2 text-xs font-medium text-faint">No longer active</p>}
            <div className="mt-4 flex items-center justify-between border-t border-line2 pt-3">
              <span className="text-xs text-muted">{c.files} {c.files === 1 ? "file" : "files"}</span>
              <div className="flex items-center gap-3">
                {c.archived ? (isAdmin && <RestoreButton lecturerId={c.id} />) : ((c.status === "locked" || c.status === "edit_requested") && isAdmin && <ReopenButton lecturerId={c.id} />)}
                <Link href={`/admin/lecturers/${c.id}`} className="text-sm font-semibold text-niqat hover:text-niqat-hover">View</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
