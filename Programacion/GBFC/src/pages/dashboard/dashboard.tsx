import { motion } from "framer-motion"
import { SmoothBackground } from "../../components/animations/smooth-bachground"
import { Package, FileText, AlertTriangle, TrendingDown, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../libs/supabase"

const initialMetrics = [
  {
    title: "Fármacos",
    value: "0",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Solicitudes pendientes",
    value: "0",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Próximos a vencer",
    value: "0",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Stock bajo",
    value: "0",
    icon: TrendingDown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
]

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

export default function Dashboard() {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const configAlertas = JSON.parse(
        localStorage.getItem("configAlertas") ||
          '{ "dias_vencimiento": 30, "stock_bajo": 10 }'
      )

      const { data, error } = await supabase.rpc("get_dashboard_metrics", {
        dias_vencimiento_param: configAlertas.dias_vencimiento,
        stock_bajo_param: configAlertas.stock_bajo,
      })

      if (error) throw error

      if (data && data.length > 0) {
        const metricsData = data[0]
        setMetrics([
          { ...initialMetrics[0], value: String(metricsData.farmacos_total || 0) },
          {
            ...initialMetrics[1],
            value: String(metricsData.solicitudes_pendientes || 0),
          },
          {
            ...initialMetrics[2],
            value: String(metricsData.proximos_a_vencer || 0),
          },
          { ...initialMetrics[3], value: String(metricsData.stock_bajo || 0) },
        ])
      }
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return (
    <>
      <SmoothBackground />

      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen general del sistema farmacéutico</p>
        </motion.div>

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
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? "..." : metric.value}
                      </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
          </div>
          <div>
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
          </div>
        </div>
      </motion.div>
    </>
  )
}