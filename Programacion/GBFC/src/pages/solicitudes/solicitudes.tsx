import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, Plus, Filter, History, Download } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"

const requestsData = [
  {
    id: "SOL001",
    farmacia: "Farmacia Central",
    fecha: "2024-01-15",
    prioridad: "Alta",
    estado: "Pendiente",
  },
  {
    id: "SOL002",
    farmacia: "Farmacia Urgencias",
    fecha: "2024-01-14",
    prioridad: "Media",
    estado: "En proceso",
  },
  {
    id: "SOL003",
    farmacia: "Farmacia Pediatría",
    fecha: "2024-01-13",
    prioridad: "Baja",
    estado: "Completada",
  },
]

const filters = ["Pendientes", "Completadas", "Todas"]

export default function Solicitudes() {
  const [selectedFilter, setSelectedFilter] = useState("Pendientes")

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "Alta":
        return "destructive"
      case "Media":
        return "warning"
      case "Baja":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Completada":
        return "success"
      case "En proceso":
        return "warning"
      case "Pendiente":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Solicitudes</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtros:</span>
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className="h-8"
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Historial
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Farmacia</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prioridad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requestsData.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{request.id}</td>
                    <td className="py-3 px-4 text-gray-600">{request.farmacia}</td>
                    <td className="py-3 px-4 text-gray-600">{request.fecha}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getPriorityColor(request.prioridad)} className="text-xs">
                        {request.prioridad}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(request.estado)} className="text-xs">
                        {request.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}