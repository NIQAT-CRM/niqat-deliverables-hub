import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MeHome() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">
          Welcome, {user.fullName || user.email}
        </h1>
        <p className="mt-1 text-sm text-muted">
          This is your workspace in the Niqat Deliverables Hub.
        </p>
      </div>
      <div className="rounded-card border border-line bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink">My profile</h2>
        <p className="mt-1 text-sm text-muted">
          Filling in your bio, experience, and certificates — and uploading files —
          arrives in the next step.
        </p>
      </div>
    </div>
  );
}
