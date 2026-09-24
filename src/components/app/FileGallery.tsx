"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDownloadUrl, deleteFile } from "@/app/(app)/me/file-actions";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/files";

export type GalleryFile = {
  id: string;
  name: string;
  size: number | null;
  category: string | null;
  uploaded_at: string;
  isImage: boolean;
  thumbUrl: string | null;
  downloadedLabel?: string | null;
};

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FileIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M13 2v7h7" />
  </svg>
);

export function FileGallery({
  files,
  canDelete = false,
}: {
  files: GalleryFile[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const byCategory: Record<string, GalleryFile[]> = {};
  for (const f of files) (byCategory[f.category || "other"] ||= []).push(f);

  async function download(id: string) {
    setBusyId(id);
    const res = await createDownloadUrl(id);
    setBusyId(null);
    if (res.url) window.open(res.url, "_blank", "noopener");
  }
  function remove(id: string) {
    if (!window.confirm("Delete this file? This can't be undone.")) return;
    startTransition(async () => {
      await deleteFile(id);
      router.refresh();
    });
  }

  if (files.length === 0) {
    return (
      <div className="rounded-card border border-line bg-card p-8 text-center shadow-card">
        <p className="text-sm text-muted">No files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.filter((c) => byCategory[c]?.length).map((c) => (
        <div key={c}>
          <h3 className="mb-2 text-sm font-semibold text-ink">{CATEGORY_LABEL[c]}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byCategory[c].map((f) => (
              <div key={f.id} className="overflow-hidden rounded-card border border-line bg-card shadow-card">
                {f.isImage && f.thumbUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreview({ url: f.thumbUrl!, name: f.name })}
                    className="block h-28 w-full bg-line2"
                    aria-label={`Preview ${f.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumbUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-line2 text-faint">
                    {FileIcon}
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-ink" title={f.name}>{f.name}</p>
                  <p className="text-xs text-faint">
                    {new Date(f.uploaded_at).toLocaleDateString()} · {formatSize(f.size)}
                  </p>
                  {f.downloadedLabel && (
                    <p className="mt-0.5 text-xs text-st-locked-fg">{f.downloadedLabel}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => download(f.id)}
                      disabled={busyId === f.id}
                      className="text-xs font-semibold text-niqat hover:text-niqat-hover disabled:opacity-50"
                    >
                      Download
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => remove(f.id)}
                        disabled={pending}
                        className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreview(null)}
        >
          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt="" className="max-h-[80vh] w-auto rounded-card" />
            <div className="mt-3 flex items-center justify-between gap-4 text-white">
              <span className="truncate text-sm">{preview.name}</span>
              <button
                onClick={() => setPreview(null)}
                className="rounded-control bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
