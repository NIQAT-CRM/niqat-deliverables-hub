"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/(app)/me/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const LINK_FIELDS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "website", label: "Website", placeholder: "https://…" },
  { key: "phone", label: "Phone", placeholder: "+20 …" },
];

export function ProfileForm({
  initialBio,
  initialLinks,
}: {
  initialBio: string;
  initialLinks: Record<string, string>;
}) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<Record<string, string>>(initialLinks);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(intent: "save" | "submit") {
    setError(null);
    setNote(null);
    if (intent === "submit") {
      const ok = window.confirm(
        "Submit your profile? It will be locked, and you'll need to request an edit to change it.",
      );
      if (!ok) return;
    }
    startTransition(async () => {
      const res = await saveProfile({ bio, contact_links: links }, intent);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (intent === "save") setNote("Saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 rounded-card border border-line bg-white p-6 shadow-card">
      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium text-ink">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          placeholder="A short professional summary…"
          className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-niqat focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Contact links</h2>
        {LINK_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label htmlFor={f.key} className="text-sm text-muted">
              {f.label}
            </label>
            <Input
              id={f.key}
              value={links[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) =>
                setLinks((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-card bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">
          {error}
        </p>
      )}
      {note && <p className="text-sm text-muted">{note}</p>}

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <Button
          variant="secondary"
          type="button"
          disabled={pending}
          onClick={() => run("save")}
        >
          {pending ? "Saving…" : "Save draft"}
        </Button>
        <Button type="button" disabled={pending} onClick={() => run("submit")}>
          Submit profile
        </Button>
      </div>
    </div>
  );
}
