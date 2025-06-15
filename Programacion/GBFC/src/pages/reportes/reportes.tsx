import { useState, useRef } from "react"
import { Filter, Download, Settings, MoreVertical, Eye, Pencil } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { VerReporteModal } from "../../components/modals/ver_reporte"
import { EditarReporteModal } from "../../components/modals/editar_reporte"
import { CrearReporteModal } from "../../components/modals/crear_reporte"

const reportesData = [
  {
    nombre: "Inventario General",
    tipo: "Inventario",
    fecha: "2025-06-01",
    creadoPor: "Administrador",
    formato: "PDF",
    descripcion: "Reporte completo del inventario actual con desglose por categorías",
    parametros: { incluirStockCero: true, ordenarPor: "Categoría" },
    columnas: ["Fármaco", "Lote", "Stock", "Vencimiento"],
    datos: [
      { "Fármaco": "Paracetamol", "Lote": "PAR001", "Stock": 100, "Vencimiento": "12/2025" },
      { "Fármaco": "Ibuprofeno", "Lote": "IBU003", "Stock": 50, "Vencimiento": "11/2025" },
    ],
  },
  {
    nombre: "Próximos Vencimientos",
    tipo: "Vencimientos",
    fecha: "2025-06-01",
    creadoPor: "Administrador",
    formato: "PDF",
    descripcion: "Fármacos que vencerán en los próximos 90 días ordenados por fecha",
    parametros: { dias: 90, ordenarPor: "Días restantes" },
    columnas: ["Fármaco", "Lote", "Vencimiento", "Días restantes"],
    datos: [
      { "Fármaco": "Paracetamol", "Lote": "PAR001", "Vencimiento": "12/2025", "Días restantes": 80 },
      { "Fármaco": "Ibuprofeno", "Lote": "IBU003", "Vencimiento": "11/2025", "Días restantes": 60 },
    ],
  },
  {
    nombre: "Stock Bajo",
    tipo: "Stock bajo",
    fecha: "2025-06-01",
    creadoPor: "Administrador",
    formato: "PDF",
    descripcion: "Fármacos con stock por debajo del mínimo requerido",
    parametros: { ordenarPor: "Déficit (unidades faltantes)" },
    columnas: ["Fármaco", "Stock actual", "Stock mínimo", "Déficit"],
    datos: [
      { "Fármaco": "Paracetamol", "Stock actual": 10, "Stock mínimo": 50, "Déficit": 40 },
      { "Fármaco": "Ibuprofeno", "Stock actual": 5, "Stock mínimo": 30, "Déficit": 25 },
    ],
  },
]

const filtros = ["Todos", "Inventario", "Vencimientos", "Stock bajo"]

export default function Reportes() {
  const [filtroActivo, setFiltroActivo] = useState("Todos")
  const [search, setSearch] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [modalVer, setModalVer] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalEditar, setModalEditar] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalCrear, setModalCrear] = useState(false)

  const filteredData = reportesData.filter(
    (item) =>
      (filtroActivo === "Todos" || item.tipo === filtroActivo) &&
      (item.nombre.toLowerCase().includes(search.toLowerCase()) ||
        item.tipo.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      {/* Título y acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-lg mt-1">Visualización y exportación de reportes</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2 font-medium">
            <Download className="h-5 w-5" />
            Exportar
          </Button>
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalCrear(true)}
          >
            <Settings className="h-5 w-5" />
            Nuevo reporte
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex flex-1 gap-1 flex-wrap">
          {filtros.map((filtro) => (
            <Button
              key={filtro}
              variant={filtroActivo === filtro ? "default" : "ghost"}
              className={`rounded-md px-4 py-2 text-base font-medium ${
                filtroActivo === filtro ? "" : "text-gray-700"
              }`}
              onClick={() => setFiltroActivo(filtro)}
            >
              {filtro}
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
            placeholder="Buscar reporte..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-md px-4 py-2 text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>
      </div>

      {/* Tabla de reportes */}
      <TableContainer
        columns={[
          { header: "Nombre", render: item => <span className="font-medium text-gray-900">{item.nombre}</span> },
          { header: "Tipo", render: item => item.tipo },
          { header: "Fecha", render: item => item.fecha ? new Date(item.fecha).toLocaleDateString() : "" },
          { header: "Creado por", render: item => item.creadoPor },
          { header: "Formato", render: item => <Badge className="text-xs">{item.formato}</Badge> },
          {
            header: "Acciones",
            render: item => (
              <div className="flex items-center">
                <Button
                  ref={el => { buttonRefs.current[item.nombre] = el }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const rect = buttonRefs.current[item.nombre]?.getBoundingClientRect()
                    setOpenMenu(openMenu === item.nombre ? null : item.nombre)
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
                  {openMenu === item.nombre && menuPosition && (
                    <>
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
                          onClick={() => {
                            setModalVer({ open: true, data: item })
                            setOpenMenu(null)
                          }}
                        >
                          <Eye className="h-4 w-4" /> Ver reporte
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Download className="h-4 w-4" /> Descargar
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setModalEditar({ open: true, data: item })
                            setOpenMenu(null)
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Editar
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

      {/* Modals */}
      <VerReporteModal
        open={modalVer.open}
        onClose={() => setModalVer({ open: false })}
        reporte={modalVer.data || {}}
        onDescargar={() => {/* lógica de descarga */}}
        onEditar={() => {
          setModalVer({ open: false })
          setModalEditar({ open: true, data: modalVer.data })
        }}
        onVolver={() => setModalVer({ open: false })}
      />

      <EditarReporteModal
        open={modalEditar.open}
        onClose={() => setModalEditar({ open: false })}
        initialData={{
          ...modalEditar.data,
          tipo: typeof modalEditar.data?.tipo === "string"
            ? (modalEditar.data.tipo.charAt(0).toUpperCase() + modalEditar.data.tipo.slice(1).toLowerCase())
            : "Stock Bajo",
        }}
        onSave={_data => {
          // lógica para guardar cambios
          setModalEditar({ open: false })
        }}
      />

      <CrearReporteModal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        onCreate={data => {
          // Aquí puedes agregar la lógica para crear el reporte (ej: llamada a API o actualizar estado)
          setModalCrear(false)
        }}
      />
    </div>
  )
}