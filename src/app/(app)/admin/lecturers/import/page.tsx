import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ImportLecturers } from "@/components/app/ImportLecturers";

export const dynamic = "force-dynamic";

export default async function ImportLecturersPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Back to lecturers
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">Import lecturers from CSV</h1>
        <p className="mt-1 text-sm text-muted">
          Add multiple lecturer accounts at once. They can sign in with the email and
          password from each row.
        </p>
      </div>
      <ImportLecturers />
    </div>
  );
}
