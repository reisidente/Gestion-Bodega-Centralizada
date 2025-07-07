import { useState, useEffect } from "react"
import { BaseModal } from "./base"
import { supabase } from "../../libs/supabase"
import { getFechaLocal } from "../../libs/utils"

// Función para formatear fecha
const formatearFecha = (fecha: string) => {
  if (!fecha) return "-"
  const partes = fecha.split('-')
  if (partes.length === 3) {
    const [año, mes, dia] = partes
    return `${dia}/${mes}/${año}`
  }
  return fecha
}

interface FarmacoDetalle {
  id_detalle?: number
  id_farmaco?: number
  farmaco: string
  cantidadSolicitada: number
  cantidadAprobada?: number | null
  estado: string
  cantidadADespachar?: number
  // Información adicional del fármaco
  codigo?: string
  categoria?: string
  principio_activo?: string
  presentacion?: string
  concentracion?: string
  uni_medida?: string
  // Información del lote seleccionado
  lote_info?: {
    num_lote: string
    fec_venci: string
    cantidad: number
    precio: number
  }
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
    const cargarDetallesFarmacos = async () => {
      if (!solicitud?.farmacos || !open) return

      setLoading(true)

      try {
        // Obtener IDs únicos de fármacos
        const farmacoIds = [...new Set(solicitud.farmacos.map(f => f.id_farmaco).filter(Boolean))]
        
        if (farmacoIds.length === 0) {
          setFarmacos(solicitud.farmacos)
          setLoading(false)
          return
        }

        // Obtener información completa de fármacos
        const { data: farmacosCompletos } = await supabase
          .from("farmaco")
          .select("id_farmaco, codigo, nombre_comercial, categoria, principio_activo, presentacion, concentracion, uni_medida")
          .in("id_farmaco", farmacoIds)

        // Obtener lotes disponibles para cada fármaco
        const { data: lotesDisponibles } = await supabase
          .from("lote")
          .select("id_lote, num_lote, fec_venci, cantidad, precio, farmaco_id_farmaco")
          .in("farmaco_id_farmaco", farmacoIds)
          .gt("cantidad", 0)
          .eq("activo", true)
          .order("fec_venci", { ascending: true })

        // Si la solicitud está completada, obtener la cantidad original solicitada
        let cantidadesOriginales = new Map()
        if (isCompletada && solicitud.id_sol) {
          const { data: detallesCompletos } = await supabase
            .from("detalle_solicitud")
            .select("id_farmaco, cant_despacho, estado_fmc")
            .eq("solicitud_id_sol", solicitud.id_sol)

          if (detallesCompletos) {
            // Agrupar por farmaco y sumar las cantidades totales (despachadas + pendientes)
            detallesCompletos.forEach(detalle => {
              const actual = cantidadesOriginales.get(detalle.id_farmaco) || 0
              cantidadesOriginales.set(detalle.id_farmaco, actual + detalle.cant_despacho)
            })
          }
        }

        // Enriquecer los fármacos con información completa
        const farmacosEnriquecidos = solicitud.farmacos.map(farmaco => {
          const infoCompleta = farmacosCompletos?.find(f => f.id_farmaco === farmaco.id_farmaco)
          const mejorLote = lotesDisponibles?.find(l => l.farmaco_id_farmaco === farmaco.id_farmaco)
          
          // Para solicitudes completadas, usar la cantidad original total
          const cantidadMostrar = isCompletada && cantidadesOriginales.has(farmaco.id_farmaco)
            ? cantidadesOriginales.get(farmaco.id_farmaco)
            : farmaco.cantidadSolicitada

          return {
            ...farmaco,
            cantidadSolicitada: cantidadMostrar, // Cantidad original solicitada
            codigo: infoCompleta?.codigo || 'N/A',
            categoria: infoCompleta?.categoria || 'N/A',
            principio_activo: infoCompleta?.principio_activo || 'N/A',
            presentacion: infoCompleta?.presentacion || 'N/A',
            concentracion: infoCompleta?.concentracion || 'N/A',
            uni_medida: infoCompleta?.uni_medida || 'N/A',
            lote_info: mejorLote ? {
              num_lote: mejorLote.num_lote,
              fec_venci: mejorLote.fec_venci,
              cantidad: mejorLote.cantidad,
              precio: mejorLote.precio
            } : undefined,
            cantidadADespachar: isOrdenCompra ? cantidadMostrar : 0,
          }
        })

        if (isCompletada) {
          // Si la solicitud está completada, mostrar todos los fármacos únicos (agrupar por farmaco)
          const farmacosUnicos = new Map()
          farmacosEnriquecidos.forEach(farmaco => {
            if (farmaco.estado === "Despachado") {
              const key = farmaco.id_farmaco
              if (!farmacosUnicos.has(key)) {
                farmacosUnicos.set(key, farmaco)
              }
            }
          })
          setFarmacos(Array.from(farmacosUnicos.values()))
        } else {
          // Si está pendiente, mostrar solo los fármacos pendientes para despachar.
          const farmacosPendientes = farmacosEnriquecidos.filter((f) => f.estado === "Pendiente")
          setFarmacos(farmacosPendientes)
        }

      } catch (error) {
        console.error("Error al cargar detalles de fármacos:", error)
        setFarmacos(solicitud.farmacos)
      } finally {
        setLoading(false)
      }
    }

