import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/app/ProfileForm";
import { RequestEditButton } from "@/components/app/RequestEditButton";
import { FileUploader } from "@/components/app/FileUploader";
import { FileRowActions } from "@/components/app/FileRowActions";
import { AvatarUploader } from "@/components/app/AvatarUploader";
import type {
  ExperienceEntry,
  CertificateEntry,
} from "@/app/(app)/me/actions";
import type { ProfileStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

type FileRow = {
  id: string;
  name: string;
  size: number | null;
  uploaded_at: string;
};

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function asExperience(v: unknown): ExperienceEntry[] {
  if (!Array.isArray(v)) return [];
  return v.map((e) => ({
    title: String((e as Record<string, unknown>)?.title ?? ""),
    organization: String((e as Record<string, unknown>)?.organization ?? ""),
    period: String((e as Record<string, unknown>)?.period ?? ""),
    description: String((e as Record<string, unknown>)?.description ?? ""),
  }));
}

function asCertificates(v: unknown): CertificateEntry[] {
  if (!Array.isArray(v)) return [];
  return v.map((c) => ({
    name: String((c as Record<string, unknown>)?.name ?? ""),
    issuer: String((c as Record<string, unknown>)?.issuer ?? ""),
    year: String((c as Record<string, unknown>)?.year ?? ""),
  }));
}

function ProfileReadOnly({
  bio,
  links,
  experience,
  certificates,
}: {
  bio: string;
  links: Record<string, string>;
  experience: ExperienceEntry[];
  certificates: CertificateEntry[];
}) {
  const entries = Object.entries(links).filter(([, v]) => v);
  return (
    <div className="space-y-5 rounded-card border border-line bg-white p-6 shadow-card">
      <div>
        <h2 className="text-sm font-semibold text-ink">Bio</h2>
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{bio || "—"}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink">Contact links</h2>
        {entries.length === 0 ? (
          <p className="mt-1 text-sm text-muted">—</p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {entries.map(([key, value]) => (
              <li key={key} className="text-muted">
                <span className="capitalize text-ink">{key}:</span> {value}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink">Experience</h2>
        {experience.length === 0 ? (
          <p className="mt-1 text-sm text-muted">—</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {experience.map((e, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-ink">
                  {e.title || "—"}
                  {e.organization ? ` · ${e.organization}` : ""}
                </p>
                {e.period && <p className="text-muted">{e.period}</p>}
                {e.description && (
                  <p className="mt-0.5 whitespace-pre-wrap text-muted">
                    {e.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink">Certificates</h2>
        {certificates.length === 0 ? (
          <p className="mt-1 text-sm text-muted">—</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {certificates.map((c, i) => (
              <li key={i} className="text-muted">
                <span className="text-ink">{c.name || "—"}</span>
                {c.issuer ? ` · ${c.issuer}` : ""}
                {c.year ? ` (${c.year})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default async function MePage() {
  const me = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: files }, { data: feedback }] = await Promise.all([
    supabase
      .from("profiles")
      .select("bio, contact_links, experience, certificates, status, avatar_url")
      .eq("user_id", me.id)
      .maybeSingle(),
    supabase
      .from("files")
      .select("id, name, size, uploaded_at")
      .eq("owner_id", me.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("feedback")
      .select("id, content, created_at")
      .eq("lecturer_id", me.id)
      .eq("is_master", false)
      .order("created_at", { ascending: false }),
  ]);

  const status = (profile?.status ?? "draft") as ProfileStatus;
  const bio = (profile?.bio ?? "") as string;
  const links = (profile?.contact_links ?? {}) as Record<string, string>;
  const experience = asExperience(profile?.experience);
  const certificates = asCertificates(profile?.certificates);
  const avatarPath = (profile?.avatar_url ?? null) as string | null;
  let avatarUrl: string | null = null;
  if (avatarPath) {
    const { data: signed } = await supabase.storage
      .from("lecturer-files")
      .createSignedUrl(avatarPath, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }
  const meInitials = (me.fullName || me.email || "?")
    .split(" ").map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const fileRows = (files ?? []) as FileRow[];
  const feedbackRows = (feedback ?? []) as {
    id: string;
    content: string | null;
    created_at: string;
  }[];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarUploader userId={me.id} currentUrl={avatarUrl} initials={meInitials} />
          <div>
            <h1 className="text-xl font-bold text-ink">{me.fullName || me.email}</h1>
            <p className="mt-1 text-sm text-muted">My profile</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === "draft" ? (
        <ProfileForm
          initialBio={bio}
          initialLinks={links}
          initialExperience={experience}
          initialCertificates={certificates}
        />
      ) : (
        <div className="space-y-4">
          {status === "locked" && (
            <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-white p-4 shadow-card">
              <p className="text-sm text-muted">
                Your profile is submitted and locked. To change it, request an edit.
              </p>
              <RequestEditButton />
            </div>
          )}
          {status === "edit_requested" && (
            <div className="rounded-card border border-niqat/40 bg-niqat-soft p-4">
              <p className="text-sm text-niqat-hover">
                Edit requested — waiting for an admin to reopen your profile.
              </p>
            </div>
          )}
          <ProfileReadOnly
            bio={bio}
            links={links}
            experience={experience}
            certificates={certificates}
          />
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Files</h2>
            <p className="mt-1 text-sm text-muted">
              Upload your deliverables and documents. Uploads are always allowed.
            </p>
          </div>
          <FileUploader userId={me.id} />
        </div>

        {fileRows.length === 0 ? (
          <div className="rounded-card border border-line bg-white p-8 text-center shadow-card">
            <p className="text-sm text-muted">No files yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fileRows.map((f) => (
                  <tr key={f.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{f.name}</td>
                    <td className="px-4 py-3 text-muted">{formatSize(f.size)}</td>
                    <td className="px-4 py-3">
                      <FileRowActions fileId={f.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">My feedback</h2>
          <p className="mt-1 text-sm text-muted">Feedback shared with you by the team.</p>
        </div>
        {feedbackRows.length === 0 ? (
          <div className="rounded-card border border-line bg-card p-8 text-center shadow-card">
            <p className="text-sm text-muted">No feedback yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {feedbackRows.map((f) => (
              <li key={f.id} className="rounded-card border border-line bg-card p-5 shadow-card">
                <p className="whitespace-pre-wrap text-sm text-ink">{f.content}</p>
                <p className="mt-2 text-xs text-faint">
                  {new Date(f.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
