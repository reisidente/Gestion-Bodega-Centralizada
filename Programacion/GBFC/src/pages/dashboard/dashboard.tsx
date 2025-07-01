import { motion } from "framer-motion"
import { Package, FileText, AlertTriangle, TrendingDown, Clock, Bell} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle,} from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../libs/supabase"
import { SmoothBackground } from "../../components/animations/smooth-bachground"
import { formatearFechaLocal, formatTimeAgo, limpiarTimestampsAntiguos } from "../../libs/utils"

const initialMetrics = [
  {
    title: "Fármacos",
    value: "-",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Solicitudes pendientes",
    value: "-",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Próximos a vencer",
    value: "-",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Stock bajo",
    value: "-",
    icon: TrendingDown,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
]

interface Activity {
  id: string
  type: "Ajuste" | "Solicitud" | "Ingreso"
  message: string
  time: string
  icon: React.ElementType
}

interface Alert {
  id: string
  type: "Vencimiento" | "Stock"
  message: string
  icon: React.ElementType
  color: string
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [activities, setActivities] = useState<Activity[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllData = useCallback(async () => {
    try {
      // Limpiar timestamps antiguos para mantener localStorage limpio
      limpiarTimestampsAntiguos()
      
      // Cargar métricas y actividades en paralelo
      const [
        farmacosCountResponse,
        solicitudesPendientesCountResponse,
        proximosAVencerCountResponse,
        ajustesResponse,
        solicitudesResponse,
        alertasResponse,
        stockBajoCountResponse,
      ] = await Promise.all([
        supabase
          .from("farmaco")
          .select("id_farmaco", { count: "exact", head: true }),
        supabase
          .from("solicitud")
          .select("id_sol", { count: "exact", head: true })
          .eq("estado", "Pendiente"),
        (() => {
          const config = JSON.parse(
            localStorage.getItem("alertConfig") ||
              '{ "diasVencimiento": 30, "cantidadMinimaStock": 50 }',
          )
          // Calcular próximos a vencer desde lotes directamente
          const fechaLimite = new Date()
          fechaLimite.setDate(fechaLimite.getDate() + config.diasVencimiento)
          return supabase
            .from("lote")
            .select("id_lote", { count: "exact", head: true })
            .lte("fec_venci", formatearFechaLocal(fechaLimite))
            .gte("fec_venci", formatearFechaLocal(new Date()))
            .gt("cantidad", 0)
        })(),
        supabase
          .from("historial_ajuste")
          .select(
            "id_ajuste, tipo_ajuste, cant_ajuste, fec_ajuste, motivo, lote:lote_id_lote(farmaco:farmaco_id_farmaco(nombre_comercial))",
          )
          .order("fec_ajuste", { ascending: false })
          .limit(20),
        supabase
          .from("solicitud")
          .select(
            "id_sol, fec_creacion, farmacia:farmacia_id_farmacia(nom_farma)",
          )
          .order("fec_creacion", { ascending: false })
          .limit(10),
        supabase
          .from("alerta")
          .select("*")
          .order("fec_creacion", { ascending: false })
          .limit(10),
        supabase
          .from("alerta")
          .select("id_alerta", { count: "exact", head: true })
          .eq("tipo_alerta", "Stock"),
      ])

      // Procesar Métricas
      const { count: farmacosCount, error: farmacosError } = farmacosCountResponse
      if (farmacosError)
        throw new Error(`Error al contar fármacos: ${farmacosError.message}`)

      const { count: solicitudesPendientesCount, error: solicitudesPendientesError } = solicitudesPendientesCountResponse
      if (solicitudesPendientesError)
        throw new Error(`Error al contar solicitudes pendientes: ${solicitudesPendientesError.message}`)

      const { count: proximosAVencerCount, error: proximosAVencerError } = proximosAVencerCountResponse
      if (proximosAVencerError)
        throw new Error(`Error al contar próximos a vencer: ${proximosAVencerError.message}`)

      const {
        count: stockBajoCount,
        error: stockBajoError,
      } = stockBajoCountResponse
      if (stockBajoError)
        throw new Error(
          `Error al contar alertas de stock: ${stockBajoError.message}`,
        )

      setMetrics([
        { ...initialMetrics[0], value: String(farmacosCount || 0) },
        {
          ...initialMetrics[1],
          value: String(solicitudesPendientesCount || 0),
        },
        { ...initialMetrics[2], value: String(proximosAVencerCount || 0) },
        { ...initialMetrics[3], value: String(stockBajoCount || 0) },
      ])

      // Procesar Actividades
      const { data: ajustesData, error: ajustesError } = ajustesResponse
      if (ajustesError)
        throw new Error(`Error al cargar ajustes: ${ajustesError.message}`)

      // Separar actividades por tipo según el motivo
      const ingresoActivities: Activity[] = []
      const ajusteActivities: Activity[] = []

      ;(ajustesData || []).forEach((a: any) => {
        if (a.motivo === "Registro") {
          // Es un ingreso inicial al sistema
          ingresoActivities.push({
            id: `ingreso-${a.id_ajuste}`,
            type: "Ingreso",
            message: `Ingreso de ${a.cant_ajuste || 0} unidades de ${
              a.lote?.farmaco?.nombre_comercial || "fármaco"
            }`,
            time: a.fec_ajuste,
            icon: Package,
          })
        } else {
          // Es un ajuste manual (Entrada/Salida manual, Despacho, etc.)
          ajusteActivities.push({
            id: `ajuste-${a.id_ajuste}`,
            type: "Ajuste",
            message: `${a.tipo_ajuste} de ${a.cant_ajuste} en ${
              a.lote?.farmaco?.nombre_comercial || "fármaco"
            }`,
            time: a.fec_ajuste,
            icon: Package,
          })
        }
      })

      const { data: solicitudesData, error: solicitudesError } =
        solicitudesResponse
      if (solicitudesError)
        throw new Error(
          `Error al cargar solicitudes: ${solicitudesError.message}`,
        )

      const solicitudActivities: Activity[] = (solicitudesData || []).map(
        (s: any) => ({
          id: `solicitud-${s.id_sol}`,
          type: "Solicitud",
          message: `Nueva solicitud de ${
            s.farmacia?.nom_farma || "una farmacia"
          }`,
          time: s.fec_creacion,
          icon: FileText,
        }),
      )

      // Combinar, ordenar y guardar actividades (limitando el total final)
      const combinedActivities = [
        ...ingresoActivities,
        ...ajusteActivities,
        ...solicitudActivities,
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10) // Tomar solo las 10 más recientes después de ordenar

      setActivities(combinedActivities)

      // Procesar Alertas
      const { data: alertasData, error: alertasError } = alertasResponse
      if (alertasError) {
        throw new Error(`Error al cargar alertas: ${alertasError.message}`)
      }

      const dashboardAlerts: Alert[] = (alertasData || []).map((a: any) => ({
        id: `alerta-${a.id_alerta}`,
        type: a.tipo_alerta,
        message: a.mensaje,
        icon: a.tipo_alerta === "Vencimiento" ? AlertTriangle : TrendingDown,
        color:
          a.nivel === "Alto"
            ? "text-red-600"
            : a.nivel === "Medio"
            ? "text-yellow-600"
            : "text-gray-500",
      }))

      setAlerts(dashboardAlerts)
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()

    const channel = supabase
      .channel("dashboard-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lote" },
        fetchAllData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "historial_ajuste" },
        fetchAllData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solicitud" },
        fetchAllData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta" },
        fetchAllData,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAllData])

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
          <p className="text-gray-600">
            Resumen general del sistema farmacéutico
          </p>
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
                      <p className="text-sm text-gray-600 mb-1">
                        {metric.title}
                      </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-red-500" />
                  Notificaciones de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500">Cargando alertas...</p>
                ) : alerts.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                    {alerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className="p-2 rounded-lg bg-gray-100">
                          <alert.icon className={`h-4 w-4 ${alert.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-1">
                            {alert.message}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs border-current ${alert.color}`}
                        >
                          {alert.type}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500 py-4">
                    <Bell className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2">No hay alertas nuevas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500">
                    Cargando actividad...
                  </p>
                ) : activities.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors duration-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className={`p-2 rounded-lg bg-gray-100`}>
                          <activity.icon
                            className={`h-4 w-4 ${
                              activity.type === "Ajuste"
                                ? "text-blue-600"
                                : activity.type === "Solicitud"
                                ? "text-green-600"
                                : "text-purple-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-1">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.time, activity.id.split('-')[1], activity.type)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay actividad reciente.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}