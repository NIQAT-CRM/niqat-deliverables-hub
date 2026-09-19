import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { NewLecturerForm } from "@/components/app/NewLecturerForm";

export const dynamic = "force-dynamic";

export default async function NewLecturerPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/admin");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Back to lecturers
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink">Add lecturer</h1>
        <p className="mt-1 text-sm text-muted">
          Create a lecturer account. They can sign in right away with the email and
          initial password you set.
        </p>
      </div>
      <NewLecturerForm />
    </div>
  );
}
