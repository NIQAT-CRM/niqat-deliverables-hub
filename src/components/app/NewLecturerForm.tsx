"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  provisionLecturerAction,
  type ProvisionState,
} from "@/app/(app)/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initial: ProvisionState = { error: null };

export function NewLecturerForm() {
  const [state, action, pending] = useActionState(provisionLecturerAction, initial);

  return (
    <form
      action={action}
      className="space-y-4 rounded-card border border-line bg-white p-6 shadow-card"
    >
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="text-sm font-medium text-ink">
          Full name
        </label>
        <Input id="full_name" name="full_name" placeholder="Jane Doe" required />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jane@niqat.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Initial password
        </label>
        <Input id="password" name="password" type="text" minLength={8} required />
        <p className="text-xs text-muted">
          At least 8 characters. Share it with the lecturer; they can change it after signing in.
        </p>
      </div>

      {state.error && (
        <p className="rounded-card bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add lecturer"}
        </Button>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
