import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`h-10 w-full rounded-card border border-line bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-niqat focus:outline-none ${className}`}
        {...props}
      />
    );
  },
);
