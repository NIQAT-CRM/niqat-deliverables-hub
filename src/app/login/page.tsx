"use client";

import Image from "next/image";
import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initial: SignInState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/niqat-logo.png"
            alt="Niqat"
            width={150}
            height={85}
            priority
            className="h-auto w-[130px]"
          />
        </div>

        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <h1 className="text-lg font-bold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Access the Niqat Deliverables Hub.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@niqat.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {state.error && (
              <p className="rounded-card bg-niqat-soft px-3 py-2 text-sm text-niqat-hover">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Niqat — Beyond Education
        </p>
      </div>
    </main>
  );
}
