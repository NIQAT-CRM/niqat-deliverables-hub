"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveDeletion, rejectDeletion } from "@/app/(app)/admin/deletion-actions";
export function DeletionQueueActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => { if (!window.confirm("Approve and permanently delete this file?")) return; start(async () => { await approveDeletion(requestId); router.refresh(); }); }} disabled={pending} className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">Approve &amp; delete</button>
      <button onClick={() => start(async () => { await rejectDeletion(requestId); router.refresh(); })} disabled={pending} className="text-sm font-medium text-muted hover:text-ink disabled:opacity-50">Reject</button>
    </div>
  );
}
