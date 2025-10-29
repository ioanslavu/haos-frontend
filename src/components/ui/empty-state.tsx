/**
 * Modern Empty State Component - 2025 Edition
 *
 * Features:
 * - Illustrated icons with animations
 * - Contextual messaging
 * - Action-oriented CTAs
 * - Multiple variants for different scenarios
 * - Onboarding tips
 * - Sample data options
 */

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  // Visual
  icon?: LucideIcon
  illustration?: React.ReactNode
  title: string
  description?: string

  // Actions
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }

  // Additional content
  children?: React.ReactNode

  // Styling
  className?: string
  compact?: boolean

  // Features
  showSampleDataOption?: boolean
  onLoadSampleData?: () => void

  // Onboarding
  tips?: string[]
}

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  className,
  compact = false,
  showSampleDataOption = false,
  onLoadSampleData,
  tips,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
      role="status"
      aria-label="Empty state"
    >
      {/* Icon or Illustration */}
      <div className={cn(
        "mb-4 rounded-full bg-muted/50 p-6 transition-smooth hover:bg-muted",
        !compact && "mb-6"
      )}>
        {illustration ? (
          illustration
        ) : Icon ? (
          <Icon className={cn(
            "text-muted-foreground",
            compact ? "h-10 w-10" : "h-16 w-16"
          )} />
        ) : (
          // Default placeholder icon
          <div className={cn(
            "rounded-full bg-muted",
            compact ? "h-10 w-10" : "h-16 w-16"
          )} />
        )}
      </div>

      {/* Title */}
      <h3 className={cn(
        "font-semibold text-foreground",
        compact ? "text-base mb-1" : "text-lg mb-2"
      )}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm",
          compact ? "text-xs mb-4" : "text-sm mb-6"
        )}>
          {description}
        </p>
      )}

      {/* Onboarding Tips */}
      {tips && tips.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 max-w-md">
          <p className="text-sm font-medium text-foreground mb-2">
            💡 Quick Tips
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 text-left">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className="gap-2"
            size={compact ? "sm" : "default"}
          >
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
            {primaryAction.label}
          </Button>
        )}

        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="gap-2"
            size={compact ? "sm" : "default"}
          >
            {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
            {secondaryAction.label}
          </Button>
        )}
      </div>

      {/* Sample Data Option */}
      {showSampleDataOption && onLoadSampleData && (
        <div className="mt-6 pt-6 border-t border-border max-w-md">
          <p className="text-xs text-muted-foreground mb-3">
            Want to explore the interface?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadSampleData}
            className="text-xs"
          >
            Load Sample Data
          </Button>
        </div>
      )}

      {/* Custom Content */}
      {children && (
        <div className="mt-6 max-w-2xl">
          {children}
        </div>
      )}
    </div>
  )
}

// Preset Empty States for Common Scenarios

export interface PresetEmptyStateProps {
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  onLoadSampleData?: () => void
  showSampleDataOption?: boolean
  compact?: boolean
}

/**
 * Empty state for lists with no items
 */
export function NoItemsEmptyState({
  onPrimaryAction,
  compact,
}: PresetEmptyStateProps & { itemName: string; itemNamePlural?: string }) {
  return (
    <EmptyState
      icon={React.lazy(() => import("lucide-react").then((m) => ({ default: m.Inbox })))}
      title="No items yet"
      description="Get started by creating your first item."
      compact={compact}
      primaryAction={
        onPrimaryAction
          ? {
              label: "Create Item",
              onClick: onPrimaryAction,
            }
          : undefined
      }
    />
  )
}

// Export specific preset types
export { FileText, Users, Inbox, Search, Filter, Database } from "lucide-react"
