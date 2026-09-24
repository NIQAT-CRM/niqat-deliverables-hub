import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamsManager } from "@/components/app/TeamsManager";
import { RoleManager } from "@/components/app/RoleManager";
import type { UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");
  const supabase = await createClient();

  const [{ data: teams }, { data: members }, { data: staff }, { data: allUsers }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("team_members").select("team_id, user_id, users:user_id(full_name, email)"),
    supabase.from("users").select("id, full_name, email, role").in("role", ["admin", "management", "marketing"]),
    supabase.from("users").select("id, full_name, email, role").is("archived_at", null).order("role"),
  ]);

  const membersByTeam: Record<string, { user_id: string; name: string }[]> = {};
  for (const m of (members ?? []) as Record<string, unknown>[]) {
    const tid = m.team_id as string;
    const u = Array.isArray(m.users) ? m.users[0] : m.users;
    const name = (u as { full_name?: string; email?: string })?.full_name || (u as { email?: string })?.email || "—";
    (membersByTeam[tid] ||= []).push({ user_id: m.user_id as string, name });
  }
  const teamRows = ((teams ?? []) as Record<string, unknown>[]).map((t) => ({ ...(t as object), id: t.id as string, name: t.name as string, members: membersByTeam[t.id as string] ?? [] })) as never[];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Teams, access, and system configuration.</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Teams &amp; permissions</h2>
          <p className="mt-1 text-sm text-muted">Create teams, toggle what each team can do, and add members. Admins always have full access.</p>
        </div>
        <TeamsManager teams={teamRows} staff={(staff ?? []) as { id: string; full_name: string | null; email: string; role: string }[]} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Team access (roles)</h2>
          <p className="mt-1 text-sm text-muted">Set what a person is across the system — including promoting someone to admin. You can&apos;t change your own role.</p>
        </div>
        <RoleManager users={(allUsers ?? []) as { id: string; full_name: string | null; email: string; role: UserRole }[]} meId={me.id} />
      </section>

      <section className="space-y-4">
        <div><h2 className="text-lg font-bold text-ink">System</h2></div>
        <div className="space-y-3 rounded-card border border-line bg-card p-6 text-sm shadow-card">
          <p className="text-ink"><span className="font-semibold">Leaked password protection:</span> <span className="text-muted">enable in Supabase → Authentication → Policies (checks passwords against HaveIBeenPwned).</span></p>
          <p className="text-ink"><span className="font-semibold">Email (SMTP):</span> <span className="text-muted">configure in Supabase → Authentication → SMTP to enable email notifications and email invites.</span></p>
          <p className="text-ink"><span className="font-semibold">File limit:</span> <span className="text-muted">50&nbsp;MB per file (private storage).</span></p>
        </div>
      </section>
    </div>
  );
}
