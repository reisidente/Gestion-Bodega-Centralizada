import { useState } from "react"
import { Eye, Plus, Filter } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { DetalleSolicitudModal } from "../../components/modals/detalle_solicitud"
import { OrdenDespachoModal } from "../../components/modals/orden_despacho"
import { OrdenCompraModal } from "../../components/modals/orden_compra"

const requestsData = [
  {
    id: "SOL-2025-001",
    farmacia: "Farmacia Central",
    fechaCreacion: "13/06/2025",
    estado: "Aprobada",
    prioridad: "Alta",
    farmacos: [
      { farmaco: "Paracetamol 500mg", cantidadSolicitada: 56, cantidadAprobada: null, estado: "Pendiente" },
      { farmaco: "Omeprazol 20mg", cantidadSolicitada: 79, cantidadAprobada: null, estado: "Pendiente" },
      { farmaco: "Diazepam 10mg", cantidadSolicitada: 91, cantidadAprobada: null, estado: "Pendiente" },
      { farmaco: "Ibuprofeno 400mg", cantidadSolicitada: 73, cantidadAprobada: null, estado: "Pendiente" },
    ]
  },
  {
    id: "SOL-2025-002",
    farmacia: "Farmacia Urgencias",
    fechaCreacion: "12/06/2025",
    estado: "Pendiente",
    prioridad: "Media",
    farmacos: [
      { farmaco: "Amoxicilina 500mg", cantidadSolicitada: 40, cantidadAprobada: null, estado: "Pendiente" },
    ]
  },
]

const categories = [
  "Todas",
  "Pendiente",
  "Completada",
]

export default function Solicitudes() {
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [search, setSearch] = useState("")
  const [modalDetalle, setModalDetalle] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalOrdenDespacho, setModalOrdenDespacho] = useState(false)
  const [modalOrdenCompra, setModalOrdenCompra] = useState(false)

  const filteredData = requestsData.filter(
    (item) =>
      (selectedCategory === "Todas" || item.estado === selectedCategory) &&
      (item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.farmacia.toLowerCase().includes(search.toLowerCase()))
  )

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "Alta":
        return "destructive"
      case "Media":
        return "warning"
      case "Baja":
        return "secondary"
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Aprobada":
        return "success"
      case "Pendiente":
        return "destructive"
      case "Completada":
        return "warning"
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-500 text-lg mt-1">Gestión de solicitudes de farmacia</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalOrdenDespacho(true)}
          >
            <Plus className="h-5 w-5" />
            Nueva Orden
          </Button>
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalOrdenCompra(true)}
          >
            <Plus className="h-5 w-5" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex flex-1 gap-1 flex-wrap">
          {categories.map((filter) => (
            <Button
              key={filter}
              variant={selectedCategory === filter ? "default" : "ghost"}
              className={`rounded-md px-4 py-2 text-base font-medium ${
                selectedCategory === filter ? "" : "text-gray-700"
              }`}
              onClick={() => setSelectedCategory(filter)}
            >
              {filter}
            </Button>
          ))}
          <Button
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 text-base font-medium"
          >
            <Filter className="h-5 w-5" />
            Filtros
          </Button>
        </div>
        <div className="flex-1 flex justify-end">
          <input
            type="text"
            placeholder="Buscar solicitud o farmacia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-md px-4 py-2 text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>
      </div>

      <TableContainer
        columns={[
          { header: "ID", render: item => <span className="font-medium text-gray-900">{item.id}</span> },
          { header: "Farmacia", render: item => item.farmacia },
          { header: "Fecha", render: item => item.fechaCreacion },
          {
            header: "Prioridad",
            render: item => (
              <Badge variant={getPriorityColor(item.prioridad)} className="text-xs">
                {item.prioridad}
              </Badge>
            ),
          },
          {
            header: "Estado",
            render: item => (
              <Badge variant={getStatusColor(item.estado)} className="text-xs">
                {item.estado}
              </Badge>
            ),
          },
          {
            header: "Acciones",
            render: item => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => setModalDetalle({ open: true, data: item })}
                aria-label="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
        data={filteredData}
      />

      <DetalleSolicitudModal
        open={modalDetalle.open}
        onClose={() => setModalDetalle({ open: false })}
        solicitud={modalDetalle.data || {
          id: "",
          farmacia: "",
          fechaCreacion: "",
          estado: "",
          prioridad: "",
          farmacos: [],
        }}
        onSave={solicitudActualizada => {
          setModalDetalle({ open: false })
        }}
      />

      <OrdenDespachoModal
        open={modalOrdenDespacho}
        onClose={() => setModalOrdenDespacho(false)}
        onCrear={data => {
          // lógica para crear orden de despacho
          setModalOrdenDespacho(false)
        }}
      />

      <OrdenCompraModal
        open={modalOrdenCompra}
        onClose={() => setModalOrdenCompra(false)}
        onEnviar={data => {
          // lógica para enviar orden de compra
          setModalOrdenCompra(false)
        }}
      />
    </div>
  )
}