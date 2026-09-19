import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  management: "Management",
  marketing: "Marketing",
  lecturer: "Lecturer",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: appUser } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const role = (appUser?.role ?? "lecturer") as UserRole;
  const name = appUser?.full_name || appUser?.email || user.email;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Image
            src="/niqat-logo.png"
            alt="Niqat"
            width={110}
            height={62}
            priority
            className="h-auto w-[96px]"
          />
          <form action={signOutAction}>
            <Button variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-niqat-soft px-2.5 py-1 text-xs font-semibold text-niqat-hover">
              {ROLE_LABEL[role]}
            </span>
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">
            Welcome, {name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            You are signed in to the Niqat Deliverables Hub. Your workspace is
            being built — profile, files, and admin tools arrive next.
          </p>
        </div>
      </main>
    </div>
  );
}
