import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "error"
  showValue?: boolean
  animated?: boolean
}

const GradientProgress = React.forwardRef<HTMLDivElement, GradientProgressProps>(
  ({ 
    className, 
    value, 
    max = 100, 
    size = "md", 
    variant = "default",
    showValue = false,
    animated = true,
    ...props 
  }, ref) => {
    const percentage = Math.min((value / max) * 100, 100)
    
    const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4"
    }

    const variantClasses = {
      default: "from-primary via-primary to-accent",
      success: "from-emerald-500 via-emerald-600 to-teal-500",
      warning: "from-yellow-500 via-orange-500 to-red-500",
      error: "from-red-500 via-red-600 to-pink-500"
    }

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden rounded-full bg-secondary/30", sizeClasses[size], className)}
        {...props}
      >
        <motion.div
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-sm",
            variantClasses[variant],
            animated && "transition-all duration-300"
          )}
          initial={animated ? { width: 0 } : undefined}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.8, ease: "easeOut" } : undefined}
        />
        
        {showValue && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground"
            initial={animated ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={animated ? { delay: 0.4 } : undefined}
          >
            {Math.round(percentage)}%
          </motion.div>
        )}

        {/* Shimmer effect for active progress */}
        {percentage > 0 && percentage < 100 && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
      </div>
    )
  }
)

GradientProgress.displayName = "GradientProgress"

export { GradientProgress }