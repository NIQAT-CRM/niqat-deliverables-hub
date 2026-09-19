export const dynamic = "force-dynamic";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Staff workspace</h1>
        <p className="mt-1 text-sm text-muted">
          Manage lecturers, review deliverables, and oversee the hub.
        </p>
      </div>
      <div className="rounded-card border border-line bg-white p-6 shadow-card">
        <h2 className="text-sm font-semibold text-ink">Lecturers</h2>
        <p className="mt-1 text-sm text-muted">
          Adding lecturers, CSV import, and reviewing profiles arrive in the next step.
        </p>
      </div>
    </div>
  );
}
