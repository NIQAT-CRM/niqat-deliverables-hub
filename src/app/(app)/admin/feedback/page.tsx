import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssetGrid } from "@/components/app/AssetGrid";
import { toAssetItems, type FileRowLike } from "@/lib/asset-view";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const supabase = await createClient();

  const [{ data: files }, { data: progs }, { data: lecturers }] = await Promise.all([
    supabase.from("files").select("id, name, title, asset_kind, source, link_url, type, path, program_id, owner_id, uploaded_at").eq("asset_kind", "feedback_proof").order("uploaded_at", { ascending: false }),
    supabase.from("programs").select("id, name"),
    supabase.from("users").select("id, full_name, email").eq("role", "lecturer"),
  ]);
  const programNames: Record<string, string> = {};
  for (const p of (progs ?? []) as { id: string; name: string }[]) programNames[p.id] = p.name;
  const lecturerNames: Record<string, string> = {};
  for (const l of (lecturers ?? []) as { id: string; full_name: string | null; email: string }[]) lecturerNames[l.id] = l.full_name || l.email;

  const items = await toAssetItems(supabase, (files ?? []) as FileRowLike[], { programNames, lecturerNames });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Feedback</h1>
        <p className="mt-1 text-sm text-muted">Feedback proof across all instructors. Add feedback from an instructor&apos;s profile.</p>
      </div>
      <AssetGrid items={items} canDelete={isAdmin} showLecturer />
    </div>
  );
}
