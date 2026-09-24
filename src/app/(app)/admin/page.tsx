import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notificationLabel, notificationHref, timeAgo } from "@/lib/notifications";
import { Donut } from "@/components/charts/Donut";
import { Bars } from "@/components/charts/Bars";

export const dynamic = "force-dynamic";

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-card border border-line bg-card p-5 shadow-card transition-all hover:border-niqat/40 hover:shadow-card-hover hover:-translate-y-0.5">
      <p className="text-3xl font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  const me = await requireUser();
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [lecturers, programs, groups, profs, recentFiles, notifs] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "lecturer"),
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("status, rating"),
    supabase.from("files").select("uploaded_at").gte("uploaded_at", since.toISOString()),
    supabase
      .from("notifications")
      .select("id, event_type, ref_id, read, created_at")
      .eq("recipient_id", me.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const profRows = (profs.data ?? []) as { status: string; rating: number | null }[];
  const statusCount = { draft: 0, locked: 0, edit_requested: 0 } as Record<string, number>;
  const ratingCount = [0, 0, 0, 0];
  for (const p of profRows) {
    if (p.status in statusCount) statusCount[p.status]++;
    const r = Math.max(0, Math.min(3, p.rating ?? 0));
    ratingCount[r]++;
  }

  // uploads last 7 days
  const days: { label: string; value: number; key: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      value: 0,
    });
  }
  for (const f of (recentFiles.data ?? []) as { uploaded_at: string }[]) {
    const k = new Date(f.uploaded_at).toISOString().slice(0, 10);
    const day = days.find((x) => x.key === k);
    if (day) day.value++;
  }

  const activity = (notifs.data ?? []) as {
    id: string; event_type: string; ref_id: string | null; read: boolean; created_at: string;
  }[];
  const refIds = Array.from(new Set(activity.map((a) => a.ref_id).filter(Boolean))) as string[];
  const nameById: Record<string, string> = {};
  if (refIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, full_name, email").in("id", refIds);
    for (const u of (users ?? []) as { id: string; full_name: string | null; email: string }[]) {
      nameById[u.id] = u.full_name || u.email;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Welcome back, {me.fullName || me.email}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Instructors" value={lecturers.count ?? 0} href="/admin/lecturers" />
        <StatCard label="Programs" value={programs.count ?? 0} href="/admin/groups" />
        <StatCard label="Groups" value={groups.count ?? 0} href="/admin/groups" />
        <StatCard label="Edit requests" value={statusCount.edit_requested} href="/admin/lecturers" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-card p-6 shadow-card">
          <h2 className="mb-4 font-bold text-ink">Profile status</h2>
          <Donut
            centerLabel={String(profRows.length)}
            segments={[
              { label: "Draft", value: statusCount.draft, color: "#9A9A93" },
              { label: "Locked", value: statusCount.locked, color: "#177245" },
              { label: "Edit requested", value: statusCount.edit_requested, color: "#FF6600" },
            ]}
          />
        </div>

        <div className="rounded-card border border-line bg-card p-6 shadow-card">
          <h2 className="mb-4 font-bold text-ink">Uploads · last 7 days</h2>
          <Bars data={days.map((d) => ({ label: d.label, value: d.value }))} />
        </div>

        <div className="rounded-card border border-line bg-card p-6 shadow-card">
          <h2 className="mb-4 font-bold text-ink">Ratings</h2>
          <Bars
            data={[
              { label: "0★", value: ratingCount[0] },
              { label: "1★", value: ratingCount[1] },
              { label: "2★", value: ratingCount[2] },
              { label: "3★", value: ratingCount[3] },
            ]}
          />
        </div>
      </div>

      <div className="rounded-card border border-line bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-bold text-ink">Recent activity</h2>
          <Link href="/admin/notifications" className="text-sm font-medium text-niqat hover:text-niqat-hover">View all</Link>
        </div>
        {activity.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No activity yet.</p>
        ) : (
          <ul>
            {activity.map((a) => {
              const name = (a.ref_id && nameById[a.ref_id]) || "A lecturer";
              const href = notificationHref(a.event_type, a.ref_id);
              const row = (
                <div className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    {!a.read && <span className="h-2 w-2 rounded-full bg-niqat" />}
                    {notificationLabel(a.event_type, name)}
                  </span>
                  <span className="shrink-0 text-xs text-faint">{timeAgo(a.created_at)}</span>
                </div>
              );
              return (
                <li key={a.id} className="border-b border-line2 last:border-0">
                  {href ? <Link href={href} className="block hover:bg-ground/50">{row}</Link> : row}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
