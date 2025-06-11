import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "../../libs/utils"

// Card principal
const Card = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof motion.div>>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-md text-gray-950 shadow-lg transition-all duration-300 hover:shadow-xl",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Card.displayName = "Card"

// Header
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

// Title (h3 con motion)
const CardTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof motion.h3>>(
  ({ className, children, ...props }, ref) => (
    <motion.h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900", className)}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      {...props}
    >
      {children}
    </motion.h3>
  )
)
CardTitle.displayName = "CardTitle"

// Descripción (p con motion)
const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<typeof motion.p>>(
  ({ className, children, ...props }, ref) => (
    <motion.p
      ref={ref}
      className={cn("text-sm text-gray-600", className)}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      {...props}
    >
      {children}
    </motion.p>
  )
)
CardDescription.displayName = "CardDescription"

// Contenido
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

// Footer
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