    cargarDetallesFarmacos()
  }, [solicitud, isCompletada, isOrdenCompra, open])

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
          .eq("activo", true)
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
    <BaseModal open={open} onClose={onClose} widthClass="max-w-7xl">
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
            <div>{formatearFecha(solicitud.fechaCreacion)}</div>
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
              <div>{formatearFecha(solicitud.fechaAprobacion)}</div>
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
          {loading ? (
            <div className="py-8 text-center text-gray-400">
              Cargando información de fármacos...
            </div>
          ) : (
            <table className="w-full text-sm">
              {isCompletada ? (
                <>
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left font-medium text-gray-600 py-3 px-2">Código</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2">Fármaco</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2">Categoría</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2">Principio Activo</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2">Presentación</th>
                      <th className="text-center font-medium text-gray-600 py-3 px-2">
                        {isOrdenCompra ? "Cantidad Solicitada" : "Cantidad Solicitada Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmacos.map((f) => (
                      <tr key={f.id_detalle} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-2 font-mono text-xs bg-gray-100 rounded">{f.codigo}</td>
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium text-gray-900">{f.farmaco}</div>
                            <div className="text-xs text-gray-500">
                              {f.concentracion} {f.uni_medida}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs">{f.categoria}</td>
                        <td className="py-3 px-2 text-xs">{f.principio_activo}</td>
                        <td className="py-3 px-2 text-xs">{f.presentacion}</td>
                        <td className="py-3 px-2 text-center font-bold text-blue-600">{f.cantidadSolicitada}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left font-medium text-gray-600 py-3 px-2 w-20">Código</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2 w-64">Fármaco</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2 w-24">Lote</th>
                      <th className="text-left font-medium text-gray-600 py-3 px-2 w-24">Vencimiento</th>
                      <th className="text-center font-medium text-gray-600 py-3 px-2 w-20">Stock</th>
                      <th className="text-center font-medium text-gray-600 py-3 px-2 w-20">
                        {isOrdenCompra ? "Solicitada" : "Solicitada"}
                      </th>
                      <th className="text-center font-medium text-gray-600 py-3 px-2 w-28">
                        {isOrdenCompra ? "A Solicitar" : "A Despachar"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmacos.map((f, idx) => (
                      <tr key={f.id_detalle} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {f.codigo}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{f.farmaco}</div>
                            <div className="text-xs text-gray-600">
                              {f.concentracion} {f.uni_medida} - {f.presentacion}
                            </div>
                            <div className="text-xs text-gray-500">
                              {f.principio_activo}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {f.lote_info ? (
                            <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {f.lote_info.num_lote}
                            </span>
                          ) : (
                            <span className="text-red-500 text-xs bg-red-100 px-2 py-1 rounded">Sin stock</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {f.lote_info ? (
                            <span className="text-gray-700">
                              {formatearFecha(f.lote_info.fec_venci)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {f.lote_info ? (
                            <span className={`font-bold text-sm ${f.lote_info.cantidad < f.cantidadSolicitada ? 'text-red-600' : 'text-green-600'}`}>
                              {f.lote_info.cantidad}
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">0</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-blue-600">{f.cantidadSolicitada}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              min={0}
                              max={isOrdenCompra ? f.cantidadSolicitada : Math.min(f.cantidadSolicitada, f.lote_info?.cantidad || 0)}
                              value={f.cantidadADespachar}
                              onChange={(e) => handleCantidadChange(idx, Number(e.target.value))}
                              className="border rounded px-2 py-1 w-20 text-center text-sm"
                              disabled={isCompletada || isOrdenCompra || !f.lote_info}
                            />
                            {!isOrdenCompra && f.lote_info && f.lote_info.cantidad < f.cantidadSolicitada && (
                              <div className="text-xs text-red-600 mt-1 text-center">
                                Insuficiente
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
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