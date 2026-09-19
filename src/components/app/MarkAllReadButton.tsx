"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllRead } from "@/app/(app)/admin/notif-actions";
import { Button } from "@/components/ui/Button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await markAllRead(); router.refresh(); })}
    >
      {pending ? "…" : "Mark all read"}
    </Button>
  );
}
