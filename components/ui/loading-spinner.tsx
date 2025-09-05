import React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "gradient"
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6", 
      lg: "w-8 h-8"
    }

    const variantClasses = {
      default: "border-primary/20 border-t-primary",
      gradient: "border-transparent bg-gradient-to-r from-primary to-accent animate-spin"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-block rounded-full border-2 animate-spin",
          sizeClasses[size],
          variant === "gradient" ? "bg-gradient-to-r from-primary to-accent" : variantClasses[variant],
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)

LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }