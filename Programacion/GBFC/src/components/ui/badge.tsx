import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "../../libs/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gray-900 text-white hover:bg-gray-800",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "border-gray-200 bg-white/50 backdrop-blur-sm text-gray-900 hover:bg-gray-50",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        glass: "border-white/20 bg-white/20 backdrop-blur-md text-gray-900 hover:bg-white/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  animated?: boolean
}

function Badge({ className, variant, children, animated = true, ...props }: BadgeProps) {
  const Comp: React.ElementType = animated ? motion.div : "div"

  return (
    <Comp
      className={cn(badgeVariants({ variant }), className)}
      {...(animated
        ? {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.2 },
            whileHover: { scale: 1.05 },
          }
        : {})}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Badge }