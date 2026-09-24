"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordAsset } from "@/app/(app)/me/asset-actions";
import { LECTURER_ASSET_KINDS } from "@/lib/assets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const sel = "h-[42px] w-full rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

export function AssetUploader({ userId, programs }: { userId: string; programs: { id: string; name: string }[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("trainee_work");
  const [programId, setProgramId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");

  function reset() { setTitle(""); setDescription(""); setLinkUrl(""); if (fileRef.current) fileRef.current.value = ""; }

  async function submit() {
    setError(null);
    if (mode === "link") {
      if (!linkUrl.trim()) { setError("Enter a link."); return; }
      start(async () => {
        const res = await recordAsset({ path: null, name: title || linkUrl, type: null, size: null, asset_kind: kind, program_id: programId || null, title, description, source: "link", link_url: linkUrl.trim() });
        if (res.error) setError(res.error); else { reset(); router.refresh(); }
      });
      return;
    }
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${userId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("lecturer-files").upload(path, file);
      if (upErr) { setError("Upload failed."); return; }
      const res = await recordAsset({ path, name: file.name, type: file.type, size: file.size, asset_kind: kind, program_id: programId || null, title: title || file.name, description, source: "file", link_url: null });
      if (res.error) setError(res.error); else { reset(); router.refresh(); }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 rounded-card border border-line bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink">Upload an asset</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={sel} aria-label="Type">
          {LECTURER_ASSET_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <select value={programId} onChange={(e) => setProgramId(e.target.value)} className={sel} aria-label="Program">
          <option value="">No program</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (optional)" className="w-full rounded-control border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-niqat focus:outline-none" />
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setMode("file")} className={`rounded-control px-3 py-1.5 text-sm font-medium ${mode === "file" ? "bg-niqat-soft text-niqat" : "text-muted"}`}>File</button>
        <button type="button" onClick={() => setMode("link")} className={`rounded-control px-3 py-1.5 text-sm font-medium ${mode === "link" ? "bg-niqat-soft text-niqat" : "text-muted"}`}>Link</button>
      </div>
      {mode === "file" ? (
        <input ref={fileRef} type="file" className="block w-full text-sm text-muted file:mr-3 file:rounded-control file:border-0 file:bg-niqat file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      ) : (
        <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
      )}
      {error && <p className="text-sm text-niqat-hover">{error}</p>}
      <Button type="button" disabled={pending || busy} onClick={submit}>{busy || pending ? "Saving…" : "Add asset"}</Button>
    </div>
  );
}
