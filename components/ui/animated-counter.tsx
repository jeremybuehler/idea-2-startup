import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  className = "",
  suffix = "",
  prefix = ""
}) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const endValue = value

    const updateCounter = () => {
      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / duration, 1)
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(easeOut * endValue)
      
      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(updateCounter)
      }
    }

    if (endValue > 0) {
      requestAnimationFrame(updateCounter)
    } else {
      setCount(0)
    }
  }, [value, duration])

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{count}{suffix}
    </motion.span>
  )
}