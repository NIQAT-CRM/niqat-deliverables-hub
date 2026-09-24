import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/app/ProfileForm";
import { RequestEditButton } from "@/components/app/RequestEditButton";
import { FileUploader } from "@/components/app/FileUploader";
import { FileGallery, type GalleryFile } from "@/components/app/FileGallery";
import { AvatarUploader } from "@/components/app/AvatarUploader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RatingStars } from "@/components/ui/RatingStars";
import type { ExperienceEntry, CertificateEntry } from "@/app/(app)/me/actions";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type FileRow = {
  id: string;
  name: string;
  size: number | null;
  uploaded_at: string;
  category: string | null;
  type: string | null;
  path: string;
};

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

function ProfileReadOnly({ bio, links, experience, certificates }: { bio: string; links: Record<string, string>; experience: ExperienceEntry[]; certificates: CertificateEntry[]; }) {
  const entries = Object.entries(links).filter(([, v]) => v);
  return (
    <div className="space-y-5 rounded-card border border-line bg-card p-6 shadow-card">
      <div><h2 className="text-sm font-semibold text-ink">Bio</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted">{bio || "—"}</p></div>
      <div>
        <h2 className="text-sm font-semibold text-ink">Contact links</h2>
        {entries.length === 0 ? <p className="mt-1 text-sm text-muted">—</p> : (
          <ul className="mt-1 space-y-1 text-sm">{entries.map(([k, v]) => (<li key={k} className="text-muted"><span className="capitalize text-ink">{k}:</span> {v}</li>))}</ul>
        )}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-ink">Experience</h2>
        {experience.length === 0 ? <p className="mt-1 text-sm text-muted">—</p> : (
          <ul className="mt-2 space-y-2 text-sm">{experience.map((e, i) => (<li key={i}><p className="font-medium text-ink">{e.title || "—"}{e.organization ? ` · ${e.organization}` : ""}</p>{e.period && <p className="text-muted">{e.period}</p>}{e.description && <p className="text-muted">{e.description}</p>}</li>))}</ul>
        )}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-ink">Certificates</h2>
        {certificates.length === 0 ? <p className="mt-1 text-sm text-muted">—</p> : (
          <ul className="mt-2 space-y-1 text-sm text-muted">{certificates.map((c, i) => (<li key={i}><span className="text-ink">{c.name || "—"}</span>{c.issuer ? ` · ${c.issuer}` : ""}{c.year ? ` (${c.year})` : ""}</li>))}</ul>
        )}
      </div>
    </div>
  );
}

export default async function MePage() {
  const me = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: files }, { data: feedback }] = await Promise.all([
    supabase.from("profiles").select("bio, contact_links, experience, certificates, status, avatar_url, rating, rating_note").eq("user_id", me.id).maybeSingle(),
    supabase.from("files").select("id, name, size, uploaded_at, category, type, path").eq("owner_id", me.id).order("uploaded_at", { ascending: false }),
    supabase.from("feedback").select("id, content, created_at").eq("lecturer_id", me.id).eq("is_master", false).order("created_at", { ascending: false }),
  ]);

  const status = (profile?.status ?? "draft") as ProfileStatus;
  const rating = (profile?.rating ?? 0) as number;
  const ratingNote = (profile?.rating_note ?? "") as string;
  const bio = (profile?.bio ?? "") as string;
  const links = (profile?.contact_links ?? {}) as Record<string, string>;
  const experience = asExperience(profile?.experience);
  const certificates = asCertificates(profile?.certificates);

  const avatarPath = (profile?.avatar_url ?? null) as string | null;
  let avatarUrl: string | null = null;
  if (avatarPath) {
    const { data: signed } = await supabase.storage.from("lecturer-files").createSignedUrl(avatarPath, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }
  const meInitials = (me.fullName || me.email || "?").split(" ").map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const { data: lp } = await supabase.from("lecturer_programs").select("program_id").eq("lecturer_id", me.id);
  const programIds = ((lp ?? []) as { program_id: string }[]).map((r) => r.program_id);
  let mutualGroups: { id: string; name: string }[] = [];
  if (programIds.length > 0) {
    const { data: g } = await supabase.from("groups").select("id, name").eq("mutual_access", true).in("program_id", programIds);
    mutualGroups = (g ?? []) as { id: string; name: string }[];
  }

  const fileRows = (files ?? []) as FileRow[];
  const galleryFiles: GalleryFile[] = await Promise.all(
    fileRows.map(async (f) => {
      const isImage = !!f.type && f.type.startsWith("image/");
      let thumbUrl: string | null = null;
      if (isImage) {
        const { data: signed } = await supabase.storage.from("lecturer-files").createSignedUrl(f.path, 3600);
        thumbUrl = signed?.signedUrl ?? null;
      }
      return { id: f.id, name: f.name, size: f.size, category: f.category, uploaded_at: f.uploaded_at, isImage, thumbUrl };
    }),
  );

  const feedbackRows = (feedback ?? []) as { id: string; content: string | null; created_at: string }[];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarUploader userId={me.id} currentUrl={avatarUrl} initials={meInitials} />
          <div><h1 className="text-xl font-bold text-ink">{me.fullName || me.email}</h1><p className="mt-1 text-sm text-muted">My profile</p></div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card p-5 shadow-card">
        <div>
          <p className="text-sm font-semibold text-ink">Your rating</p>
          <p className="mt-0.5 text-sm text-muted">{ratingNote || (rating > 0 ? "Rated by the team." : "Not rated yet.")}</p>
        </div>
        <RatingStars value={rating} size={22} />
      </div>

      {status === "draft" ? (
        <ProfileForm initialBio={bio} initialLinks={links} initialExperience={experience} initialCertificates={certificates} />
      ) : (
        <div className="space-y-4">
          {status === "locked" && (
            <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-4 shadow-card">
              <p className="text-sm text-muted">Your profile is submitted and locked. To change it, request an edit.</p>
              <RequestEditButton />
            </div>
          )}
          {status === "edit_requested" && (
            <div className="rounded-card border border-niqat/40 bg-niqat-soft p-4"><p className="text-sm text-niqat-hover">Edit requested — waiting for an admin to reopen your profile.</p></div>
          )}
          <ProfileReadOnly bio={bio} links={links} experience={experience} certificates={certificates} />
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold text-ink">Files</h2><p className="mt-1 text-sm text-muted">Choose a type, then upload. Uploads are always allowed.</p></div>
          <FileUploader userId={me.id} groups={mutualGroups} />
        </div>
        <FileGallery files={galleryFiles} canDelete />
      </section>

      <section className="space-y-4">
        <div><h2 className="text-lg font-bold text-ink">My feedback</h2><p className="mt-1 text-sm text-muted">Feedback shared with you by the team.</p></div>
        {feedbackRows.length === 0 ? (
          <div className="rounded-card border border-line bg-card p-8 text-center shadow-card"><p className="text-sm text-muted">No feedback yet.</p></div>
        ) : (
          <ul className="space-y-3">{feedbackRows.map((f) => (<li key={f.id} className="rounded-card border border-line bg-card p-5 shadow-card"><p className="whitespace-pre-wrap text-sm text-ink">{f.content}</p><p className="mt-2 text-xs text-faint">{new Date(f.created_at).toLocaleDateString()}</p></li>))}</ul>
        )}
      </section>
    </div>
  );
}
