"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../libs/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    return (
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300 focus:border-gray-400 focus:bg-white/70",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-gray-400 pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

Input.displayName = "Input"

export { Input }
