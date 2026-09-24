"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDownloadUrl, requestFileDeletion } from "@/app/(app)/me/file-actions";
import { deleteAsset, setFeatured, createShareLink } from "@/app/(app)/admin/asset-actions";
import { ASSET_KIND_LABEL } from "@/lib/assets";
import { Button } from "@/components/ui/Button";
import type { AssetItem } from "@/lib/asset-view";
export type { AssetItem };

const FileIcon = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7" /></svg>);
const LinkIcon = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
function Star({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" width={16} height={16} stroke="currentColor" strokeWidth="1.5" className={filled ? "fill-niqat text-niqat" : "fill-none text-faint"}><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01z" /></svg>;
}

export function AssetGrid({
  items, canDelete = false, requestDelete = false, showLecturer = false,
  selectable = false, canFeature = false, canShare = false,
}: {
  items: AssetItem[]; canDelete?: boolean; requestDelete?: boolean; showLecturer?: boolean;
  selectable?: boolean; canFeature?: boolean; canShare?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<{ url: string; name: string; pdf: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);
  const [share, setShare] = useState<{ url: string; expires: string | null } | null>(null);

  function toggle(id: string) { setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function selectAll() { setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id))); }

  async function download(it: AssetItem) {
    if (it.source === "link" && it.link_url) { window.open(it.link_url, "_blank", "noopener"); return; }
    setBusyId(it.id);
    const res = await createDownloadUrl(it.id);
    setBusyId(null);
    if (res.url) window.open(res.url, "_blank", "noopener");
  }
  async function downloadZip() {
    if (selected.size === 0) return;
    setZipping(true);
    try {
      const res = await fetch("/api/download-zip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected] }) });
      if (!res.ok) { window.alert("Could not build the ZIP."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "niqat-assets.zip"; a.click(); URL.revokeObjectURL(url);
      setSelected(new Set());
    } finally { setZipping(false); }
  }
  function remove(id: string) { if (!window.confirm("Delete this asset? This can't be undone.")) return; startTransition(async () => { await deleteAsset(id); router.refresh(); }); }
  function askDelete(id: string) { if (!window.confirm("Request deletion? An admin will review it.")) return; startTransition(async () => { await requestFileDeletion(id); window.alert("Deletion requested."); }); }
  function feature(id: string, v: boolean) { startTransition(async () => { await setFeatured(id, v); router.refresh(); }); }
  async function doShare(id: string) { const res = await createShareLink(id, 7); if (res.url) setShare({ url: res.url, expires: res.expires }); else window.alert(res.error || "Could not create link."); }

  if (items.length === 0) return <div className="rounded-card border border-dashed border-line bg-card/60 p-10 text-center"><p className="text-sm text-muted">No assets.</p></div>;

  return (
    <div className="space-y-4">
      {selectable && (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={selectAll} className="text-sm font-medium text-muted hover:text-ink">{selected.size === items.length ? "Clear all" : "Select all"}</button>
          <span className="text-sm text-faint">{selected.size} selected</span>
          <Button type="button" disabled={selected.size === 0 || zipping} onClick={downloadZip}>{zipping ? "Building ZIP…" : "Download ZIP"}</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.id} className={`relative flex flex-col overflow-hidden rounded-card border bg-card shadow-card ${selected.has(it.id) ? "border-niqat" : "border-line"}`}>
            {selectable && (
              <label className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-white/90 shadow-card">
                <input type="checkbox" checked={selected.has(it.id)} onChange={() => toggle(it.id)} className="h-4 w-4 accent-niqat" />
              </label>
            )}
            {canFeature && (
              <button type="button" onClick={() => feature(it.id, !it.featured)} disabled={pending} className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-white/90 shadow-card" aria-label="Feature">
                <Star filled={it.featured} />
              </button>
            )}
            {it.isImage && it.previewUrl ? (
              <button type="button" onClick={() => setPreview({ url: it.previewUrl!, name: it.title || it.name, pdf: false })} className="block h-28 w-full bg-line2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={it.previewUrl} alt="" className="h-full w-full object-cover" /></button>
            ) : it.isPdf && it.previewUrl ? (
              <button type="button" onClick={() => setPreview({ url: it.previewUrl!, name: it.title || it.name, pdf: true })} className="flex h-28 w-full items-center justify-center bg-line2 text-niqat"><span className="text-sm font-bold">PDF</span></button>
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
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button onClick={() => download(it)} disabled={busyId === it.id} className="text-xs font-semibold text-niqat hover:text-niqat-hover disabled:opacity-50">{it.source === "link" ? "Open" : "Download"}</button>
                {canShare && <button onClick={() => doShare(it.id)} className="text-xs font-medium text-muted hover:text-ink">Share</button>}
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
            {preview.pdf ? <iframe src={preview.url} title={preview.name} className="h-[80vh] w-full rounded-card bg-white" /> : (/* eslint-disable-next-line @next/next/no-img-element */ <img src={preview.url} alt="" className="mx-auto max-h-[80vh] w-auto rounded-card" />)}
            <div className="mt-3 flex items-center justify-between gap-4 text-white"><span className="truncate text-sm">{preview.name}</span><button onClick={() => setPreview(null)} className="rounded-control bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">Close</button></div>
          </div>
        </div>
      )}

      {share && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setShare(null)}>
          <div className="w-full max-w-lg rounded-card bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-ink">Share link</h3>
            <p className="mt-1 text-sm text-muted">Anyone with this link can view the file{share.expires ? ` until ${share.expires}` : ""}.</p>
            <input readOnly value={share.url} onFocus={(e) => e.currentTarget.select()} className="mt-3 w-full rounded-control border border-line bg-field px-3 py-2 text-sm text-ink" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => { navigator.clipboard?.writeText(share.url); }} className="rounded-control bg-niqat px-3 py-1.5 text-sm font-semibold text-white hover:bg-niqat-hover">Copy</button>
              <button onClick={() => setShare(null)} className="rounded-control border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
