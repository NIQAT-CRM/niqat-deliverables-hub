"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveInstructor, restoreInstructor } from "@/app/(app)/admin/lecturer-actions";

export function ArchiveButton({ lecturerId, name }: { lecturerId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run() {
    if (!window.confirm(`Archive ${name}? Their login is disabled and they leave the active list. All data is kept and can be restored.`)) return;
    start(async () => {
      const res = await archiveInstructor(lecturerId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }
  return (
    <div>
      <button onClick={run} disabled={pending} className="text-sm font-semibold text-niqat hover:text-niqat-hover disabled:opacity-50">
        {pending ? "Archiving…" : "Archive instructor"}
      </button>
      {error && <p className="mt-1 text-xs text-niqat-hover">{error}</p>}
    </div>
  );
}

export function RestoreButton({ lecturerId }: { lecturerId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => { await restoreInstructor(lecturerId); router.refresh(); })}
      disabled={pending}
      className="text-sm font-semibold text-st-locked-fg hover:opacity-80 disabled:opacity-50"
    >
      {pending ? "Restoring…" : "Restore"}
    </button>
  );
}
