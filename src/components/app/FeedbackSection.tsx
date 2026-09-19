"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addFeedback, deleteFeedback } from "@/app/(app)/admin/lecturer-actions";
import { Button } from "@/components/ui/Button";

type Item = {
  id: string;
  content: string | null;
  created_at: string;
};

export function FeedbackSection({
  lecturerId,
  items,
  canManage,
}: {
  lecturerId: string;
  items: Item[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!content.trim()) return;
    startTransition(async () => {
      const res = await addFeedback({ lecturerId, content });
      if (res.error) setError(res.error);
      else {
        setContent("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteFeedback(id, lecturerId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-card border border-line bg-card p-6 shadow-card">
      <h2 className="font-bold text-ink">Feedback</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <li key={f.id} className="rounded-control border border-line2 bg-ground/40 p-3">
              <p className="whitespace-pre-wrap text-sm text-ink">{f.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-faint">
                  {new Date(f.created_at).toLocaleDateString()}
                </span>
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

      {canManage && (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Write feedback for this lecturer…"
            className="w-full rounded-control border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-niqat focus:outline-none"
          />
          {error && <p className="text-sm text-niqat-hover">{error}</p>}
          <Button type="button" disabled={pending} onClick={submit}>
            {pending ? "Adding…" : "Add feedback"}
          </Button>
        </div>
      )}
    </div>
  );
}
