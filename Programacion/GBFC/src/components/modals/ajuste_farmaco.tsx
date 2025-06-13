import { BaseModal } from "./base"
import { useState } from "react"

interface AjustarStockModalProps {
  open: boolean
  onClose: () => void
  farmaco: string
  onConfirm?: (data: {
    tipo: "Entrada" | "Salida"
    cantidad: number
    motivo: string
    observaciones: string
  }) => void
}

export function AjustarStockModal({
  open,
  onClose,
  farmaco,
  onConfirm,
}: AjustarStockModalProps) {
  const [tipo, setTipo] = useState<"Entrada" | "Salida">("Entrada")
  const [cantidad, setCantidad] = useState("1")
  const [motivo, setMotivo] = useState("Compra")
  const [observaciones, setObservaciones] = useState("")

  const handleConfirm = () => {
    onConfirm?.({
      tipo,
      cantidad: Number(cantidad),
      motivo,
      observaciones,
    })
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose}>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Ajustar Stock: {farmaco}
      </h2>
      <p className="text-gray-500 mb-6">
        Registre entradas o salidas de stock para este fármaco.
      </p>
      <div className="mb-4">
        <label className="block font-medium mb-2">Tipo de Ajuste</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={tipo === "Entrada"}
              onChange={() => setTipo("Entrada")}
            />
            Entrada
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={tipo === "Salida"}
              onChange={() => setTipo("Salida")}
            />
            Salida
          </label>
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Cantidad</label>
        <input
          type="number"
          min={1}
          className="w-full border rounded-md px-3 py-2"
          value={cantidad}
          onChange={e => setCantidad(e.target.value)}
        />
        <div className="text-gray-400 text-sm mt-1">
          Cantidad de unidades a ingresar
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Motivo</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
        >
          <option value="Compra">Compra</option>
          <option value="Ajuste manual">Correción</option>
          <option value="Vencimiento">Vencimiento</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Observaciones</label>
        <textarea
          className="w-full border rounded-md px-3 py-2"
          rows={3}
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Observaciones adicionales"
        />
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
          onClick={handleConfirm}
        >
          Confirmar ajuste
        </button>
      </div>
    </BaseModal>
  )
}