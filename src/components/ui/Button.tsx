import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-niqat text-white hover:bg-niqat-hover disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "bg-white text-ink border border-line hover:bg-surface disabled:opacity-60",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-surface",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex h-10 items-center justify-center rounded-card px-4 text-sm font-semibold transition-colors ${styles[variant]} ${className}`}
      {...props}
    />
  );
});
