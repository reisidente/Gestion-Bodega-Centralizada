import { useState, useEffect } from "react"
import { BaseModal } from "./base"
import { supabase } from "../../libs/supabase"
import { getFechaLocal } from "../../libs/utils"

interface FarmacoDetalle {
  id_detalle?: number
  id_farmaco?: number
  farmaco: string
  cantidadSolicitada: number
  cantidadAprobada?: number | null
  estado: string
  cantidadADespachar?: number
}

interface DetalleSolicitudModalProps {
  open: boolean
  onClose: () => void
  solicitud: {
    id: string
    id_sol?: number // ID de la solicitud para la actualización
    farmacia: string
    fechaCreacion: string
    estado: string
    prioridad: string
    motivo?: string
    fechaAprobacion?: string
    notas?: string
    farmacos: FarmacoDetalle[]
  }
  onSave?: (solicitud: any) => void
}

export function DetalleSolicitudModal({
  open,
  onClose,
  solicitud,
  onSave,
}: DetalleSolicitudModalProps) {
  const [farmacos, setFarmacos] = useState<FarmacoDetalle[]>([])
  const [loading, setLoading] = useState(false)

  const isCompletada = solicitud.estado === "Completada"
  const isOrdenCompra = solicitud.id.startsWith("C-")

  useEffect(() => {
    if (solicitud && solicitud.farmacos) {
      if (isCompletada) {
        // Si la solicitud está completada, mostrar todos los fármacos despachados.
        const farmacosDespachados = solicitud.farmacos.filter(
          (f) => f.estado === "Despachado"
        )
        setFarmacos(farmacosDespachados)
      } else {
        // Si está pendiente, mostrar solo los fármacos pendientes para despachar.
        const farmacosPendientes = solicitud.farmacos
          .filter((f) => f.estado === "Pendiente")
          .map((f) => ({
            ...f,
            // Para órdenes de compra, la cantidad a despachar es la solicitada.
            cantidadADespachar: isOrdenCompra ? f.cantidadSolicitada : 0,
          }))
        setFarmacos(farmacosPendientes)
      }
    }
  }, [solicitud, isCompletada, isOrdenCompra])

  const handleCantidadChange = (idx: number, value: number) => {
    // No permitir cambios en órdenes de compra
    if (isOrdenCompra) return

    setFarmacos((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, cantidadADespachar: value } : f))
    )
  }

  const handleGuardar = async () => {
    setLoading(true)

    const promises = []

    for (const f of farmacos) {
      if (!f.id_detalle || !f.id_farmaco || !solicitud.id_sol) continue

      const aDespachar = f.cantidadADespachar || 0
      const originalPendiente = f.cantidadSolicitada

      if (aDespachar <= 0) continue

      if (aDespachar > originalPendiente) {
        alert(`No se puede despachar más de lo solicitado para ${f.farmaco}.`)
        continue
      }

      // Si NO es una orden de compra, se actualiza el inventario
      if (!isOrdenCompra) {
        // --- INVENTORY UPDATE LOGIC ---
        // 1. Fetch lots and check for sufficient stock
        const { data: lotes, error: lotesError } = await supabase
          .from("lote")
          .select("id_lote, cantidad")
          .eq("farmaco_id_farmaco", f.id_farmaco)
          .gt("cantidad", 0)
          .order("fec_venci", { ascending: true })

        if (lotesError) {
          console.error(`Error fetching lotes for farmaco ${f.id_farmaco}:`, lotesError)
          alert(`Error al obtener lotes para ${f.farmaco}. No se pudo continuar.`)
          setLoading(false)
          return
        }

        const stockTotalDisponible = lotes?.reduce((sum, l) => sum + l.cantidad, 0) || 0
        if (aDespachar > stockTotalDisponible) {
          alert(`Stock insuficiente para ${f.farmaco}. Solicitado: ${aDespachar}, Disponible: ${stockTotalDisponible}`)
          continue // Skip this farmaco and check the next one
        }

        // 2. Distribute dispatch quantity among lots (FEFO)
        let cantidadRestanteADespachar = aDespachar
        for (const lote of lotes) {
          if (cantidadRestanteADespachar <= 0) break
          const cantidadEnLote = lote.cantidad
          const aDescontar = Math.min(cantidadRestanteADespachar, cantidadEnLote)
          
          // Actualizar cantidad en lote
          promises.push(
            supabase
              .from("lote")
              .update({ cantidad: cantidadEnLote - aDescontar })
              .eq("id_lote", lote.id_lote)
          )
          
          // Registrar el despacho en el historial
          promises.push(
            supabase.from("historial_ajuste").insert({
              tipo_ajuste: "Salida",
              cant_ajuste: aDescontar,
              cant_ant: cantidadEnLote,
              cant_nueva: cantidadEnLote - aDescontar,
              motivo: "Despacho",
              fec_ajuste: getFechaLocal(),
              lote_id_lote: lote.id_lote,
            })
          )
          
          cantidadRestanteADespachar -= aDescontar
        }
        
        // --- END INVENTORY UPDATE ---
      }

      // Update original detail line
      promises.push(
        supabase
          .from("detalle_solicitud")
          .update({
            cant_despacho: aDespachar,
            estado_fmc: "Despachado",
            fec_despacho: getFechaLocal(),
          })
          .eq("id_detalle", f.id_detalle)
      )

      // Create new detail line for remaining quantity
      const cantidadRestante = originalPendiente - aDespachar
      if (cantidadRestante > 0) {
        promises.push(
          supabase.from("detalle_solicitud").insert({
            solicitud_id_sol: solicitud.id_sol,
            id_farmaco: f.id_farmaco,
            cant_despacho: cantidadRestante,
            estado_fmc: "Pendiente",
          })
        )
      }
    }

    await Promise.all(promises)

    // Check if the entire request is complete
    if (solicitud.id_sol) {
      const { data: pendientes, error } = await supabase
        .from("detalle_solicitud")
        .select("id_detalle")
        .eq("solicitud_id_sol", solicitud.id_sol)
        .eq("estado_fmc", "Pendiente")

      if (!error) {
        const nuevoEstado = pendientes.length === 0 ? "Completada" : "Pendiente"
        await supabase
          .from("solicitud")
          .update({ estado: nuevoEstado })
          .eq("id_sol", solicitud.id_sol)
      }
    }

    setLoading(false)
    onSave?.({})
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-3xl">
      <h2 className="text-2xl font-bold mb-1">
        {isOrdenCompra ? "Orden de Compra" : "Solicitud"}: {solicitud.id}
      </h2>
      <p className="text-gray-500 mb-6">
        {isOrdenCompra
          ? "Detalles de la orden de compra"
          : "Detalles de la solicitud de despacho"}
      </p>

      {/* Información de la Solicitud */}
      <div className="mb-6 border-b pb-4">
        <h3 className="font-semibold text-lg mb-2">Información de la Solicitud</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Farmacia</div>
            <div>{solicitud.farmacia}</div>
          </div>
          <div>
            <div className="text-gray-500">Fecha de Creación</div>
            <div>{solicitud.fechaCreacion}</div>
          </div>
          <div>
            <div className="text-gray-500">Estado</div>
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              {isOrdenCompra && solicitud.estado === 'Completada' ? 'Solicitado' : solicitud.estado}
            </span>
          </div>
          <div>
            <div className="text-gray-500">Prioridad</div>
            <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              {solicitud.prioridad}
            </span>
          </div>
          {solicitud.motivo && (
            <div>
              <div className="text-gray-500">Motivo</div>
              <div>{solicitud.motivo}</div>
            </div>
          )}
          {solicitud.fechaAprobacion && (
            <div>
              <div className="text-gray-500">Fecha de Aprobación</div>
              <div>{solicitud.fechaAprobacion}</div>
            </div>
          )}
        </div>
        {solicitud.notas && (
          <div className="mt-3">
            <div className="text-gray-500">Notas</div>
            <div>{solicitud.notas}</div>
          </div>
        )}
      </div>

      {/* Detalles de la Solicitud */}
      <div>
        <h3 className="font-semibold text-2xl mb-1">
          {isCompletada
            ? isOrdenCompra ? "Resumen de Orden" : "Resumen de Despacho"
            : isOrdenCompra
            ? "Fármacos a Solicitar"
            : "Fármacos Pendientes"}
        </h3>
        <p className="text-gray-400 mb-4">
          {isCompletada
            ? isOrdenCompra ? "Detalle de los fármacos solicitados en esta orden." : "Detalle de los fármacos despachados en esta solicitud."
            : isOrdenCompra
            ? "Detalle de los fármacos solicitados en esta orden."
            : "Ingrese la cantidad a despachar para cada fármaco."}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            {isCompletada ? (
              <>
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-gray-500 py-2">Fármaco</th>
                    <th className="text-left font-medium text-gray-500 py-2">
                      {isOrdenCompra ? "Cantidad Solicitada" : "Cantidad Despachada"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {farmacos.map((f) => (
                    <tr key={f.id_detalle} className="border-b last:border-b-0">
                      <td className="py-4">{f.farmaco}</td>
                      <td className="py-4">{f.cantidadSolicitada}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium text-gray-500 py-2">Fármaco</th>
                    <th className="text-left font-medium text-gray-500 py-2">
                      {isOrdenCompra ? "Cantidad Solicitada" : "Cantidad Pendiente"}
                    </th>
                    <th className="text-left font-medium text-gray-500 py-2">
                      {isOrdenCompra ? "Cantidad a Solicitar" : "Cantidad a Despachar"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {farmacos.map((f, idx) => (
                    <tr key={f.id_detalle} className="border-b last:border-b-0">
                      <td className="py-4">{f.farmaco}</td>
                      <td className="py-4">{f.cantidadSolicitada}</td>
                      <td className="py-4">
                        <input
                          type="number"
                          min={0}
                          max={f.cantidadSolicitada}
                          value={f.cantidadADespachar}
                          onChange={(e) => handleCantidadChange(idx, Number(e.target.value))}
                          className="border rounded px-2 py-1 w-24"
                          disabled={isCompletada || isOrdenCompra}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
          {farmacos.length === 0 && (
            <p className="text-center py-4 text-gray-500">
              {isCompletada
                ? isOrdenCompra ? "No se encontraron fármacos en la orden." : "No se encontraron fármacos despachados."
                : "No hay fármacos pendientes en esta solicitud."}
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 mt-8">
        <button
          className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
          onClick={onClose}
          disabled={loading}
        >
          {isCompletada ? "Cerrar" : "Cancelar"}
        </button>
        {!isCompletada && (
          <button
            className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
            onClick={handleGuardar}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        )}
      </div>
    </BaseModal>
  )
}