"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCollection } from "@/app/(app)/admin/collections-actions";
export function DeleteCollectionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button onClick={() => { if (!window.confirm("Delete this collection? (Assets are not deleted.)")) return; start(async () => { await deleteCollection(id); router.refresh(); }); }} disabled={pending} className="text-xs font-medium text-muted hover:text-ink disabled:opacity-50">{pending ? "…" : "Delete"}</button>;
}
