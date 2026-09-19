import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-ground">
      <Sidebar user={user} />
      <div className="pl-60">
        <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
