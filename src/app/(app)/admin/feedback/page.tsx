import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MasterFeedback } from "@/components/app/MasterFeedback";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const me = await requireUser();
  const canManage = me.role === "admin" || me.role === "management";
  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("id, content, kind, file_path, created_at")
    .eq("is_master", true)
    .order("created_at", { ascending: false });

  const raw = (data ?? []) as { id: string; content: string | null; kind: string; file_path: string | null; created_at: string }[];
  const items = await Promise.all(
    raw.map(async (f) => {
      let fileUrl: string | null = null;
      if (f.file_path) {
        const { data: signed } = await supabase.storage.from("feedback").createSignedUrl(f.file_path, 3600);
        fileUrl = signed?.signedUrl ?? null;
      }
      return { id: f.id, content: f.content, kind: f.kind, created_at: f.created_at, fileUrl, isImage: f.kind === "image" };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Management feedback</h1>
        <p className="mt-1 text-sm text-muted">
          Shared notes for the management store. Not visible to lecturers.
        </p>
      </div>
      <MasterFeedback items={items} canManage={canManage} />
    </div>
  );
}
