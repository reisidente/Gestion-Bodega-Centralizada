import { motion } from "framer-motion"

export function LoadingSpinner() {
  return (
    <motion.div
      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    />
  )
}
