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
    parametros?: any
  }) => {
    setLoading(true)
    setModalCrear(false)

    const doc = new jsPDF()
    const fecha = new Date().toLocaleDateString()
    const hora = new Date().toLocaleTimeString()
    const fileName = `${config.tipo}_${config.titulo.replace(
      /\s+/g,
      "_"
    )}_${new Date().getTime()}.pdf`

    // Configurar fuentes y colores
    const primaryColor = [41, 128, 185] // Azul
    const secondaryColor = [52, 73, 94] // Gris oscuro

    // Encabezado principal con fondo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(10, 10, 190, 25, 'F')
    
    // Título principal
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SISTEMA DE GESTIÓN DE BODEGA FARMACÉUTICA', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Reporte de ${config.tipo}`, 105, 28, { align: 'center' })

    // Información del reporte
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Título:', 14, 45)
    doc.setFont('helvetica', 'normal')
    doc.text(config.titulo, 35, 45)

    doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', 14, 52)
    doc.setFont('helvetica', 'normal')
    doc.text(`${fecha} - ${hora}`, 35, 52)

    // Agregar información específica según el tipo de reporte
    let startY = 62
    
    if (config.tipo === "Movimientos") {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      if (config.parametros?.fechaInicio) {
        doc.text('Período:', 14, startY)
        doc.setFont('helvetica', 'normal')
        doc.text(`${config.parametros.fechaInicio} - ${config.parametros?.fechaFin || "Presente"}`, 35, startY)
        startY += 7
      }
      if (config.parametros?.farmacia) {
        doc.setFont('helvetica', 'bold')
        doc.text('Filtro:', 14, startY)
        doc.setFont('helvetica', 'normal')
        doc.text('Farmacia específica seleccionada', 35, startY)
        startY += 7
      }
    }
    
    if (config.tipo === "Stock Bajo") {
      const alertConfig = JSON.parse(
        localStorage.getItem("alertConfig") ||
          '{ "diasVencimiento": 30, "cantidadMinimaStock": 50 }'
      )
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      if (config.parametros?.ordenarPor) {
        doc.text('Ordenado por:', 14, startY)
        doc.setFont('helvetica', 'normal')
        doc.text(config.parametros.ordenarPor, 50, startY)
        startY += 7
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text('Umbral mínimo:', 14, startY)
      doc.setFont('helvetica', 'normal')
      doc.text(`${alertConfig.cantidadMinimaStock} unidades`, 55, startY)
      startY += 7
    }

    if (config.tipo === "Vencimientos") {
      const diasVencimiento = parseInt(config.parametros?.dias) || 30
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Período:', 14, startY)
      doc.setFont('helvetica', 'normal')
      doc.text(`Próximos ${diasVencimiento} días`, 35, startY)
      startY += 7
      
      if (config.parametros?.ordenarPor) {
        doc.setFont('helvetica', 'bold')
        doc.text('Ordenado por:', 14, startY)
        doc.setFont('helvetica', 'normal')
        doc.text(config.parametros.ordenarPor, 50, startY)
        startY += 7
      }
    }

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(14, startY + 3, 196, startY + 3)
    startY += 10

    let tableData: any[] = []
    let head: string[][] = []

    try {
      switch (config.tipo) {
        case "Inventario": {
          // Obtener fármacos
          const { data: farmacosData, error: farmacosError } = await supabase
            .from("farmaco")
            .select("id_farmaco, nombre_comercial, codigo, categoria, uni_medida")
          if (farmacosError) throw farmacosError

          // Obtener lotes para calcular stock
          const { data: lotesData, error: lotesError } = await supabase
            .from("lote")
            .select("farmaco_id_farmaco, cantidad")
          if (lotesError) throw lotesError

          // Calcular stock por fármaco
          const stockPorFarmaco = new Map<number, number>()
          if (lotesData) {
            lotesData.forEach((lote) => {
              stockPorFarmaco.set(
                lote.farmaco_id_farmaco,
                (stockPorFarmaco.get(lote.farmaco_id_farmaco) || 0) + lote.cantidad
              )
            })
          }

          // Procesar datos y filtrar según incluirStockCero
          let farmacosConStock = farmacosData?.map((f) => ({
            ...f,
            stock: stockPorFarmaco.get(f.id_farmaco) || 0
          })) || []

          // Filtrar fármacos con stock cero si no está marcada la opción
          const incluirStockCero = config.parametros?.incluirStockCero || false
          if (!incluirStockCero) {
            farmacosConStock = farmacosConStock.filter(f => f.stock > 0)
          }

          head = [["Nombre Comercial", "Código", "Categoría", "Stock", "U. Medida"]]
          tableData = farmacosConStock.map((f) => [
            f.nombre_comercial,
            f.codigo,
            f.categoria,
            f.stock.toString(),
            f.uni_medida,
          ])
          break
        }
        case "Alertas": {
          const { data, error } = await supabase
            .from("alerta")
            .select("*, farmaco:farmaco_id_farmaco(nombre_comercial)")
          if (error) throw error
          head = [["Fármaco", "Tipo Alerta", "Nivel", "Mensaje", "Vencimiento"]]
          tableData =
            data?.map((a) => [
              a.farmaco?.nombre_comercial || "N/A",
              a.tipo_alerta,
              a.nivel,
              a.mensaje,
              a.fec_vencimiento === "9999-12-31"
                ? "N/A"
                : new Date(a.fec_vencimiento).toLocaleDateString(),
            ]) || []
          break
        }
        case "Movimientos": {
          // Consultar solicitudes completadas (despachadas) con sus detalles
          let solicitudesQuery = supabase
            .from("solicitud")
            .select("id_sol, cod_sol, fec_creacion, farmacia_id_farmacia")
            .eq("estado", "Completada")

          // Aplicar filtros de fecha si se especifican
          if (config.parametros?.fechaInicio) {
            solicitudesQuery = solicitudesQuery.gte("fec_creacion", config.parametros.fechaInicio)
          }
          if (config.parametros?.fechaFin) {
            solicitudesQuery = solicitudesQuery.lte("fec_creacion", config.parametros.fechaFin)
          }

          // Aplicar filtro de farmacia si se especifica
          if (config.parametros?.farmacia) {
            solicitudesQuery = solicitudesQuery.eq("farmacia_id_farmacia", config.parametros.farmacia)
          }

          const { data: solicitudesData, error: solicitudesError } = await solicitudesQuery.order("fec_creacion", { ascending: false })
          
          if (solicitudesError) throw solicitudesError

          // Filtrar solicitudes para excluir las de compra (códigos C-XXXX)
          const solicitudesFiltradas = solicitudesData?.filter(solicitud => {
            const codigo = solicitud.cod_sol || ""
            return !codigo.startsWith("C-")
          }) || []

          // Obtener farmacias
          const { data: farmaciasData, error: farmaciasError } = await supabase
            .from("farmacia")
            .select("id_farmacia, nom_farma")
          
          if (farmaciasError) throw farmaciasError

          // Obtener detalles de solicitudes despachadas
          const { data: detallesData, error: detallesError } = await supabase
            .from("detalle_solicitud")
            .select("solicitud_id_sol, id_farmaco, cant_despacho, fec_despacho, estado_fmc")
            .eq("estado_fmc", "Despachado")
            .in("solicitud_id_sol", solicitudesFiltradas?.map(s => s.id_sol) || [])

          if (detallesError) throw detallesError

          // Obtener fármacos
          const { data: farmacosData, error: farmacosError } = await supabase
            .from("farmaco")
            .select("id_farmaco, nombre_comercial")
          
          if (farmacosError) throw farmacosError

          // Crear mapas para relaciones
          const farmaciasMap = new Map(farmaciasData?.map(f => [f.id_farmacia, f.nom_farma]) || [])
          const farmacosMap = new Map(farmacosData?.map(f => [f.id_farmaco, f.nombre_comercial]) || [])

          head = [["N° Solicitud", "Farmacia", "Fármaco", "Cantidad Despachada", "Fecha Despacho", "Fecha Solicitud", "Días Transcurridos"]]
          
          tableData = []
          solicitudesFiltradas?.forEach((solicitud) => {
            const detallesSolicitud = detallesData?.filter(d => d.solicitud_id_sol === solicitud.id_sol) || []
            
            detallesSolicitud.forEach((detalle) => {
              // Calcular días transcurridos entre solicitud y despacho
              const fechaSolicitud = new Date(solicitud.fec_creacion)
              const fechaDespacho = detalle.fec_despacho ? new Date(detalle.fec_despacho) : null
              const diasTranscurridos = fechaDespacho 
                ? Math.ceil((fechaDespacho.getTime() - fechaSolicitud.getTime()) / (1000 * 60 * 60 * 24))
                : 0

              tableData.push([
                solicitud.cod_sol || `SOL-${solicitud.id_sol}`,
                farmaciasMap.get(solicitud.farmacia_id_farmacia) || "N/A",
                farmacosMap.get(detalle.id_farmaco) || "N/A",
                detalle.cant_despacho?.toString() || "0",
                detalle.fec_despacho 
                  ? new Date(detalle.fec_despacho).toLocaleDateString()
                  : "N/A",
                new Date(solicitud.fec_creacion).toLocaleDateString(),
                diasTranscurridos > 0 ? `${diasTranscurridos} días` : "Mismo día",
              ])
            })
          })

          // Ordenar por fecha de despacho más reciente
          tableData.sort((a, b) => {
            const fechaA = new Date(a[4] === "N/A" ? a[5] : a[4])
            const fechaB = new Date(b[4] === "N/A" ? b[5] : b[4])
            return fechaB.getTime() - fechaA.getTime()
          })
          break
        }
        case "Stock Bajo": {
          // Obtener configuración de alertas para el umbral de stock mínimo
          const alertConfig = JSON.parse(
            localStorage.getItem("alertConfig") ||
              '{ "diasVencimiento": 30, "cantidadMinimaStock": 50 }'
          )

          // Obtener fármacos
          const { data: farmacosData, error: farmacosError } = await supabase
            .from("farmaco")
            .select("id_farmaco, nombre_comercial, categoria")
          if (farmacosError) throw farmacosError

          // Obtener lotes para calcular stock
          const { data: lotesData, error: lotesError } = await supabase
            .from("lote")
            .select("farmaco_id_farmaco, cantidad")
          if (lotesError) throw lotesError

          // Calcular stock por fármaco
          const stockPorFarmaco = new Map<number, number>()
          if (lotesData) {
            lotesData.forEach((lote) => {
              stockPorFarmaco.set(
                lote.farmaco_id_farmaco,
                (stockPorFarmaco.get(lote.farmaco_id_farmaco) || 0) + lote.cantidad
              )
            })
          }

          // Filtrar fármacos con stock bajo (stock <= umbral configurado)
          const farmacosStockBajo = farmacosData?.filter((farmaco) => {
            const stockActual = stockPorFarmaco.get(farmaco.id_farmaco) || 0
            return stockActual <= alertConfig.cantidadMinimaStock
          }).map((farmaco) => {
            const stockActual = stockPorFarmaco.get(farmaco.id_farmaco) || 0
            const umbral = alertConfig.cantidadMinimaStock
            const porcentajeStock = umbral > 0 ? Math.round((stockActual / umbral) * 100) : 0
            const deficit = Math.max(0, umbral - stockActual)
            
            return {
              ...farmaco,
              stockActual,
              umbral,
              porcentajeStock,
              deficit
            }
          }) || []

          // Aplicar ordenamiento según el parámetro seleccionado
          const ordenarPor = config.parametros?.ordenarPor || "Porcentaje de stock"
          farmacosStockBajo.sort((a, b) => {
            switch (ordenarPor) {
              case "Porcentaje de stock":
                return a.porcentajeStock - b.porcentajeStock
              case "Déficit (unidades faltantes)":
                return b.deficit - a.deficit
              case "Nombre":
                return a.nombre_comercial.localeCompare(b.nombre_comercial)
              case "Categoría":
                return a.categoria.localeCompare(b.categoria)
              default:
                return a.porcentajeStock - b.porcentajeStock
            }
          })

          head = [["Fármaco", "Categoría", "Stock Actual", "Umbral Mínimo", "% Stock", "Déficit"]]
          tableData = farmacosStockBajo.map((farmaco) => [
            farmaco.nombre_comercial,
            farmaco.categoria,
            farmaco.stockActual.toString(),
            farmaco.umbral.toString(),
            `${farmaco.porcentajeStock}%`,
            farmaco.deficit.toString(),
          ])
          break
        }
        case "Vencimientos": {
          // Obtener el número de días del parámetro o usar 30 por defecto
          const diasVencimiento = parseInt(config.parametros?.dias) || 30
          
          // Calcular fecha límite
          const today = new Date()
          const fechaLimite = new Date()
          fechaLimite.setDate(today.getDate() + diasVencimiento)

          // Obtener lotes que vencen en el período especificado
          const { data: lotesData, error: lotesError } = await supabase
            .from("lote")
            .select("id_lote, num_lote, fec_venci, cantidad, farmaco_id_farmaco")
            .gte("fec_venci", today.toISOString().split('T')[0])
            .lte("fec_venci", fechaLimite.toISOString().split('T')[0])
            .gt("cantidad", 0)
          
          if (lotesError) throw lotesError

          // Obtener fármacos relacionados
          const { data: farmacosData, error: farmacosError } = await supabase
            .from("farmaco")
            .select("id_farmaco, nombre_comercial, categoria")
          
          if (farmacosError) throw farmacosError

          // Crear mapa de fármacos
          const farmacosMap = new Map(farmacosData?.map(f => [f.id_farmaco, f]) || [])

          // Procesar datos de vencimientos
          const lotesConVencimiento = lotesData?.map((lote) => {
            const farmaco = farmacosMap.get(lote.farmaco_id_farmaco)
            const fechaVencimiento = new Date(lote.fec_venci)
            const diasRestantes = Math.ceil((fechaVencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
            return {
              ...lote,
              farmaco: farmaco || { nombre_comercial: "N/A", categoria: "N/A" },
              fechaVencimiento,
              diasRestantes
            }
          }) || []

          // Aplicar ordenamiento según el parámetro seleccionado
          const ordenarPor = config.parametros?.ordenarPor || "Días restantes"
          lotesConVencimiento.sort((a, b) => {
            switch (ordenarPor) {
              case "Días restantes":
                return a.diasRestantes - b.diasRestantes
              default:
                return a.diasRestantes - b.diasRestantes
            }
          })

          head = [["Fármaco", "Categoría", "N° Lote", "Cantidad", "Fecha Vencimiento", "Días Restantes"]]
          tableData = lotesConVencimiento.map((lote) => [
            lote.farmaco.nombre_comercial,
            lote.farmaco.categoria,
            lote.num_lote,
            lote.cantidad.toString(),
            new Date(lote.fec_venci).toLocaleDateString(),
            lote.diasRestantes > 0 ? `${lote.diasRestantes} días` : "Vencido",
          ])
          break
        }
        // Agrega más casos para otros tipos de reportes
      }

      autoTable(doc, {
        head,
        body: tableData,
        startY,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        showHead: 'everyPage',
      })

      // Agregar estadísticas para reporte de movimientos
      if (config.tipo === "Movimientos" && tableData.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || startY + 20
        
        // Calcular estadísticas
        const totalDespachos = tableData.length
        const cantidadTotal = tableData.reduce((sum, row) => sum + parseInt(row[3]), 0)
        const farmaciasUnicas = new Set(tableData.map(row => row[1])).size
        
        // Sección de estadísticas con fondo
        doc.setFillColor(248, 249, 250)
        doc.rect(14, finalY + 10, 182, 35, 'F')
        
        // Título de estadísticas
        doc.setTextColor(52, 73, 94)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('RESUMEN ESTADÍSTICO', 20, finalY + 22)
        
        // Estadísticas en columnas
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`• Total de despachos: ${totalDespachos}`, 20, finalY + 30)
        doc.text(`• Cantidad despachada: ${cantidadTotal.toLocaleString()} unidades`, 20, finalY + 36)
        doc.text(`• Farmacias atendidas: ${farmaciasUnicas}`, 20, finalY + 42)
      }

      // Agregar estadísticas para reporte de stock bajo
      if (config.tipo === "Stock Bajo" && tableData.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || startY + 20
        
        // Calcular estadísticas
        const totalFarmacosStockBajo = tableData.length
        const promedioStockActual = tableData.reduce((sum, row) => sum + parseInt(row[2]), 0) / tableData.length
        const deficitTotal = tableData.reduce((sum, row) => sum + parseInt(row[5]), 0)
        const categoriasAfectadas = new Set(tableData.map(row => row[1])).size
        
        // Obtener el umbral de la configuración
        const alertConfigLocal = JSON.parse(
          localStorage.getItem("alertConfig") ||
            '{ "diasVencimiento": 30, "cantidadMinimaStock": 50 }'
        )
        
        // Sección de estadísticas con fondo
        doc.setFillColor(248, 249, 250)
        doc.rect(14, finalY + 10, 182, 42, 'F')
        
        // Título de estadísticas
        doc.setTextColor(52, 73, 94)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('📊 RESUMEN ESTADÍSTICO', 20, finalY + 22)
        
        // Estadísticas en dos columnas
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`• Fármacos con stock bajo: ${totalFarmacosStockBajo}`, 20, finalY + 30)
        doc.text(`• Umbral configurado: ${alertConfigLocal.cantidadMinimaStock} unidades`, 20, finalY + 36)
        doc.text(`• Promedio stock actual: ${Math.round(promedioStockActual)} unidades`, 20, finalY + 42)
        doc.text(`• Déficit total: ${deficitTotal.toLocaleString()} unidades`, 110, finalY + 30)
        doc.text(`• Categorías afectadas: ${categoriasAfectadas}`, 110, finalY + 36)
      }

      // Agregar estadísticas para reporte de vencimientos
      if (config.tipo === "Vencimientos" && tableData.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || startY + 20
        
        // Calcular estadísticas
        const totalLotesVenciendo = tableData.length
        const cantidadTotalVenciendo = tableData.reduce((sum, row) => sum + parseInt(row[3]), 0)
        const categoriasAfectadas = new Set(tableData.map(row => row[1])).size
        const farmacosAfectados = new Set(tableData.map(row => row[0])).size
        
        // Calcular promedio de días restantes (excluyendo vencidos)
        const diasRestantesArray = tableData
          .map(row => row[5])
          .filter(dias => dias !== "Vencido")
          .map(dias => parseInt(dias.replace(" días", "")))
        
        const promedioDiasRestantes = diasRestantesArray.length > 0 
          ? Math.round(diasRestantesArray.reduce((sum, dias) => sum + dias, 0) / diasRestantesArray.length)
          : 0

        const diasVencimiento = parseInt(config.parametros?.dias) || 30
        
        // Sección de estadísticas con fondo
        const alturaSeccion = promedioDiasRestantes > 0 ? 48 : 42
        doc.setFillColor(248, 249, 250)
        doc.rect(14, finalY + 10, 182, alturaSeccion, 'F')
        
        // Título de estadísticas
        doc.setTextColor(52, 73, 94)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('📊 RESUMEN ESTADÍSTICO', 20, finalY + 22)
        
        // Estadísticas en dos columnas
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`• Lotes próximos a vencer: ${totalLotesVenciendo}`, 20, finalY + 30)
        doc.text(`• Período analizado: ${diasVencimiento} días`, 20, finalY + 36)
        doc.text(`• Cantidad total afectada: ${cantidadTotalVenciendo.toLocaleString()} unidades`, 20, finalY + 42)
        doc.text(`• Fármacos afectados: ${farmacosAfectados}`, 110, finalY + 30)
        doc.text(`• Categorías afectadas: ${categoriasAfectadas}`, 110, finalY + 36)
        if (promedioDiasRestantes > 0) {
          doc.text(`• Promedio días restantes: ${promedioDiasRestantes} días`, 110, finalY + 42)
        }
      }

      // Agregar pie de página
      const pageHeight = doc.internal.pageSize.height
      doc.setFillColor(240, 240, 240)
      doc.rect(0, pageHeight - 20, 210, 20, 'F')
      
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Sistema de Gestión de Bodega Farmacéutica Centralizada', 14, pageHeight - 12)
      doc.text(`Generado el ${fecha} a las ${hora}`, 14, pageHeight - 6)
      
      // Número de página
      doc.text(`Página 1`, 196, pageHeight - 9, { align: 'right' })

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