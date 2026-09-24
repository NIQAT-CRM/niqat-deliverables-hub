import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReopenButton } from "@/components/app/ReopenButton";
import { GrantsPanel } from "@/components/app/GrantsPanel";
import { FeedbackSection } from "@/components/app/FeedbackSection";
import { RatingEditor } from "@/components/app/RatingEditor";
import { RatingStars } from "@/components/ui/RatingStars";
import { FileGallery, type GalleryFile } from "@/components/app/FileGallery";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type FileRowD = {
  id: string;
  name: string;
  size: number | null;
  category: string | null;
  uploaded_at: string;
  type: string | null;
  path: string;
  last_downloaded_at: string | null;
  last_downloaded_by: string | null;
};

export default async function LecturerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const canManage = me.role === "admin" || me.role === "management";
  const supabase = await createClient();

  const { data: lecturer } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .eq("id", id)
    .maybeSingle();
  if (!lecturer || lecturer.role !== "lecturer") notFound();

  const [{ data: profile }, { data: files }, { data: feedback }, grantsRes, staffRes, auditRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("bio, contact_links, experience, certificates, status, rating, rating_note")
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("files")
        .select("id, name, size, category, uploaded_at, type, path, last_downloaded_at, last_downloaded_by")
        .eq("owner_id", id)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("feedback")
        .select("id, content, kind, file_path, created_at")
        .eq("lecturer_id", id)
        .eq("is_master", false)
        .order("created_at", { ascending: false }),
      isAdmin
        ? supabase
            .from("grants")
            .select("id, user_id, can_view, can_download, can_delete, can_export, users:user_id(email)")
            .eq("scope_type", "lecturer")
            .eq("scope_id", id)
        : Promise.resolve({ data: [] as unknown[] }),
      isAdmin
        ? supabase.from("users").select("id, full_name, email, role").in("role", ["management", "marketing"])
        : Promise.resolve({ data: [] as unknown[] }),
      isAdmin
        ? supabase.from("audit_log").select("action, created_at").eq("target_id", id).order("created_at", { ascending: false }).limit(5)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

  const status = (profile?.status ?? "draft") as ProfileStatus;
  const rating = (profile?.rating ?? 0) as number;
  const ratingNote = (profile?.rating_note ?? "") as string;
  const bio = (profile?.bio ?? "") as string;
  const links = (profile?.contact_links ?? {}) as Record<string, string>;
  const experience = Array.isArray(profile?.experience) ? (profile!.experience as Record<string, string>[]) : [];
  const certificates = Array.isArray(profile?.certificates) ? (profile!.certificates as Record<string, string>[]) : [];

  const fileRows = (files ?? []) as FileRowD[];
  const downloaderIds = Array.from(new Set(fileRows.map((f) => f.last_downloaded_by).filter(Boolean))) as string[];
  const downloaderName: Record<string, string> = {};
  if (downloaderIds.length > 0) {
    const { data: us } = await supabase.from("users").select("id, full_name, email").in("id", downloaderIds);
    for (const u of (us ?? []) as { id: string; full_name: string | null; email: string }[]) {
      downloaderName[u.id] = u.full_name || u.email;
    }
  }
  const galleryFiles: GalleryFile[] = await Promise.all(
    fileRows.map(async (f) => {
      const isImage = !!f.type && f.type.startsWith("image/");
      let thumbUrl: string | null = null;
      if (isImage) {
        const { data: signed } = await supabase.storage.from("lecturer-files").createSignedUrl(f.path, 3600);
        thumbUrl = signed?.signedUrl ?? null;
      }
      const dl =
        f.last_downloaded_at
          ? `Downloaded ${new Date(f.last_downloaded_at).toLocaleDateString()}${
              f.last_downloaded_by && downloaderName[f.last_downloaded_by] ? ` by ${downloaderName[f.last_downloaded_by]}` : ""
            }`
          : null;
      return {
        id: f.id,
        name: f.name,
        size: f.size,
        category: f.category,
        uploaded_at: f.uploaded_at,
        isImage,
        thumbUrl,
        downloadedLabel: dl,
      };
    }),
  );

  const feedbackRaw = (feedback ?? []) as { id: string; content: string | null; kind: string; file_path: string | null; created_at: string }[];
  const feedbackItems = await Promise.all(
    feedbackRaw.map(async (f) => {
      let fileUrl: string | null = null;
      if (f.file_path) {
        const { data: signed } = await supabase.storage.from("feedback").createSignedUrl(f.file_path, 3600);
        fileUrl = signed?.signedUrl ?? null;
      }
      return { id: f.id, content: f.content, kind: f.kind, created_at: f.created_at, fileUrl, isImage: f.kind === "image" };
    }),
  );
  const grants = ((grantsRes.data ?? []) as Record<string, unknown>[]).map((g) => ({
    id: g.id as string,
    user_id: g.user_id as string,
    email: (Array.isArray(g.users) ? (g.users[0] as { email?: string })?.email : (g.users as { email?: string })?.email) ?? "—",
    can_view: !!g.can_view,
    can_download: !!g.can_download,
    can_delete: !!g.can_delete,
    can_export: !!g.can_export,
  }));
  const staff = (staffRes.data ?? []) as { id: string; full_name: string | null; email: string; role: string }[];
  const audit = (auditRes.data ?? []) as { action: string; created_at: string }[];
  const linkEntries = Object.entries(links).filter(([, v]) => v);

  return (
    <div className="space-y-6">
      <Link href="/admin/lecturers" className="text-sm text-muted hover:text-ink">← Back to instructors</Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-ink">{lecturer.full_name || lecturer.email}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          {(status === "locked" || status === "edit_requested") && isAdmin && <ReopenButton lecturerId={id} />}
          <Link href={`/admin/lecturers/${id}/cv`}><Button variant="secondary">Export CV</Button></Link>
        </div>
      </div>
      <p className="-mt-3 text-sm text-muted">{lecturer.email}</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-5 rounded-card border border-line bg-card p-6 shadow-card">
            <div><h2 className="text-sm font-semibold text-ink">Bio</h2><p className="mt-1 whitespace-pre-wrap text-sm text-muted">{bio || "—"}</p></div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Contact</h2>
              {linkEntries.length === 0 ? <p className="mt-1 text-sm text-muted">—</p> : (
                <ul className="mt-1 space-y-1 text-sm">{linkEntries.map(([k, v]) => (<li key={k} className="text-muted"><span className="capitalize text-ink">{k}:</span> {v}</li>))}</ul>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Experience</h2>
              {experience.length === 0 ? <p className="mt-1 text-sm text-muted">—</p> : (
                <ul className="mt-2 space-y-2 text-sm">{experience.map((e, i) => (
                  <li key={i}><p className="font-medium text-ink">{e.title || "—"}{e.organization ? ` · ${e.organization}` : ""}</p>{e.period && <p className="text-muted">{e.period}</p>}{e.description && <p className="text-muted">{e.description}</p>}</li>
                ))}</ul>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Certificates</h2>
              {certificates.length === 0 ? <p className="mt-1 text-sm text-muted">—</p> : (
                <ul className="mt-2 space-y-1 text-sm text-muted">{certificates.map((c, i) => (<li key={i}><span className="text-ink">{c.name || "—"}</span>{c.issuer ? ` · ${c.issuer}` : ""}{c.year ? ` (${c.year})` : ""}</li>))}</ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-bold text-ink">Files</h2>
            <FileGallery files={galleryFiles} canDelete={isAdmin} />
          </div>

          <FeedbackSection lecturerId={id} items={feedbackItems} canManage={canManage} />
        </div>

        <div className="space-y-6">
          {canManage ? (
            <RatingEditor lecturerId={id} initialRating={rating} initialNote={ratingNote} />
          ) : (
            <div className="space-y-2 rounded-card border border-line bg-card p-6 shadow-card">
              <h2 className="font-bold text-ink">Rating</h2>
              <RatingStars value={rating} size={20} />
              {ratingNote && <p className="text-sm text-muted">{ratingNote}</p>}
            </div>
          )}

          {isAdmin && <GrantsPanel lecturerId={id} staff={staff} grants={grants} />}

          {isAdmin && (
            <div className="rounded-card border border-line bg-card p-6 shadow-card">
              <h2 className="font-bold text-ink">Recent audit</h2>
              {audit.length === 0 ? <p className="mt-2 text-sm text-muted">No entries.</p> : (
                <ul className="mt-3 space-y-2 text-sm">{audit.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-3"><span className="text-ink">{a.action}</span><span className="text-xs text-faint">{new Date(a.created_at).toLocaleDateString()}</span></li>
                ))}</ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
