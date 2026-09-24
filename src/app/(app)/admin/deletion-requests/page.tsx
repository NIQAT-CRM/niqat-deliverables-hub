import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DeletionQueueActions } from "@/components/app/DeletionQueueActions";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DeletionRequests() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("deletion_requests")
    .select("id, status, created_at, file:file_id(name, title), requester:requested_by(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => {
    const f = Array.isArray(r.file) ? r.file[0] : r.file;
    const u = Array.isArray(r.requester) ? r.requester[0] : r.requester;
    return {
      id: r.id as string,
      created_at: r.created_at as string,
      fileName: ((f as { title?: string; name?: string })?.title || (f as { name?: string })?.name) ?? "(deleted)",
      requester: ((u as { full_name?: string; email?: string })?.full_name || (u as { email?: string })?.email) ?? "—",
    };
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold text-ink">Deletion requests</h1><p className="mt-1 text-sm text-muted">{rows.length} pending</p></div>
      {rows.length === 0 ? (
        <EmptyState title="No pending requests" description="Instructor deletion requests will appear here for review." />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line"><tr className="text-[11px] uppercase tracking-wide text-faint"><th className="px-5 py-3 font-semibold">File</th><th className="px-5 py-3 font-semibold">Requested by</th><th className="px-5 py-3 font-semibold">When</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line2 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{r.fileName}</td>
                  <td className="px-5 py-3 text-muted">{r.requester}</td>
                  <td className="px-5 py-3 text-xs text-faint">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3"><div className="flex justify-end"><DeletionQueueActions requestId={r.id} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
