import { ReactNode, HTMLAttributes, Key } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  color?: "purple" | "red" | "green" | "gray";
  className?: string;
  key?: Key;
}

export function Badge({
  children,
  color = "purple",
  className = "",
}: BadgeProps) {
  const colors = {
    purple:
      "bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)]",
    red: "bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)]",
    green: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    gray: "bg-white/10 text-white",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full font-ui font-semibold text-xs tracking-wide uppercase ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
