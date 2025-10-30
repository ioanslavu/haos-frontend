import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormProgressProps {
  steps: {
    label: string;
    description?: string;
  }[];
  currentStep: number;
  className?: string;
}

/**
 * FormProgress Component
 *
 * Displays progress through a multi-step form with visual indicators.
 * Helps users understand where they are in the process and reduces cognitive load.
 *
 * @example
 * ```tsx
 * <FormProgress
 *   steps={[
 *     { label: "Basic Info", description: "Name and contact" },
 *     { label: "Details", description: "Additional information" },
 *     { label: "Review", description: "Confirm your submission" }
 *   ]}
 *   currentStep={0}
 * />
 * ```
 */
export function FormProgress({ steps, currentStep, className }: FormProgressProps) {
  const totalSteps = steps.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-foreground">
            Step {currentStep + 1} of {totalSteps}
          </p>
          <p className="text-sm text-muted-foreground">
            {Math.round(progressPercent)}% Complete
          </p>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="hidden md:flex items-start justify-between gap-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white",
                  isCurrent && "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
                  isPending && "border-muted bg-background text-muted-foreground"
                )}
                aria-label={
                  isCompleted
                    ? `Step ${index + 1}: ${step.label} - Completed`
                    : isCurrent
                    ? `Step ${index + 1}: ${step.label} - Current step`
                    : `Step ${index + 1}: ${step.label} - Pending`
                }
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent && "text-blue-600 dark:text-blue-400",
                    isCompleted && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 -translate-y-1/2"
                  style={{
                    background: isCompleted
                      ? "linear-gradient(to right, #3b82f6, #9333ea)"
                      : "#e5e7eb",
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Current Step Only */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-muted">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0",
              "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
            )}
            aria-hidden="true"
          >
            <span className="text-sm font-semibold">{currentStep + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {steps[currentStep].label}
            </p>
            {steps[currentStep].description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {steps[currentStep].description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
