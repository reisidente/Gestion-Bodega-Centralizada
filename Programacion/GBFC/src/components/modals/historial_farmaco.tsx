import { BaseModal } from "./base"
import { useEffect, useState } from "react"
import { supabase } from "../../libs/supabase"

interface HistorialAjuste {
  id_ajuste: number
  tipo_ajuste: "Entrada" | "Salida"
  cant_ajuste: number
  cant_ant: number
  cant_nueva: number
  motivo: string
  fec_ajuste: string
  lote_id_lote: number
}

interface MovimientoDiario {
  fecha: string
  entradas: number
  salidas: number
  stockFinal: number
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
  farmacoId
}: HistorialFarmacoModalProps) {
  const [historial, setHistorial] = useState<HistorialAjuste[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!open || !farmacoId) return

      setLoading(true)
      try {
        // Obtener todos los lotes del fármaco
        const { data: lotes } = await supabase
          .from('lote')
          .select('id_lote')
          .eq('farmaco_id_farmaco', farmacoId)

        if (!lotes || lotes.length === 0) {
          setHistorial([])
          return
        }

        const loteIds = lotes.map(l => l.id_lote)

        // Obtener todos los ajustes de estos lotes
        const { data: ajustes } = await supabase
          .from('historial_ajuste')
          .select('*')
          .in('lote_id_lote', loteIds)
          .order('fec_ajuste', { ascending: false })

        if (ajustes) {
          setHistorial(ajustes as HistorialAjuste[])
        }
      } catch (error) {
        console.error('Error al cargar historial:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistorial()
  }, [open, farmacoId])

  // Agrupar ajustes por fecha
  const historialAgrupado = historial.reduce<Record<string, MovimientoDiario>>((acc, ajuste) => {
    const fecha = ajuste.fec_ajuste
    if (!acc[fecha]) {
      acc[fecha] = {
        fecha,
        entradas: 0,
        salidas: 0,
        stockFinal: 0
      }
    }

    if (ajuste.tipo_ajuste === "Entrada") {
      acc[fecha].entradas += ajuste.cant_ajuste
    } else {
      acc[fecha].salidas += ajuste.cant_ajuste
    }

    // Actualizamos el stock final con el valor más reciente del día
    acc[fecha].stockFinal = ajuste.cant_nueva

    return acc
  }, {})

  const historialFinal = Object.values(historialAgrupado)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

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
                <th className="border border-gray-300 px-6 py-3">Fecha</th>
                <th className="border border-gray-300 px-6 py-3">Entrada</th>
                <th className="border border-gray-300 px-6 py-3">Salida</th>
                <th className="border border-gray-300 px-6 py-3">Stock Total</th>
              </tr>
            </thead>
            <tbody>
              {historialFinal.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                historialFinal.map((item, idx) => (
                  <tr
                    key={item.fecha}
                    className={idx % 2 === 1 ? "bg-gray-50" : ""}
                  >
                    <td className="border border-gray-300 px-6 py-3 text-gray-600">
                      {new Date(item.fecha).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-6 py-3">
                      {item.entradas > 0 ? (
                        <span className="text-green-600 font-medium">+{item.entradas}</span>
                      ) : "-"}
                    </td>
                    <td className="border border-gray-300 px-6 py-3">
                      {item.salidas > 0 ? (
                        <span className="text-red-600 font-medium">-{item.salidas}</span>
                      ) : "-"}
                    </td>
                    <td className="border border-gray-300 px-6 py-3 font-semibold">
                      {item.stockFinal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </BaseModal>
  )
}