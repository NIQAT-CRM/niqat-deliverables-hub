"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMasterFeedback, deleteMasterFeedback } from "@/app/(app)/admin/feedback-actions";
import { Button } from "@/components/ui/Button";

type Item = { id: string; content: string | null; created_at: string };

export function MasterFeedback({ items, canManage }: { items: Item[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    if (!content.trim()) return;
    startTransition(async () => {
      const res = await addMasterFeedback(content);
      if (res.error) setError(res.error);
      else { setContent(""); router.refresh(); }
    });
  }
  function remove(id: string) {
    startTransition(async () => { await deleteMasterFeedback(id); router.refresh(); });
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="space-y-2 rounded-card border border-line bg-card p-6 shadow-card">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Write a note for the management store…"
            className="w-full rounded-control border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-niqat focus:outline-none"
          />
          {error && <p className="text-sm text-niqat-hover">{error}</p>}
          <Button type="button" disabled={pending} onClick={add}>
            {pending ? "Adding…" : "Add note"}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-10 text-center shadow-card">
          <p className="text-sm text-muted">No management notes yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <li key={f.id} className="rounded-card border border-line bg-card p-5 shadow-card">
              <p className="whitespace-pre-wrap text-sm text-ink">{f.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-faint">{new Date(f.created_at).toLocaleDateString()}</span>
                {canManage && (
                  <button
                    onClick={() => remove(f.id)}
                    disabled={pending}
                    className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
