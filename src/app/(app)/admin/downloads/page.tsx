import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DownloadsReport() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_log")
    .select("id, action, target_id, created_at, actor:actor_id(full_name, email)")
    .in("action", ["download", "share", "export"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Record<string, unknown>[];
  // resolve file names
  const fileIds = Array.from(new Set(rows.map((r) => r.target_id).filter(Boolean))) as string[];
  const fileName: Record<string, string> = {};
  if (fileIds.length) {
    const { data: files } = await supabase.from("files").select("id, name, title").in("id", fileIds);
    for (const f of (files ?? []) as { id: string; name: string; title: string | null }[]) fileName[f.id] = f.title || f.name;
  }
  const ACTION: Record<string, string> = { download: "Download", share: "Share", export: "CV export" };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold text-ink">Downloads &amp; exports</h1><p className="mt-1 text-sm text-muted">Who accessed what, most recent first.</p></div>
      {rows.length === 0 ? (
        <EmptyState title="No activity yet" description="Downloads, shares, and CV exports will be logged here." />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line"><tr className="text-[11px] uppercase tracking-wide text-faint"><th className="px-5 py-3 font-semibold">Action</th><th className="px-5 py-3 font-semibold">File</th><th className="px-5 py-3 font-semibold">By</th><th className="px-5 py-3 font-semibold">When</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const a = Array.isArray(r.actor) ? r.actor[0] : r.actor;
                const by = ((a as { full_name?: string; email?: string })?.full_name || (a as { email?: string })?.email) ?? "—";
                const tid = (r.target_id as string | null) ?? null;
                const fname = (tid && fileName[tid]) || "—";
                return (
                  <tr key={r.id as string} className="border-b border-line2 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{ACTION[r.action as string] ?? (r.action as string)}</td>
                    <td className="px-5 py-3 text-muted">{fname}</td>
                    <td className="px-5 py-3 text-muted">{by}</td>
                    <td className="px-5 py-3 text-xs text-faint">{new Date(r.created_at as string).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
