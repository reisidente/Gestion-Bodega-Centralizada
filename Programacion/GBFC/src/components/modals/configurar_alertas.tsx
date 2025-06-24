import { useState } from "react"
import { BaseModal } from "./base"

interface ConfigAlertasModalProps {
  open: boolean
  onClose: () => void
  initialConfig?: {
    diasVencimiento?: number
    cantidadMinimaStock?: number
  }
  onSave?: (config: { diasVencimiento: number; cantidadMinimaStock: number }) => void
}

export function ConfigAlertasModal({
  open,
  onClose,
  initialConfig = {},
  onSave,
}: ConfigAlertasModalProps) {
  const [diasVencimiento, setDiasVencimiento] = useState(initialConfig.diasVencimiento ?? 30)
  const [cantidadMinimaStock, setCantidadMinimaStock] = useState(initialConfig.cantidadMinimaStock ?? 50)

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Alertas de Vencimiento</h2>
        <p className="text-gray-500 mb-4">
          Configure los parámetros para las alertas de vencimiento de fármacos
        </p>
        <label className="block font-medium mb-1">Días antes del vencimiento</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded-md px-3 py-2 mb-1"
          value={diasVencimiento}
          onChange={e => setDiasVencimiento(Number(e.target.value))}
        />
        <div className="text-gray-400 text-sm mb-2">
          Número de días antes del vencimiento para comenzar a generar alertas
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Alertas de Stock</h2>
        <p className="text-gray-500 mb-4">
          Configure los parámetros para las alertas de stock bajo
        </p>
        <label className="block font-medium mb-1">
          Cantidad mínima para alerta de stock
        </label>
        <input
          type="number"
          min={1}
          className="w-full border rounded-md px-3 py-2 mb-1"
          value={cantidadMinimaStock}
          onChange={e => setCantidadMinimaStock(Number(e.target.value))}
        />
        <div className="text-gray-400 text-sm">
          Cantidad de unidades para considerar que un producto está con stock bajo
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-8">
        <button
          className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
          onClick={() => onSave?.({ diasVencimiento, cantidadMinimaStock })}
        >
          Guardar configuración
        </button>
      </div>
    </BaseModal>
  )
}