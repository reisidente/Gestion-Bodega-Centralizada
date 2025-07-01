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
  }) => void
}

const MOTIVO_OPTIONS = {
  Entrada: ["Compra", "corrección", "Otro"] as const,
  Salida: ["Vencimiento", "Daño", "Ajuste", "Otro"] as const,
}

type MotivoEntrada = typeof MOTIVO_OPTIONS.Entrada[number]
type MotivoSalida = typeof MOTIVO_OPTIONS.Salida[number]
type Motivo = MotivoEntrada | MotivoSalida

export function AjustarStockModal({
  open,
  onClose,
  farmaco,
  onConfirm,
}: AjustarStockModalProps) {
  const [tipo, setTipo] = useState<"Entrada" | "Salida">("Entrada")
  const [cantidad, setCantidad] = useState("1")
  const [motivo, setMotivo] = useState<Motivo>("Compra")

  // Update motivo when tipo changes to ensure a valid option is selected
  const handleTipoChange = (newTipo: "Entrada" | "Salida") => {
    setTipo(newTipo)
    setMotivo(MOTIVO_OPTIONS[newTipo][0]) // Reset to first option of new tipo
  }

  const handleConfirm = () => {
    onConfirm?.({
      tipo,
      cantidad: Number(cantidad),
      motivo,
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
              onChange={() => handleTipoChange("Entrada")}
            />
            Entrada
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={tipo === "Salida"}
              onChange={() => handleTipoChange("Salida")}
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
          Cantidad de unidades a{" "}
          {tipo === "Entrada" ? "ingresar" : "retirar"}
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Motivo</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={motivo}
          onChange={e => setMotivo(e.target.value as Motivo)}
        >
          {MOTIVO_OPTIONS[tipo].map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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