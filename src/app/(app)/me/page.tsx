import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/app/ProfileForm";
import { RequestEditButton } from "@/components/app/RequestEditButton";
import type { ProfileStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  draft: "Draft",
  locked: "Locked",
  edit_requested: "Edit requested",
};

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
  const { data: profile } = await supabase
    .from("profiles")
    .select("bio, contact_links, status")
    .eq("user_id", me.id)
    .maybeSingle();

  const status = (profile?.status ?? "draft") as ProfileStatus;
  const bio = (profile?.bio ?? "") as string;
  const links = (profile?.contact_links ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
    </div>
  );
}
