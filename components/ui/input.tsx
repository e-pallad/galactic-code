import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#1e2d3d] bg-[#0d1520] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
