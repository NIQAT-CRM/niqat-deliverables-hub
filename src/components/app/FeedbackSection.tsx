"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addFeedback, addFeedbackFile, deleteFeedback } from "@/app/(app)/admin/lecturer-actions";
import { Button } from "@/components/ui/Button";

export type FeedbackItem = {
  id: string;
  content: string | null;
  kind: string;
  created_at: string;
  fileUrl: string | null;
  isImage: boolean;
};

export function FeedbackSection({
  lecturerId,
  items,
  canManage,
}: {
  lecturerId: string;
  items: FeedbackItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submitText() {
    setError(null);
    if (!content.trim()) return;
    startTransition(async () => {
      const res = await addFeedback({ lecturerId, content });
      if (res.error) setError(res.error);
      else { setContent(""); router.refresh(); }
    });
  }

  async function attach(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${lecturerId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("feedback").upload(path, file);
      if (upErr) { setError("Upload failed."); return; }
      const res = await addFeedbackFile({ lecturerId, path, name: file.name, type: file.type });
      if (res.error) setError(res.error);
      else router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    startTransition(async () => { await deleteFeedback(id, lecturerId); router.refresh(); });
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
              {f.fileUrl && f.isImage ? (
                <a href={f.fileUrl} target="_blank" rel="noopener" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.fileUrl} alt={f.content ?? ""} className="max-h-48 rounded-control object-cover" />
                </a>
              ) : f.fileUrl ? (
                <a href={f.fileUrl} target="_blank" rel="noopener" className="text-sm font-medium text-niqat hover:text-niqat-hover">
                  📎 {f.content || "Attachment"}
                </a>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-ink">{f.content}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-faint">{new Date(f.created_at).toLocaleDateString()}</span>
                {canManage && (
                  <button onClick={() => remove(f.id)} disabled={pending} className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50">Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="space-y-2">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Write feedback…" className="w-full rounded-control border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-niqat focus:outline-none" />
          {error && <p className="text-sm text-niqat-hover">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="button" disabled={pending} onClick={submitText}>{pending ? "Adding…" : "Add feedback"}</Button>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => attach(e.target.files?.[0])} />
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="text-sm font-medium text-niqat hover:text-niqat-hover disabled:opacity-50">
              {busy ? "Uploading…" : "Attach file/image"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
