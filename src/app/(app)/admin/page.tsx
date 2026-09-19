import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  file_uploaded: "New file uploaded",
  edit_requested: "Profile edit requested",
  profile_reopened: "Profile reopened",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-card border border-line bg-card p-5 shadow-card transition-colors hover:border-niqat/40">
      <p className="text-3xl font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  const me = await requireUser();
  const supabase = await createClient();

  const [lecturers, programs, groups, editReq, notifs] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "edit_requested"),
    supabase
      .from("notifications")
      .select("id, event_type, ref_id, read, created_at")
      .eq("recipient_id", me.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const activity = (notifs.data ?? []) as {
    id: string;
    event_type: string;
    ref_id: string | null;
    read: boolean;
    created_at: string;
  }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Welcome back, {me.fullName || me.email}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lecturers" value={lecturers.count ?? 0} href="/admin/lecturers" />
        <StatCard label="Programs" value={programs.count ?? 0} href="/admin/groups" />
        <StatCard label="Groups" value={groups.count ?? 0} href="/admin/groups" />
        <StatCard label="Edit requests" value={editReq.count ?? 0} href="/admin/lecturers" />
      </div>

      <div className="rounded-card border border-line bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-bold text-ink">Recent activity</h2>
          <Link href="/admin/notifications" className="text-sm font-medium text-niqat hover:text-niqat-hover">
            View all
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No activity yet.</p>
        ) : (
          <ul>
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 border-b border-line2 px-5 py-3 last:border-0"
              >
                <span className="flex items-center gap-2 text-sm text-ink">
                  {!a.read && <span className="h-2 w-2 rounded-full bg-niqat" />}
                  {EVENT_LABEL[a.event_type] ?? a.event_type}
                </span>
                <span className="text-xs text-faint">{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
