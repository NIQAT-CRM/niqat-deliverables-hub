import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("read", false);

  return (
    <div className="min-h-screen bg-ground">
      <Sidebar user={user} unread={count ?? 0} />
      <div className="pl-60">
        <main className="w-full px-6 py-10 md:px-10">{children}</main>
      </div>
    </div>
  );
}
