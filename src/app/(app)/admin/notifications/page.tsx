import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MarkAllReadButton } from "@/components/app/MarkAllReadButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  notificationLabel,
  notificationHref,
  notificationIcon,
  timeAgo,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = {
  file: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  reopen: "M23 4v6h-6 M20.49 15a9 9 0 1 1-2.12-9.36L23 10",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
};

function NIcon({ kind }: { kind: string }) {
  const d = ICONS[kind] ?? ICONS.bell;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      {d.split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : "M" + seg} />
      ))}
    </svg>
  );
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";
  const me = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("id, event_type, ref_id, read, created_at")
    .eq("recipient_id", me.id)
    .order("created_at", { ascending: false })
    .limit(80);
  if (unreadOnly) query = query.eq("read", false);

  const { data } = await query;
  const rows = (data ?? []) as {
    id: string;
    event_type: string;
    ref_id: string | null;
    read: boolean;
    created_at: string;
  }[];

  // resolve referenced user names
  const refIds = Array.from(new Set(rows.map((r) => r.ref_id).filter(Boolean))) as string[];
  const nameById: Record<string, string> = {};
  if (refIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", refIds);
    for (const u of (users ?? []) as { id: string; full_name: string | null; email: string }[]) {
      nameById[u.id] = u.full_name || u.email;
    }
  }

  const tab = (label: string, value?: string) => {
    const active = (value ?? "") === (filter ?? "");
    return (
      <Link
        href={value ? `/admin/notifications?filter=${value}` : "/admin/notifications"}
        className={`rounded-control px-3 py-1.5 text-sm font-medium ${
          active ? "bg-niqat-soft text-niqat" : "text-muted hover:text-ink"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
        {rows.some((r) => !r.read) && <MarkAllReadButton />}
      </div>

      <div className="flex items-center gap-1">
        {tab("All")}
        {tab("Unread", "unread")}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={unreadOnly ? "You're all caught up" : "No notifications yet"}
          description={unreadOnly ? undefined : "New uploads and edit requests will show up here."}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <ul>
            {rows.map((n) => {
              const name = (n.ref_id && nameById[n.ref_id]) || "A lecturer";
              const href = notificationHref(n.event_type, n.ref_id);
              const body = (
                <div className={`flex items-center gap-3 px-5 py-4 ${n.read ? "" : "bg-niqat-soft/40"}`}>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      n.read ? "bg-line2 text-muted" : "bg-niqat-soft text-niqat"
                    }`}
                  >
                    <NIcon kind={notificationIcon(n.event_type)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      {!n.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-niqat align-middle" />}
                      {notificationLabel(n.event_type, name)}
                    </p>
                    <p className="text-xs text-faint">{timeAgo(n.created_at)}</p>
                  </div>
                  {href && <span className="text-sm font-medium text-niqat">View →</span>}
                </div>
              );
              return (
                <li key={n.id} className="border-b border-line2 last:border-0">
                  {href ? (
                    <Link href={href} className="block hover:bg-ground/50">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
