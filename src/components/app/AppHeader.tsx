import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { isStaff, type UserRole } from "@/lib/types";
import type { CurrentUser } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  management: "Management",
  marketing: "Marketing",
  lecturer: "Lecturer",
};

export function AppHeader({ user }: { user: CurrentUser }) {
  const staff = isStaff(user.role);
  const home = staff ? "/admin" : "/me";
  const nav = staff
    ? [{ href: "/admin", label: "Lecturers" }]
    : [{ href: "/me", label: "My Profile" }];

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href={home} aria-label="Niqat Deliverables Hub">
            <Image
              src="/niqat-logo.png"
              alt="Niqat"
              width={96}
              height={54}
              priority
              className="h-auto w-[84px]"
            />
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-card px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">
            {user.fullName || user.email}
          </span>
          <span className="inline-flex items-center rounded-full bg-niqat-soft px-2.5 py-1 text-xs font-semibold text-niqat-hover">
            {ROLE_LABEL[user.role]}
          </span>
          <form action={signOutAction}>
            <Button variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
