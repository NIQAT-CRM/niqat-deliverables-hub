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
    .select("id, content, created_at")
    .eq("is_master", true)
    .order("created_at", { ascending: false });

  const items = (data ?? []) as { id: string; content: string | null; created_at: string }[];

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
