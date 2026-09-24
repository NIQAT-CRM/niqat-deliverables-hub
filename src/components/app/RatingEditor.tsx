"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRating } from "@/app/(app)/admin/lecturer-actions";
import { Button } from "@/components/ui/Button";

export function RatingEditor({
  lecturerId,
  initialRating,
  initialNote,
}: {
  lecturerId: string;
  initialRating: number;
  initialNote: string;
}) {
  const router = useRouter();
  const [rating, setRatingVal] = useState(initialRating);
  const [note, setNote] = useState(initialNote);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await setRating({ lecturerId, rating, note });
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3 rounded-card border border-line bg-card p-6 shadow-card">
      <h2 className="font-bold text-ink">Rating</h2>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRatingVal(rating === i ? 0 : i)}
            className="p-0.5"
            aria-label={`${i} of 3`}
          >
            <svg
              viewBox="0 0 24 24"
              width={26}
              height={26}
              stroke="currentColor"
              strokeWidth="1.5"
              className={i <= rating ? "fill-niqat text-niqat" : "fill-none text-line hover:text-niqat"}
            >
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01z" />
            </svg>
          </button>
        ))}
        <span className="ml-1 text-sm text-muted">{rating}/3</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Private note (optional)…"
        className="w-full rounded-control border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-niqat focus:outline-none"
      />
      {error && <p className="text-sm text-niqat-hover">{error}</p>}
      {saved && <p className="text-sm text-st-locked-fg">Saved.</p>}
      <Button type="button" disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save rating"}
      </Button>
    </div>
  );
}
