"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@/app/(app)/admin/collections-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateCollection() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  function submit() {
    setError(null);
    if (!name.trim()) return;
    start(async () => {
      const res = await createCollection({ name, description });
      if (res.error) setError(res.error);
      else { setName(""); setDescription(""); router.refresh(); }
    });
  }
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-card border border-line2 bg-ground/40 p-4">
      <div className="min-w-[200px] flex-1"><label className="text-xs text-muted">New collection</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Best BIM student work" /></div>
      <div className="min-w-[200px] flex-1"><label className="text-xs text-muted">Description (optional)</label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="…" /></div>
      <Button type="button" disabled={pending} onClick={submit}>Create</Button>
      {error && <p className="w-full text-sm text-niqat-hover">{error}</p>}
    </div>
  );
}
