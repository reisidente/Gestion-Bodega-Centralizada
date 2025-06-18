import { useEffect, useRef, useState } from "react"
import { Filter, Download, Settings, MoreVertical, Eye, Pencil } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { VerReporteModal } from "../../components/modals/ver_reporte"
import { EditarReporteModal } from "../../components/modals/editar_reporte"
import { CrearReporteModal } from "../../components/modals/crear_reporte"
import { supabase } from "../../libs/supabase"

export default function Reportes() {
  const [filtroActivo, setFiltroActivo] = useState("Todos")
  const [search, setSearch] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [modalVer, setModalVer] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalEditar, setModalEditar] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalCrear, setModalCrear] = useState(false)
  const [reportes, setReportes] = useState<any[]>([])

  useEffect(() => {
    const fetchReportes = async () => {
      const { data: reportesData } = await supabase.from("reporte").select("*")
      setReportes(reportesData || [])
    }
    fetchReportes()
  }, [])

  const filtros = [
    "Todos",
    ...Array.from(new Set(reportes.map(r => r.tipo)))
  ]

  const filteredData = reportes.filter(
    (item) =>
      (filtroActivo === "Todos" || item.tipo === filtroActivo) &&
      (item.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        item.tipo?.toLowerCase().includes(search.toLowerCase()))
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
        onSave={async (data) => {
          if (!modalEditar.data?.id) return;
          await supabase.from("reporte").update({
            nombre: data.titulo,
            tipo: data.tipo,
            formato: data.formato,
            frecuencia: data.frecuencia,
            descripcion: data.descripcion,
            parametros: data.parametros,
          }).eq("id", modalEditar.data.id)
          setModalEditar({ open: false })
          // Refrescar reportes
          const { data: reportesData } = await supabase.from("reporte").select("*")
          setReportes(reportesData || [])
        }}
      />

      <CrearReporteModal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        onCreate={async (data) => {
          // Insertar reporte en Supabase
          const { data: nuevoReporte, error } = await supabase.from("reporte").insert([
            {
              nombre: data.titulo,
              tipo: data.tipo,
              formato: data.formato,
              frecuencia: data.frecuencia,
              descripcion: data.descripcion,
              parametros: data.parametros,
              fecha: new Date().toISOString().slice(0, 10),
              creadoPor: "Administrador", // Puedes ajustar según el usuario logueado
            }
          ])
          if (error) {
            alert("Error al crear reporte")
            return
          }
          setModalCrear(false)
          // Refrescar reportes
          const { data: reportesData } = await supabase.from("reporte").select("*")
          setReportes(reportesData || [])
        }}
      />
    </div>
  )
}