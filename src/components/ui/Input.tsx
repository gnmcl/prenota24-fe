import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Make the label visually hidden while keeping it accessible */
  srOnlyLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, srOnlyLabel = false, id, className = "", ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className={
            srOnlyLabel
              ? "sr-only"
              : "text-sm font-medium text-gray-700"
          }
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${error ? "border-red-400 ring-1 ring-red-400" : "border-gray-300"}
            ${className}`}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
