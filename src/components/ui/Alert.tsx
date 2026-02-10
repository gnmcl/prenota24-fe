interface AlertProps {
  variant: "error" | "success" | "info";
  message: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertProps["variant"], string> = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-green-50 border-green-200 text-green-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function Alert({ variant, message, onDismiss }: AlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between rounded-lg border px-4 py-3 text-sm ${variantStyles[variant]}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-4 font-medium underline hover:no-underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
