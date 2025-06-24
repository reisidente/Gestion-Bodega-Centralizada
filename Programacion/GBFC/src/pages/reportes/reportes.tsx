import { useEffect, useRef, useState, useCallback } from "react"
import { Filter, Download, Settings, MoreVertical, Eye, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { CrearReporteModal } from "../../components/modals/crear_reporte"
import { supabase } from "../../libs/supabase"
import type { FileObject } from "@supabase/storage-js"

// Definimos un tipo para los datos del reporte que mostraremos en la tabla
interface ReporteMostrado {
  nombre: string
  tipo: string
  fecha: string
  url: string
  fileName: string
}

export default function Reportes() {
  const [filtroActivo, setFiltroActivo] = useState("Todos")
  const [search, setSearch] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
  const [modalCrear, setModalCrear] = useState(false)
  const [reportes, setReportes] = useState<FileObject[]>([])
  const [loading, setLoading] = useState(false)

  const handleDownload = async (fileName: string) => {
    setOpenMenu(null)
    try {
      const { data, error } = await supabase.storage
        .from("reportes")
        .download(fileName)
      if (error) {
        throw error
      }
      const url = window.URL.createObjectURL(data)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al descargar el reporte:", error)
      alert("No se pudo descargar el reporte.")
    }
  }

  const fetchReportes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.storage.from("reportes").list()

    if (error) {
      console.error("Error al listar reportes:", error)
      setReportes([])
    } else {
      setReportes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReportes()
  }, [fetchReportes])

  const handleGenerateAndUploadReport = async (config: {
    titulo: string
    tipo: string
  }) => {
    setLoading(true)
    setModalCrear(false)

    const doc = new jsPDF()
    const fecha = new Date().toLocaleDateString()
    const fileName = `${config.tipo}_${config.titulo.replace(
      /\s+/g,
      "_"
    )}_${new Date().getTime()}.pdf`

    doc.text(`Reporte de: ${config.tipo}`, 14, 20)
    doc.text(`Título: ${config.titulo}`, 14, 28)
    doc.text(`Fecha: ${fecha}`, 14, 36)

    let tableData: any[] = []
    let head: string[][] = []

    try {
      switch (config.tipo) {
        case "Inventario": {
          const { data, error } = await supabase
            .from("farmaco")
            .select("nombre, codigo, categoria, stock, uni_medida")
          if (error) throw error
          head = [["Nombre", "Código", "Categoría", "Stock", "U. Medida"]]
          tableData =
            data?.map((f) => [
              f.nombre,
              f.codigo,
              f.categoria,
              f.stock,
              f.uni_medida,
            ]) || []
          break
        }
        case "Alertas": {
          const { data, error } = await supabase
            .from("alerta")
            .select("*, farmaco:farmaco_id_farmaco(nombre)")
          if (error) throw error
          head = [["Fármaco", "Tipo Alerta", "Nivel", "Mensaje", "Vencimiento"]]
          tableData =
            data?.map((a) => [
              a.farmaco?.nombre || "N/A",
              a.tipo_alerta,
              a.nivel,
              a.mensaje,
              a.fec_vencimiento === "9999-12-31"
                ? "N/A"
                : new Date(a.fec_vencimiento).toLocaleDateString(),
            ]) || []
          break
        }
        // Agrega más casos para otros tipos de reportes
      }

      autoTable(doc, {
        head,
        body: tableData,
        startY: 44,
      })

      const pdfBlob = doc.output("blob")

      const { error: uploadError } = await supabase.storage
        .from("reportes")
        .upload(fileName, pdfBlob)

      if (uploadError) {
        throw uploadError
      }

      await fetchReportes() // Refrescar la lista
    } catch (error) {
      console.error("Error al generar o subir el reporte:", error)
      alert("No se pudo generar el reporte. Revise la consola para más detalles.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (displayName: string, fileName: string) => {
    if (
      !window.confirm(`¿Seguro que quieres eliminar el reporte "${displayName}"?`)
    )
      return

    setLoading(true)
    const { error } = await supabase.storage.from("reportes").remove([fileName])
    if (error) {
      console.error("Error al eliminar el reporte:", error)
      alert("No se pudo eliminar el reporte.")
    } else {
      await fetchReportes() // Refrescar
    }
    setLoading(false)
    setOpenMenu(null)
  }

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage.from("reportes").getPublicUrl(fileName)
    return data.publicUrl
  }

  // Transforma los datos de los archivos para la tabla
  const dataMostrada: ReporteMostrado[] = reportes.map((file) => {
    const parts = file.name.split("_")
    return {
      nombre: parts.length > 1 ? parts[1].replace(/_/g, " ") : file.name,
      tipo: parts[0],
      fecha: new Date(file.created_at).toLocaleDateString(),
      url: getPublicUrl(file.name),
      fileName: file.name,
    }
  })

  const filtros = ["Todos", ...Array.from(new Set(dataMostrada.map((r) => r.tipo)))]
  const filteredData = dataMostrada.filter(
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
          <p className="text-gray-500 text-lg mt-1">
            Visualización y exportación de reportes
          </p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalCrear(true)}
            disabled={loading}
          >
            {loading ? (
              "Procesando..."
            ) : (
              <>
                <Settings className="h-5 w-5" />
                Nuevo reporte
              </>
            )}
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
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-4 py-2 text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>
      </div>

      {/* Tabla de reportes */}
      {loading && <p>Cargando...</p>}
      <TableContainer
        columns={[
          {
            header: "Nombre",
            render: (item) => (
              <span className="font-medium text-gray-900">{item.nombre}</span>
            ),
          },
          { header: "Tipo", render: (item) => item.tipo },
          { header: "Fecha", render: (item) => item.fecha },
          {
            header: "Formato",
            render: () => <Badge className="text-xs">PDF</Badge>,
          },
          {
            header: "Acciones",
            render: (item) => (
              <div className="flex items-center">
                <Button
                  ref={(el) => {
                    buttonRefs.current[item.fileName] = el
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const rect =
                      buttonRefs.current[item.fileName]?.getBoundingClientRect()
                    setOpenMenu(
                      openMenu === item.fileName ? null : item.fileName
                    )
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
                  {openMenu === item.fileName && menuPosition && (
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
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Eye className="h-4 w-4" /> Ver reporte
                        </a>
                        <button
                          onClick={() => handleDownload(item.fileName)}
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="h-4 w-4" /> Descargar
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors text-red-600"
                          onClick={() =>
                            handleDeleteReport(item.nombre, item.fileName)
                          }
                        >
                          <Trash2 className="h-4 w-4" /> Eliminar
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
      <CrearReporteModal
        open={modalCrear}
        onClose={() => setModalCrear(false)}
        onCreate={handleGenerateAndUploadReport}
      />
    </div>
  )
}