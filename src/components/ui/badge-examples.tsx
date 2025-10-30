/**
 * Modern Badge System - 2025 Edition
 *
 * Enhanced badge component with:
 * - Semantic color variants (success, warning, info, destructive)
 * - Color-blind friendly design with icon support
 * - Multiple styles (solid, outline, subtle)
 * - Size variants (sm, default, lg)
 * - Animated badges for real-time updates
 * - AI-themed variants
 * - Accessibility support (ARIA roles)
 */

import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Sparkles,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

/**
 * Status Badge Helper
 * Automatically applies the right icon and variant for common statuses
 */
export function StatusBadge({
  status,
  variant = "solid",
}: {
  status:
    | "active"
    | "inactive"
    | "pending"
    | "completed"
    | "failed"
    | "processing"
    | "draft"
    | "signed"
    | "cancelled"
  variant?: "solid" | "outline" | "subtle"
}) {
  const statusConfig: Record<
    typeof status,
    { label: string; icon: typeof CheckCircle2; badgeVariant: any; ariaLabel: string }
  > = {
    active: {
      label: "Active",
      icon: CheckCircle2,
      badgeVariant: variant === "outline" ? "outline-success" : variant === "subtle" ? "subtle-success" : "success",
      ariaLabel: "Status: Active",
    },
    inactive: {
      label: "Inactive",
      icon: Minus,
      badgeVariant: variant === "outline" ? "outline" : variant === "subtle" ? "subtle" : "secondary",
      ariaLabel: "Status: Inactive",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      badgeVariant: variant === "outline" ? "outline-warning" : variant === "subtle" ? "subtle-warning" : "warning",
      ariaLabel: "Status: Pending - awaiting action",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      badgeVariant: variant === "outline" ? "outline-success" : variant === "subtle" ? "subtle-success" : "success",
      ariaLabel: "Status: Completed successfully",
    },
    failed: {
      label: "Failed",
      icon: XCircle,
      badgeVariant: variant === "outline" ? "outline-destructive" : variant === "subtle" ? "subtle-destructive" : "destructive",
      ariaLabel: "Status: Failed - action required",
    },
    processing: {
      label: "Processing",
      icon: Zap,
      badgeVariant: variant === "outline" ? "outline-info" : variant === "subtle" ? "subtle-info" : "info",
      ariaLabel: "Status: Processing - in progress",
    },
    draft: {
      label: "Draft",
      icon: Info,
      badgeVariant: variant === "outline" ? "outline" : variant === "subtle" ? "subtle" : "secondary",
      ariaLabel: "Status: Draft - not finalized",
    },
    signed: {
      label: "Signed",
      icon: CheckCircle2,
      badgeVariant: variant === "outline" ? "outline-success" : variant === "subtle" ? "subtle-success" : "success",
      ariaLabel: "Status: Signed - all signatures received",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      badgeVariant: variant === "outline" ? "outline" : variant === "subtle" ? "subtle" : "secondary",
      ariaLabel: "Status: Cancelled",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.badgeVariant} icon={config.icon} aria-label={config.ariaLabel}>
      {config.label}
    </Badge>
  )
}

/**
 * Trend Badge Helper
 * Shows percentage changes with trend indicators
 */
export function TrendBadge({
  value,
  variant = "subtle",
}: {
  value: number
  variant?: "solid" | "outline" | "subtle"
}) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const badgeVariant = isPositive
    ? variant === "outline"
      ? "outline-success"
      : variant === "subtle"
      ? "subtle-success"
      : "success"
    : isNegative
    ? variant === "outline"
      ? "outline-destructive"
      : variant === "subtle"
      ? "subtle-destructive"
      : "destructive"
    : variant === "outline"
    ? "outline"
    : variant === "subtle"
    ? "subtle"
    : "secondary"

  const icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  const ariaLabel = isPositive
    ? `Increased by ${value.toFixed(1)} percent`
    : isNegative
    ? `Decreased by ${Math.abs(value).toFixed(1)} percent`
    : "No change"

  return (
    <Badge variant={badgeVariant} icon={icon} size="sm" aria-label={ariaLabel}>
      {isPositive && "+"}
      {value.toFixed(1)}%
    </Badge>
  )
}

