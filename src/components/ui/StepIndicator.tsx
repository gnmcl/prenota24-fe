interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Setup progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;

          return (
            <li key={step} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
                  ${isCompleted ? "bg-indigo-600 text-white" : ""}
                  ${isActive ? "border-2 border-indigo-600 text-indigo-600" : ""}
                  ${!isActive && !isCompleted ? "border border-gray-300 text-gray-400" : ""}`}
              >
                {isCompleted ? "✓" : idx + 1}
              </span>
              <span
                className={`text-sm font-medium ${isActive ? "text-indigo-600" : isCompleted ? "text-gray-700" : "text-gray-400"}`}
              >
                {step}
              </span>
              {idx < steps.length - 1 && (
                <span className="mx-2 h-px w-8 bg-gray-300" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
