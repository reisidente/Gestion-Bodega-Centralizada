import { useState } from "react"
import { BaseModal } from "./base"
import { supabase } from "../../libs/supabase"

interface FarmacoDetalle {
  id_detalle?: number
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
    farmacia: string
    fechaCreacion: string
    estado: string
    prioridad: string
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
  const [farmacos, setFarmacos] = useState(solicitud.farmacos.map(f => ({
    ...f,
    cantidadADespachar: f.cantidadAprobada ?? f.cantidadSolicitada ?? 0
  })))
  const [loading, setLoading] = useState(false)

  const handleCantidadChange = (idx: number, value: number) => {
    setFarmacos(prev => prev.map((f, i) => i === idx ? { ...f, cantidadADespachar: value } : f))
  }

  const handleDespachar = (idx: number) => {
    setFarmacos(prev => prev.map((f, i) => i === idx ? { ...f, estado: "Despachado" } : f))
  }

  const handleGuardar = async () => {
    setLoading(true)
    for (const f of farmacos) {
      if (f.id_detalle) {
        await supabase.from("detalle_solicitud").update({
          cant_despacho: f.cantidadADespachar,
          fec_despacho: new Date().toISOString().slice(0, 10),
          estado_fmc: f.estado
        }).eq("id_detalle", f.id_detalle)
      }
    }
    setLoading(false)
    onSave?.(farmacos)
    onClose()
  }

  const totalSolicitados = farmacos.reduce((acc, f) => acc + f.cantidadSolicitada, 0)

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-3xl">
      <h2 className="text-2xl font-bold mb-1">Solicitud: {solicitud.id}</h2>
      <p className="text-gray-500 mb-6">Detalles de la solicitud de despacho</p>

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
              {solicitud.estado}
            </span>
          </div>
          <div>
            <div className="text-gray-500">Prioridad</div>
            <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              {solicitud.prioridad}
            </span>
          </div>
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
        <h3 className="font-semibold text-2xl mb-1">Detalles de la Solicitud</h3>
        <p className="text-gray-400 mb-4">Fármacos solicitados</p>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium text-gray-500 py-2">Fármaco</th>
                <th className="text-left font-medium text-gray-500 py-2">Cantidad Solicitada</th>
                <th className="text-left font-medium text-gray-500 py-2">Cantidad a Despachar</th>
                <th className="text-left font-medium text-gray-500 py-2">Estado</th>
                <th className="text-left font-medium text-gray-500 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {farmacos.map((f, idx) => (
                <tr key={f.id_detalle || idx} className="border-b last:border-b-0">
                  <td className="py-4">{f.farmaco}</td>
                  <td className="py-4">{f.cantidadSolicitada}</td>
                  <td className="py-4">
                    <input
                      type="number"
                      min={0}
                      max={f.cantidadSolicitada}
                      value={f.cantidadADespachar}
                      onChange={e => handleCantidadChange(idx, Number(e.target.value))}
                      className="border rounded px-2 py-1 w-20"
                    />
                  </td>
                  <td className="py-4">
                    <span className="inline-block bg-black text-white px-4 py-1 rounded-full text-base font-semibold">
                      {f.estado}
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      className="text-black font-medium hover:underline"
                      type="button"
                      onClick={() => handleDespachar(idx)}
                    >
                      Despachar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-gray-400 text-base mt-4">
            Total de fármacos: {farmacos.length} | Cantidad total: {totalSolicitados}
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 mt-8">
        <button
          className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
          onClick={handleGuardar}
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </BaseModal>
  )
}