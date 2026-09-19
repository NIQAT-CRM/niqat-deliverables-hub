import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/app/AppHeader";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-surface">
      <AppHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
