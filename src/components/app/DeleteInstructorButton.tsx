"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInstructor } from "@/app/(app)/admin/lecturer-actions";

export function DeleteInstructorButton({ lecturerId, name }: { lecturerId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function del() {
    if (!window.confirm(`Permanently delete ${name}? This removes their profile, files, feedback, and account. This can't be undone.`)) return;
    start(async () => {
      const res = await deleteInstructor(lecturerId);
      if (res.error) setError(res.error);
      else {
        router.push("/admin/lecturers");
        router.refresh();
      }
    });
  }

  return (
    <div>
      <button
        onClick={del}
        disabled={pending}
        className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete instructor"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
