import React, { ReactNode, ButtonHTMLAttributes } from "react";
import { motion } from "motion/react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "red";
  children: ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-ui font-semibold rounded-[10px] px-8 py-3.5 transition-all duration-300 inline-flex items-center justify-center text-center";

  const variants = {
    primary:
      "bg-gradient-to-r from-[var(--color-accent-purple)] to-[var(--color-accent-magenta)] text-white shadow-[0_0_20px_rgba(160,32,240,0.3)] hover:shadow-[0_0_30px_rgba(160,32,240,0.5)] hover:-translate-y-0.5",
    red: "bg-gradient-to-r from-[var(--color-accent-red)] to-[#ff4d5e] text-white shadow-[0_0_20px_rgba(230,41,58,0.3)] hover:shadow-[0_0_30px_rgba(230,41,58,0.5)] hover:-translate-y-0.5",
    secondary:
      "bg-[var(--color-card-bg)] border border-[var(--color-border-dark)] text-white hover:border-[var(--color-accent-purple)] hover:-translate-y-0.5",
    outline:
      "bg-transparent border border-[var(--color-border-dark)] text-white hover:border-[var(--color-accent-purple)] hover:text-white hover:-translate-y-0.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
