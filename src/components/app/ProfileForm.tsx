"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveProfile,
  type ExperienceEntry,
  type CertificateEntry,
} from "@/app/(app)/me/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const LINK_FIELDS = [
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "website", label: "Website", placeholder: "https://…" },
  { key: "phone", label: "Phone", placeholder: "+20 …" },
];

const emptyExperience: ExperienceEntry = {
  title: "",
  organization: "",
  period: "",
  description: "",
};
const emptyCertificate: CertificateEntry = { name: "", issuer: "", year: "" };

export function ProfileForm({
  initialBio,
  initialLinks,
  initialExperience,
  initialCertificates,
}: {
  initialBio: string;
  initialLinks: Record<string, string>;
  initialExperience: ExperienceEntry[];
  initialCertificates: CertificateEntry[];
}) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<Record<string, string>>(initialLinks);
  const [experience, setExperience] = useState<ExperienceEntry[]>(initialExperience);
  const [certificates, setCertificates] =
    useState<CertificateEntry[]>(initialCertificates);
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
      const res = await saveProfile(
        { bio, contact_links: links, experience, certificates },
        intent,
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      if (intent === "save") setNote("Saved.");
      router.refresh();
    });
  }

  function updateExp(i: number, field: keyof ExperienceEntry, value: string) {
    setExperience((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );
  }
  function updateCert(i: number, field: keyof CertificateEntry, value: string) {
    setCertificates((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Bio + contact links */}
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
      </div>

      {/* Experience */}
      <div className="space-y-4 rounded-card border border-line bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Experience</h2>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setExperience((p) => [...p, { ...emptyExperience }])}
          >
            Add experience
          </Button>
        </div>
        {experience.length === 0 && (
          <p className="text-sm text-muted">No experience added yet.</p>
        )}
        {experience.map((e, i) => (
          <div key={i} className="space-y-3 rounded-card border border-line p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Title (e.g. Lead Instructor)"
                value={e.title}
                onChange={(ev) => updateExp(i, "title", ev.target.value)}
              />
              <Input
                placeholder="Organization"
                value={e.organization}
                onChange={(ev) => updateExp(i, "organization", ev.target.value)}
              />
            </div>
            <Input
              placeholder="Period (e.g. 2020 – 2024)"
              value={e.period}
              onChange={(ev) => updateExp(i, "period", ev.target.value)}
            />
            <textarea
              placeholder="Description (optional)"
              value={e.description}
              rows={2}
              onChange={(ev) => updateExp(i, "description", ev.target.value)}
              className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-niqat focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setExperience((p) => p.filter((_, idx) => idx !== i))
              }
              className="text-sm font-medium text-muted hover:text-ink"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Certificates */}
      <div className="space-y-4 rounded-card border border-line bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Certificates</h2>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setCertificates((p) => [...p, { ...emptyCertificate }])}
          >
            Add certificate
          </Button>
        </div>
        {certificates.length === 0 && (
          <p className="text-sm text-muted">No certificates added yet.</p>
        )}
        {certificates.map((c, i) => (
          <div key={i} className="space-y-3 rounded-card border border-line p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                placeholder="Name"
                value={c.name}
                onChange={(ev) => updateCert(i, "name", ev.target.value)}
                className="sm:col-span-2"
              />
              <Input
                placeholder="Year"
                value={c.year}
                onChange={(ev) => updateCert(i, "year", ev.target.value)}
              />
            </div>
            <Input
              placeholder="Issuer"
              value={c.issuer}
              onChange={(ev) => updateCert(i, "issuer", ev.target.value)}
            />
            <button
              type="button"
              onClick={() =>
                setCertificates((p) => p.filter((_, idx) => idx !== i))
              }
              className="text-sm font-medium text-muted hover:text-ink"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-card bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">
          {error}
        </p>
      )}
      {note && <p className="text-sm text-muted">{note}</p>}

      <div className="flex items-center gap-3">
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
