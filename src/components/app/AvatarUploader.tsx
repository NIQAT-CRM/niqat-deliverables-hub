"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setAvatar } from "@/app/(app)/me/actions";

const BUCKET = "lecturer-files";

export function AvatarUploader({
  userId,
  currentUrl,
  initials,
}: {
  userId: string;
  currentUrl: string | null;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const path = `${userId}/avatar/photo`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        setError("Upload failed.");
        return;
      }
      const res = await setAvatar(path);
      if (res.error) setError(res.error);
      else router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-niqat-soft text-lg font-bold text-niqat">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-niqat hover:text-niqat-hover disabled:opacity-50"
        >
          {busy ? "Uploading…" : currentUrl ? "Change photo" : "Add a photo"}
        </button>
        {error && <p className="text-xs text-niqat-hover">{error}</p>}
      </div>
    </div>
  );
}
