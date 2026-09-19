import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MarkAllReadButton } from "@/components/app/MarkAllReadButton";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  file_uploaded: "New file uploaded by a lecturer",
  edit_requested: "A lecturer requested a profile edit",
  profile_reopened: "A profile was reopened",
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function NotificationsPage() {
  const me = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, event_type, read, created_at")
    .eq("recipient_id", me.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as { id: string; event_type: string; read: boolean; created_at: string }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
        {rows.some((r) => !r.read) && <MarkAllReadButton />}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-10 text-center shadow-card">
          <p className="text-sm text-muted">No notifications.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <ul>
            {rows.map((n) => (
              <li
                key={n.id}
                className={`flex items-center justify-between gap-4 border-b border-line2 px-5 py-4 last:border-0 ${
                  n.read ? "" : "bg-niqat-soft/40"
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-niqat" />}
                  {EVENT_LABEL[n.event_type] ?? n.event_type}
                </span>
                <span className="text-xs text-faint">{timeAgo(n.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
