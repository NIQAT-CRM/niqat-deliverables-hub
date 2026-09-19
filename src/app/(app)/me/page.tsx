import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/app/ProfileForm";
import { RequestEditButton } from "@/components/app/RequestEditButton";
import { FileUploader } from "@/components/app/FileUploader";
import { FileRowActions } from "@/components/app/FileRowActions";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  draft: "Draft",
  locked: "Locked",
  edit_requested: "Edit requested",
};

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

function ProfileReadOnly({
  bio,
  links,
}: {
  bio: string;
  links: Record<string, string>;
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
    </div>
  );
}

export default async function MePage() {
  const me = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: files }] = await Promise.all([
    supabase
      .from("profiles")
      .select("bio, contact_links, status")
      .eq("user_id", me.id)
      .maybeSingle(),
    supabase
      .from("files")
      .select("id, name, size, uploaded_at")
      .eq("owner_id", me.id)
      .order("uploaded_at", { ascending: false }),
  ]);

  const status = (profile?.status ?? "draft") as ProfileStatus;
  const bio = (profile?.bio ?? "") as string;
  const links = (profile?.contact_links ?? {}) as Record<string, string>;
  const fileRows = (files ?? []) as FileRow[];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">My profile</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {me.fullName || me.email}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-niqat-soft px-2.5 py-1 text-xs font-semibold text-niqat-hover">
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === "draft" ? (
        <ProfileForm initialBio={bio} initialLinks={links} />
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
            <div className="rounded-card border border-niqat-ring bg-niqat-soft p-4">
              <p className="text-sm text-niqat-hover">
                Edit requested — waiting for an admin to reopen your profile.
              </p>
            </div>
          )}
          <ProfileReadOnly bio={bio} links={links} />
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
    </div>
  );
}