/**
 * AI Badge Helper
 * For AI-powered features and insights
 */
export function AIBadge({
  children,
  variant = "ai",
  pulse = false,
}: {
  children: React.ReactNode
  variant?: "ai" | "ai-subtle"
  pulse?: boolean
}) {
  return (
    <Badge variant={variant} icon={Sparkles} pulse={pulse}>
      {children}
    </Badge>
  )
}

/**
 * Example Usage Component
 */
export function BadgeExamplesShowcase() {
  return (
    <div className="space-y-8 p-8">
      {/* Semantic Status Badges */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Status Badges (Solid)</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" icon={CheckCircle2}>
            Success
          </Badge>
          <Badge variant="warning" icon={AlertTriangle}>
            Warning
          </Badge>
          <Badge variant="info" icon={Info}>
            Info
          </Badge>
          <Badge variant="destructive" icon={XCircle}>
            Error
          </Badge>
        </div>
      </section>

      {/* Outline Variants */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Outline Style</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline-success" icon={CheckCircle2}>
            Success
          </Badge>
          <Badge variant="outline-warning" icon={AlertTriangle}>
            Warning
          </Badge>
          <Badge variant="outline-info" icon={Info}>
            Info
          </Badge>
          <Badge variant="outline-destructive" icon={XCircle}>
            Error
          </Badge>
        </div>
      </section>

      {/* Subtle Variants */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Subtle Style</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="subtle-success" icon={CheckCircle2}>
            Success
          </Badge>
          <Badge variant="subtle-warning" icon={AlertTriangle}>
            Warning
          </Badge>
          <Badge variant="subtle-info" icon={Info}>
            Info
          </Badge>
          <Badge variant="subtle-destructive" icon={XCircle}>
            Error
          </Badge>
        </div>
      </section>

      {/* Status Helper Examples */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Status Helper (Auto Icon & Color)</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="active" />
          <StatusBadge status="pending" />
          <StatusBadge status="processing" />
          <StatusBadge status="completed" />
          <StatusBadge status="failed" />
          <StatusBadge status="signed" />
        </div>
      </section>

      {/* Animated Badges */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Animated (Real-time Updates)</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info" icon={Zap} pulse>
            Processing
          </Badge>
          <Badge variant="warning" icon={Clock} pulse>
            Pending
          </Badge>
          <Badge variant="ai" pulse>
            AI Generating
          </Badge>
        </div>
      </section>

      {/* AI Badges */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">AI-Powered Features</h3>
        <div className="flex flex-wrap gap-2">
          <AIBadge>AI Suggested</AIBadge>
          <AIBadge variant="ai-subtle">Smart Insights</AIBadge>
          <AIBadge pulse>Analyzing</AIBadge>
        </div>
      </section>

      {/* Trend Badges */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Trend Indicators</h3>
        <div className="flex flex-wrap gap-2">
          <TrendBadge value={12.5} />
          <TrendBadge value={-8.3} />
          <TrendBadge value={0} />
        </div>
      </section>

      {/* Size Variants */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" size="sm" icon={CheckCircle2}>
            Small
          </Badge>
          <Badge variant="success" icon={CheckCircle2}>
            Default
          </Badge>
          <Badge variant="success" size="lg" icon={CheckCircle2}>
            Large
          </Badge>
        </div>
      </section>

      {/* Icon Position */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Icon Position</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info" icon={Info} iconPosition="left">
            Left Icon
          </Badge>
          <Badge variant="info" icon={Info} iconPosition="right">
            Right Icon
          </Badge>
        </div>
      </section>
    </div>
  )
}

/**
 * Migration Guide
 *
 * Old usage:
 * ```tsx
 * <Badge variant="destructive">Error</Badge>
 * ```
 *
 * New usage (with icon):
 * ```tsx
 * <Badge variant="destructive" icon={XCircle}>Error</Badge>
 * ```
 *
 * Or use helpers:
 * ```tsx
 * <StatusBadge status="failed" />
 * ```
 *
 * Benefits:
 * - Color-blind friendly (icons provide context beyond color)
 * - More semantic variants
 * - Consistent appearance across app
 * - Animation support for live updates
 * - AI-themed badges for intelligent features
 */
