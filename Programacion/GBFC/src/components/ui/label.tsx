"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "../../libs/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-gray-700",
        muted: "text-gray-500",
        accent: "text-gray-900",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant, size }), className)} {...props}>
        {children}
      </LabelPrimitive.Root>
    </motion.div>
  ),
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
