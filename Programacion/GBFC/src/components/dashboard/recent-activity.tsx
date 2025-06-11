"use client"

import { motion } from "framer-motion"
import { Clock, Package, FileText, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

const activities = [
  {
    id: 1,
    type: "stock",
    message: "Stock ajustado: Paracetamol 500mg",
    time: "Hace 5 min",
    icon: Package,
    color: "text-blue-600",
  },
  {
    id: 2,
    type: "solicitud",
    message: "Nueva solicitud de Farmacia Central",
    time: "Hace 15 min",
    icon: FileText,
    color: "text-green-600",
  },
  {
    id: 3,
    type: "alerta",
    message: "Alerta: Ibuprofeno próximo a vencer",
    time: "Hace 1 hora",
    icon: AlertTriangle,
    color: "text-red-600",
  },
  {
    id: 4,
    type: "stock",
    message: "Nuevo lote registrado: Amoxicilina",
    time: "Hace 2 horas",
    icon: Package,
    color: "text-blue-600",
  },
]

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className={`p-2 rounded-lg bg-gray-50`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 mb-1">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
