"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestEdit } from "@/app/(app)/me/actions";
import { Button } from "@/components/ui/Button";

export function RequestEditButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await requestEdit();
            if (res.error) setError(res.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Requesting…" : "Request edit"}
      </Button>
      {error && <span className="text-xs text-niqat-hover">{error}</span>}
    </div>
  );
}
