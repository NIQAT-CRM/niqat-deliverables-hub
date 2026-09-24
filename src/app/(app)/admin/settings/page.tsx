import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamsManager } from "@/components/app/TeamsManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");
  const supabase = await createClient();

  const [{ data: teams }, { data: members }, { data: staff }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("team_members").select("team_id, user_id, users:user_id(full_name, email)"),
    supabase.from("users").select("id, full_name, email, role").in("role", ["admin", "management", "marketing"]),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Teams &amp; permissions</h1>
        <p className="mt-1 text-sm text-muted">Create teams, toggle what each team can do, and add members. Admins always have full access.</p>
      </div>
      <TeamsManager teams={teamRows} staff={(staff ?? []) as { id: string; full_name: string | null; email: string; role: string }[]} />
    </div>
  );
}
