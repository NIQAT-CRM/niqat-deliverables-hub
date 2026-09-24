"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDownloadUrl } from "@/app/(app)/me/file-actions";
import { requestFileDeletion } from "@/app/(app)/me/file-actions";
import { deleteAsset } from "@/app/(app)/admin/asset-actions";
import { ASSET_KIND_LABEL } from "@/lib/assets";

import type { AssetItem } from "@/lib/asset-view";
export type { AssetItem };

const FileIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7" />
  </svg>
);
const LinkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export function AssetGrid({
  items,
  canDelete = false,
  requestDelete = false,
  showLecturer = false,
}: {
  items: AssetItem[];
  canDelete?: boolean;
  requestDelete?: boolean;
  showLecturer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ url: string; name: string; pdf: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function download(it: AssetItem) {
    if (it.source === "link" && it.link_url) {
      window.open(it.link_url, "_blank", "noopener");
      return;
    }
    setBusyId(it.id);
    const res = await createDownloadUrl(it.id);
    setBusyId(null);
    if (res.url) window.open(res.url, "_blank", "noopener");
  }
  function remove(id: string) {
    if (!window.confirm("Delete this asset? This can't be undone.")) return;
    startTransition(async () => { await deleteAsset(id); router.refresh(); });
  }
  function askDelete(id: string) {
    if (!window.confirm("Request deletion? An admin will review it.")) return;
    startTransition(async () => { await requestFileDeletion(id); window.alert("Deletion requested."); });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-card/60 p-10 text-center">
        <p className="text-sm text-muted">No assets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.id} className="flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-card">
            {it.isImage && it.previewUrl ? (
              <button type="button" onClick={() => setPreview({ url: it.previewUrl!, name: it.title || it.name, pdf: false })} className="block h-28 w-full bg-line2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ) : it.isPdf && it.previewUrl ? (
              <button type="button" onClick={() => setPreview({ url: it.previewUrl!, name: it.title || it.name, pdf: true })} className="flex h-28 w-full items-center justify-center bg-line2 text-niqat">
                <span className="text-sm font-bold">PDF</span>
              </button>
            ) : it.source === "link" ? (
              <div className="flex h-28 w-full items-center justify-center bg-line2 text-faint">{LinkIcon}</div>
            ) : (
              <div className="flex h-28 w-full items-center justify-center bg-line2 text-faint">{FileIcon}</div>
            )}
            <div className="flex flex-1 flex-col p-3">
              <p className="truncate text-sm font-medium text-ink" title={it.title || it.name}>{it.title || it.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full bg-niqat-soft px-1.5 py-0.5 text-[10px] font-medium text-niqat">{ASSET_KIND_LABEL[it.asset_kind] ?? it.asset_kind}</span>
                {it.programName && <span className="rounded-full bg-line2 px-1.5 py-0.5 text-[10px] text-muted">{it.programName}</span>}
              </div>
              {showLecturer && it.lecturerName && <p className="mt-1 truncate text-xs text-faint">{it.lecturerName}</p>}
              <p className="mt-1 text-[11px] text-faint">{new Date(it.uploaded_at).toLocaleDateString()}</p>
              {it.downloadedLabel && <p className="text-[11px] text-st-locked-fg">{it.downloadedLabel}</p>}
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => download(it)} disabled={busyId === it.id} className="text-xs font-semibold text-niqat hover:text-niqat-hover disabled:opacity-50">
                  {it.source === "link" ? "Open" : "Download"}
                </button>
                {canDelete && <button onClick={() => remove(it.id)} disabled={pending} className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50">Delete</button>}
                {requestDelete && !canDelete && <button onClick={() => askDelete(it.id)} disabled={pending} className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50">Request deletion</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setPreview(null)}>
          <div className="max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {preview.pdf ? (
              <iframe src={preview.url} title={preview.name} className="h-[80vh] w-full rounded-card bg-white" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="" className="mx-auto max-h-[80vh] w-auto rounded-card" />
            )}
            <div className="mt-3 flex items-center justify-between gap-4 text-white">
              <span className="truncate text-sm">{preview.name}</span>
              <button onClick={() => setPreview(null)} className="rounded-control bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
