import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-semibold transition-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        // Semantic status variants (color-blind friendly with icons)
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info:
          "border-transparent bg-info text-info-foreground hover:bg-info/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Neutral variants
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Outline variants (color-blind friendly)
        outline:
          "border-border bg-background text-foreground hover:bg-muted",
        "outline-success":
          "border-success/50 bg-success/10 text-success hover:bg-success/20",
        "outline-warning":
          "border-warning/50 bg-warning/10 text-warning-foreground hover:bg-warning/20",
        "outline-info":
          "border-info/50 bg-info/10 text-info hover:bg-info/20",
        "outline-destructive":
          "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20",
        // Subtle variants (muted backgrounds)
        subtle:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        "subtle-success":
          "border-transparent bg-success/10 text-success hover:bg-success/20",
        "subtle-warning":
          "border-transparent bg-warning/10 text-warning-foreground hover:bg-warning/20",
        "subtle-info":
          "border-transparent bg-info/10 text-info hover:bg-info/20",
        "subtle-destructive":
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        // AI-themed badges
        ai:
          "border-transparent bg-ai-accent text-ai-accent-foreground hover:bg-ai-accent/80 ai-glow",
        "ai-subtle":
          "border-ai-border bg-ai-subtle text-ai-accent hover:bg-ai-accent/10",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
      animated: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animated: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: LucideIcon
  iconPosition?: "left" | "right"
  pulse?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, animated, icon: Icon, iconPosition = "left", pulse = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, animated: pulse ? true : animated }), className)}
        role="status"
        {...props}
      >
        {Icon && iconPosition === "left" && (
          <Icon className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5", size === "lg" && "h-3.5 w-3.5")} aria-hidden="true" />
        )}
        {children}
        {Icon && iconPosition === "right" && (
          <Icon className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5", size === "lg" && "h-3.5 w-3.5")} aria-hidden="true" />
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
