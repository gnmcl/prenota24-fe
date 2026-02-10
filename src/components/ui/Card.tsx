import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
