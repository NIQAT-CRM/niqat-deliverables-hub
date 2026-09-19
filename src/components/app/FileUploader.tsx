"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordFile } from "@/app/(app)/me/file-actions";
import { FILE_CATEGORIES } from "@/lib/files";
import { Button } from "@/components/ui/Button";

const BUCKET = "lecturer-files";
const selectCls =
  "h-[42px] rounded-control border border-line bg-field px-3 text-sm text-ink focus:border-niqat focus:outline-none";

export function FileUploader({
  userId,
  groups = [],
}: {
  userId: string;
  groups?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("student_work");
  const [groupId, setGroupId] = useState<string>("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
        if (upErr) {
          setError(`Upload failed for "${file.name}".`);
          continue;
        }
        const res = await recordFile({
          path,
          name: file.name,
          type: file.type,
          size: file.size,
          category,
          groupId: groupId || null,
        });
        if (res.error) setError(res.error);
      }
      router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={selectCls}
        aria-label="File category"
      >
        {FILE_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {groups.length > 0 && (
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className={selectCls}
          aria-label="Share with group"
        >
          <option value="">Private</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>Share: {g.name}</option>
          ))}
        </select>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Uploading…" : "Upload files"}
      </Button>
      {error && <p className="w-full text-sm text-niqat-hover">{error}</p>}
    </div>
  );
}
