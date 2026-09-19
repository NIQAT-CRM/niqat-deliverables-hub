"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { isStaff, type UserRole } from "@/lib/types";
import type { CurrentUser } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  management: "Management",
  marketing: "Marketing",
  lecturer: "Lecturer",
};

type NavItem = { href: string; label: string; icon: React.ReactNode };

const iconUsers = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const iconUser = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const iconLogout = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const staff = isStaff(user.role);

  const nav: NavItem[] = staff
    ? [{ href: "/admin", label: "Lecturers", icon: iconUsers }]
    : [{ href: "/me", label: "My Profile", icon: iconUser }];

  const initials = (user.fullName || user.email || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-sidebar text-white/80">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image
          src="/niqat-icon.png"
          alt=""
          width={30}
          height={30}
          className="rounded-md"
        />
        <span className="text-[17px] font-extrabold tracking-tight text-white">Niqat</span>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-niqat-tint text-niqat"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-niqat text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName || user.email}
            </p>
            <p className="truncate text-xs text-white/50">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            {iconLogout}
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
