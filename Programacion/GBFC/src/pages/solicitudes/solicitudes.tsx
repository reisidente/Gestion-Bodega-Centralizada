import { useState, useRef } from "react"
import { Eye, Plus, Filter, Download, MoreVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"

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

const categories = [
  "Todas",
  "Pendientes",
  "Completadas",
]

export default function Solicitudes() {
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [search, setSearch] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "Alta":
        return "destructive"
      case "Media":
        return "warning"
      case "Baja":
        return "success"
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
    }
  }

  const filteredData = requestsData.filter(
    (item) =>
      (selectedCategory === "Todas" || item.estado === selectedCategory) &&
      (item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.farmacia.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      {/* Título y acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-500 text-lg mt-1">Gestión de solicitudes de farmacia</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2 font-medium">
            <Download className="h-5 w-5" />
            Exportar
          </Button>
          <Button className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white">
            <Plus className="h-5 w-5" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
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

      {/* Tabla */}
      <TableContainer
        columns={[
          { header: "ID", render: item => <span className="font-medium text-gray-900">{item.id}</span> },
          { header: "Farmacia", render: item => item.farmacia },
          { header: "Fecha", render: item => item.fecha },
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
              <div className="flex items-center">
                <Button
                  ref={el => { buttonRefs.current[item.id] = el }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const rect = buttonRefs.current[item.id]?.getBoundingClientRect()
                    setOpenMenu(openMenu === item.id ? null : item.id)
                    setMenuPosition(
                      rect
                        ? {
                            top: rect.bottom + window.scrollY,
                            left: Math.min(rect.left, window.innerWidth - 220),
                          }
                        : null
                    )
                  }}
                  aria-label="Acciones"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                <AnimatePresence>
                  {openMenu === item.id && menuPosition && (
                    <>
                      {/* Backdrop para cerrar el menú al hacer clic fuera */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenu(null)}
                        aria-hidden="true"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed bg-white border rounded-xl shadow-lg z-50 min-w-[200px] py-2"
                        style={{
                          top: menuPosition.top,
                          left: menuPosition.left,
                        }}
                      >
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Eye className="h-4 w-4" /> Ver detalles
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ),
          },
        ]}
        data={filteredData}
      />
    </div>
  )
}