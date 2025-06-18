import React, { useState } from "react"
import { Button } from "../ui/button"
import { FormField } from "../ui/form/form-field"
import { BaseModal } from "./base"

interface AgregarLoteModalProps {
  open: boolean
  onClose: () => void
  farmaco: any
  onAgregar: (form: {
    lote: string
    fechaFabricacion: string
    fechaVencimiento: string
    cantidad: number
    precio: number
  }) => Promise<void>
}

export function AgregarLoteModal({ open, onClose, farmaco, onAgregar }: AgregarLoteModalProps) {
  const [lote, setLote] = useState("")
  const [fechaFabricacion, setFechaFabricacion] = useState("")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [precio, setPrecio] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!lote || !fechaFabricacion || !fechaVencimiento || !cantidad) {
      setError("Todos los campos son obligatorios excepto el precio.")
      return
    }
    setIsLoading(true)
    try {
      await onAgregar({
        lote,
        fechaFabricacion,
        fechaVencimiento,
        cantidad: Number(cantidad),
        precio: Number(precio) || 0,
      })
    } catch (err: any) {
      setError("Error al agregar lote: " + (err.message || err))
    }
    setIsLoading(false)
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-md">
      <h2 className="text-xl font-semibold text-center mb-4">Agregar Lote a {farmaco?.nombre}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Número de Lote" value={lote} onChange={setLote} placeholder="Ej: L1234" />
        <FormField label="Fecha de Fabricación" value={fechaFabricacion} onChange={setFechaFabricacion} type="date" placeholder="" />
        <FormField label="Fecha de Vencimiento" value={fechaVencimiento} onChange={setFechaVencimiento} type="date" placeholder="" />
        <FormField label="Cantidad" value={cantidad} onChange={setCantidad} type="number" placeholder="Ej: 100" />
        <FormField label="Precio" value={precio} onChange={setPrecio} type="number" placeholder="Opcional" />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Agregando..." : "Agregar Lote"}</Button>
        </div>
      </form>
    </BaseModal>
  )
}
