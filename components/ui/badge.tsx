import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#06B6D4] text-[#080C14]",
        secondary: "border-transparent bg-[#6366F1] text-white",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "border-[#1e2d3d] text-[#94a3b8]",
        success: "border-transparent bg-[#10B981] text-white",
        briefing: "border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30",
        "training-op": "border-transparent bg-green-500/20 text-green-400 border-green-500/30",
        "strike-mission": "border-transparent bg-purple-500/20 text-purple-400 border-purple-500/30",
        debrief: "border-transparent bg-orange-500/20 text-orange-400 border-orange-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
