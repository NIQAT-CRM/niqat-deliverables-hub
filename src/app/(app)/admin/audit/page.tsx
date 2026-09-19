import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, target_type, target_id, created_at, actor:actor_id(email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    action: r.action as string,
    target_type: (r.target_type as string) ?? "",
    created_at: r.created_at as string,
    actor:
      (Array.isArray(r.actor) ? (r.actor[0] as { email?: string })?.email : (r.actor as { email?: string })?.email) ??
      "system",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Audit log</h1>
        <p className="mt-1 text-sm text-muted">Append-only record of sensitive actions.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-card p-10 text-center shadow-card">
          <p className="text-sm text-muted">No audit entries yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr className="text-[11px] uppercase tracking-wide text-faint">
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line2 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{r.action}</td>
                  <td className="px-5 py-3 text-muted">{r.target_type || "—"}</td>
                  <td className="px-5 py-3 text-muted">{r.actor}</td>
                  <td className="px-5 py-3 text-xs text-faint">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
