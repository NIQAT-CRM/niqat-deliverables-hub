"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reopenProfile } from "@/app/(app)/admin/actions";

export function ReopenButton({ lecturerId }: { lecturerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await reopenProfile(lecturerId);
          router.refresh();
        })
      }
      className="text-sm font-medium text-niqat hover:text-niqat-hover disabled:opacity-50"
    >
      {pending ? "Reopening…" : "Reopen"}
    </button>
  );
}
