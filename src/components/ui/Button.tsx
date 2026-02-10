import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 disabled:bg-indigo-400",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400 disabled:bg-gray-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-400",
};

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
