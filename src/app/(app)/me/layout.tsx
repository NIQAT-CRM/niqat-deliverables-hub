import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isStaff } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (isStaff(user.role)) redirect("/admin");
  return <>{children}</>;
}
