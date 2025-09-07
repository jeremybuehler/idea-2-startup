import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FloatingElementProps {
  delay?: number
  duration?: number
  intensity?: "subtle" | "medium" | "strong"
  className?: string
  children?: React.ReactNode
}

const FloatingElement = React.forwardRef<HTMLDivElement, FloatingElementProps>(
  ({ className, children, delay = 0, duration = 3, intensity = "medium" }, ref) => {
    const intensityValues = {
      subtle: 5,
      medium: 10,
      strong: 15
    }

    return (
      <motion.div
        ref={ref}
        className={cn("inline-block", className)}
        animate={{
          y: [0, -intensityValues[intensity], 0],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    )
  }
)

FloatingElement.displayName = "FloatingElement"

export { FloatingElement }