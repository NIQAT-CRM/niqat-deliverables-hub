"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDownloadUrl, deleteFile } from "@/app/(app)/me/file-actions";

export function FileRowActions({ fileId }: { fileId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const res = await createDownloadUrl(fileId);
    setBusy(false);
    if (res.url) window.open(res.url, "_blank", "noopener");
  }

  function remove() {
    if (!window.confirm("Delete this file? This can't be undone.")) return;
    startTransition(async () => {
      await deleteFile(fileId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-4">
      <button
        onClick={download}
        disabled={busy}
        className="text-sm font-medium text-niqat hover:text-niqat-hover disabled:opacity-50"
      >
        Download
      </button>
      <button
        onClick={remove}
        disabled={pending}
        className="text-sm font-medium text-muted hover:text-ink disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
