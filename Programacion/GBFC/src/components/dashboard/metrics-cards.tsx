"use client"

import { motion } from "framer-motion"
import { Package, FileText, AlertTriangle, TrendingDown } from "lucide-react"
import { Card, CardContent } from "../ui/card"

const metrics = [
  {
    title: "Fármacos",
    value: "1,247",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Solicitudes pendientes",
    value: "23",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Próximos a vencer",
    value: "15",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Stock bajo",
    value: "8",
    icon: TrendingDown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
]

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
