import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`h-[42px] w-full rounded-control border border-line bg-field px-3 text-sm text-ink placeholder:text-faint focus:border-niqat focus:outline-none ${className}`}
        {...props}
      />
    );
  },
);
