import { BaseModal } from "./base"
import { useEffect, useState } from "react"
import { supabase } from "../../libs/supabase"

// Función para formatear fecha YYYY-MM-DD a DD/MM/YYYY sin problemas de zona horaria
function formatearFechaHistorial(fechaString: string): string {
  if (!fechaString) return "-"
  
  // Si la fecha ya viene en formato YYYY-MM-DD, procesarla directamente
  const partes = fechaString.split('-')
  if (partes.length === 3) {
    const [año, mes, dia] = partes
    return `${dia}/${mes}/${año}`
  }
  
  // Fallback para otros formatos
  return fechaString
}

interface Movimiento {
  id: string
  fecha: string
  entradas: number
  salidas: number
  stockFinal: number
  tipo: string
  lote?: string
  motivo?: string
  tipoMovimiento?: string
}

interface HistorialFarmacoModalProps {
  open: boolean
  onClose: () => void
  farmaco: string
  farmacoId: number
}

export function HistorialFarmacoModal({
  open,
  onClose,
  farmaco,
  farmacoId,
}: HistorialFarmacoModalProps) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 10

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!open || !farmacoId) return

      setLoading(true)
      setPaginaActual(1) // Resetear a la primera página cuando se abre el modal
      try {
        // 1. Obtener todos los lotes del fármaco
        const { data: lotes, error: lotesError } = await supabase
          .from("lote")
          .select("*")
          .eq("farmaco_id_farmaco", farmacoId)

        if (lotesError) throw lotesError

        if (!lotes || lotes.length === 0) {
          setMovimientos([])
          setLoading(false)
          return
        }

        const loteIds = lotes.map(l => l.id_lote)

        // 2. Obtener todos los ajustes de estos lotes
        const { data: ajustes, error: ajustesError } = await supabase
          .from("historial_ajuste")
          .select("*")
          .in("lote_id_lote", loteIds)
          .order("fec_ajuste", { ascending: false })

        if (ajustesError) throw ajustesError

        // 3. Crear movimientos para lotes que no tienen registro en historial_ajuste
        // (lotes registrados antes de implementar el historial automático)
        const lotesConHistorial = new Set((ajustes || []).map(a => a.lote_id_lote));
        const lotesSinHistorial = lotes.filter(lote => !lotesConHistorial.has(lote.id_lote));
        
        const movimientosLotesSinHistorial = lotesSinHistorial.map(lote => ({
          id: `lote-legacy-${lote.id_lote}`,
          fecha: lote.fec_fabri, // Fecha de fabricación como aproximación
          entradas: lote.cantidad,
          salidas: 0,
          stockFinal: 0, // Se calculará después
          tipo: "lote_legacy",
          lote: lote.num_lote
        }))

        // 4. Crear movimientos de ajustes
        const movimientosAjustes = (ajustes || []).map((ajuste, index) => ({
          id: `ajuste-${ajuste.lote_id_lote}-${index}`,
          fecha: ajuste.fec_ajuste,
          entradas: ajuste.tipo_ajuste === "Entrada" ? ajuste.cant_ajuste : 0,
          salidas: ajuste.tipo_ajuste === "Salida" ? ajuste.cant_ajuste : 0,
          stockFinal: 0, // Se calculará después
          tipo: ajuste.tipo_ajuste === "Entrada" ? "entrada" : "salida",
          motivo: ajuste.motivo,
          tipoMovimiento: ajuste.motivo // Para distinguir tipos de movimientos
        }))

        // 5. Combinar y ordenar todos los movimientos por fecha (más reciente primero)
        const todosMovimientos = [...movimientosLotesSinHistorial, ...movimientosAjustes]
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

        // 6. Calcular stock total del fármaco en cada punto del tiempo
        // Primero obtenemos el stock actual de todos los lotes
        const { data: lotesActuales } = await supabase
          .from("lote")
          .select("cantidad")
          .eq("farmaco_id_farmaco", farmacoId)

        const stockActualTotal = (lotesActuales || []).reduce((sum, lote) => sum + lote.cantidad, 0)
        
        // Calcular el stock histórico basado en los movimientos (ahora de más nuevo a más viejo)
        const movimientosConStock = todosMovimientos.map((mov, index) => {
          // Para cada movimiento, calcular cuánto stock habría después de este movimiento
          // Como ahora van de más nuevo a más viejo, sumamos todos los movimientos anteriores al stock actual
          let ajusteAnteriores = 0
          for (let i = 0; i < index; i++) {
            const movAnterior = todosMovimientos[i]
            // Las entradas aumentan el stock hacia atrás, las salidas lo reducen
            ajusteAnteriores += movAnterior.entradas - movAnterior.salidas
          }
          
          const stockEnEseMomento = stockActualTotal - ajusteAnteriores
          
          return {
            ...mov,
            stockFinal: Math.max(0, stockEnEseMomento)
          }
        })

        setMovimientos(movimientosConStock)
      } catch (error) {
        console.error("Error al cargar historial:", error)
        setMovimientos([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [open, farmacoId])

  // Calcular datos de paginación
  const totalPaginas = Math.ceil(movimientos.length / registrosPorPagina)
  const indiceInicio = (paginaActual - 1) * registrosPorPagina
  const indiceFin = indiceInicio + registrosPorPagina
  const movimientosPaginados = movimientos.slice(indiceInicio, indiceFin)

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina)
    }
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Historial de Stock: {farmaco}
      </h2>
      <p className="text-gray-500 mb-6">
        Registro histórico de movimientos
      </p>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-gray-400">
            Cargando historial...
          </div>
        ) : (
          <table className="w-full border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left">Fecha</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Tipo</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Entrada</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Salida</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Stock Total</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {movimientosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                movimientosPaginados.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 1 ? "bg-gray-50" : ""}
                  >
                    <td className="border border-gray-300 px-4 py-3 text-gray-600">
                      {formatearFechaHistorial(item.fecha)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.tipo === 'lote_legacy' 
                          ? 'bg-orange-100 text-orange-800' 
                          : item.tipo === 'entrada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.tipo === 'lote_legacy' 
                          ? 'Lote Existente' 
                          : item.tipo === 'entrada' 
                          ? 'Entrada' 
                          : 'Salida'
                        }
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {item.entradas > 0 ? (
                        <span className="text-green-600 font-medium">
                          +{item.entradas}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right">
                      {item.salidas > 0 ? (
                        <span className="text-red-600 font-medium">
                          -{item.salidas}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {item.stockFinal}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-600 text-sm">
                      {item.tipo === 'lote_legacy' 
                        ? `Lote: ${item.lote || 'N/A'} (existente)` 
                        : item.tipoMovimiento === 'Despacho'
                        ? `Despacho a farmacia`
                        : item.tipoMovimiento === 'Registro'
                        ? `Registro de nuevo lote`
                        : item.motivo === 'Ajuste manual'
                        ? `Ajuste manual de stock`
                        : item.motivo === 'Entrada'
                        ? `Entrada de mercadería`
                        : item.motivo === 'Salida'
                        ? `Salida de mercadería`
                        : `${item.motivo || 'Movimiento de stock'}`
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        
        {/* Controles de paginación */}
        {!loading && movimientos.length > registrosPorPagina && (
          <div className="flex items-center justify-between mt-4 px-4">
            <div className="text-sm text-gray-500">
              Mostrando {indiceInicio + 1} a {Math.min(indiceFin, movimientos.length)} de {movimientos.length} registros
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {/* Números de página */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let numeroPagina
                  if (totalPaginas <= 5) {
                    numeroPagina = i + 1
                  } else if (paginaActual <= 3) {
                    numeroPagina = i + 1
                  } else if (paginaActual >= totalPaginas - 2) {
                    numeroPagina = totalPaginas - 4 + i
                  } else {
                    numeroPagina = paginaActual - 2 + i
                  }
                  
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => irAPagina(numeroPagina)}
                      className={`px-3 py-1 text-sm border rounded ${
                        paginaActual === numeroPagina
                          ? 'bg-black text-white border-black'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => irAPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  )
}