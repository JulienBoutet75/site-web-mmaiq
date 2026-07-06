import { ReactNode, HTMLAttributes, Key } from "react";
import { motion } from "motion/react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  key?: Key;
}

export function Card({
  children,
  className = "",
  hoverEffect = true,
}: CardProps) {
  return (
    <div
      className={`bg-[var(--color-card-bg)] border border-[var(--color-border-dark)] rounded-2xl overflow-hidden transition-all duration-300 ${
        hoverEffect
          ? "hover:border-[var(--color-accent-purple)] hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(123,47,255,0.2)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
