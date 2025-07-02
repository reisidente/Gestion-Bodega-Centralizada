import React, { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { FormField } from "../ui/form/form-field"
import { BaseModal } from "./base"

interface AgregarLoteModalProps {
  open: boolean
  onClose: () => void
  farmaco: any
  proveedores: any[] // Añadir proveedores a las props
  onAgregar: (form: {
    lote: string
    fechaFabricacion: string
    fechaVencimiento: string
    cantidad: number
    precio: number
    id_proveedor: number | null // Añadir id_proveedor
  }) => Promise<void>
}

const initialState = {
  lote: "",
  fechaFabricacion: "",
  fechaVencimiento: "",
  cantidad: "",
  precio: "",
  idProveedor: "",
  isLoading: false,
  error: "",
}

export function AgregarLoteModal({
  open,
  onClose,
  farmaco,
  proveedores,
  onAgregar,
}: AgregarLoteModalProps) {
  const [lote, setLote] = useState("")
  const [fechaFabricacion, setFechaFabricacion] = useState("")
  const [fechaVencimiento, setFechaVencimiento] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [precio, setPrecio] = useState("")
  const [idProveedor, setIdProveedor] = useState<string>("") // Cambiado a string para el select
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Reiniciar el estado cuando el modal se abre
  useEffect(() => {
    if (open) {
      setLote(initialState.lote)
      setFechaFabricacion(initialState.fechaFabricacion)
      setFechaVencimiento(initialState.fechaVencimiento)
      setCantidad(initialState.cantidad)
      setPrecio(initialState.precio)
      setIdProveedor(initialState.idProveedor)
      setError(initialState.error)
      setIsLoading(initialState.isLoading)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!lote || !fechaFabricacion || !fechaVencimiento || !cantidad || !idProveedor) {
      setError("Todos los campos son obligatorios.")
      return
    }

    // Validar que la fecha de vencimiento no sea anterior a la fecha actual
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Establecer hora a medianoche para comparar solo fechas
    const vencimientoDate = new Date(fechaVencimiento)
    vencimientoDate.setHours(0, 0, 0, 0)

    if (vencimientoDate < today) {
      setError("La fecha de vencimiento no puede ser anterior a la fecha actual.")
      return
    }

    // Validar que la fecha de vencimiento sea posterior a la fecha de fabricación
    const fabricacionDate = new Date(fechaFabricacion)
    fabricacionDate.setHours(0, 0, 0, 0)

    if (vencimientoDate <= fabricacionDate) {
      setError("La fecha de vencimiento debe ser posterior a la fecha de fabricación.")
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
        id_proveedor: Number(idProveedor), // Convertir a número
      })
      onClose() // Cerrar el modal en caso de éxito
    } catch (err: any) {
      setError("Error al agregar lote: " + (err.message || err))
    }
    setIsLoading(false)
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-md">
      <h2 className="text-xl font-semibold text-center mb-4">
        Agregar Lote a {farmaco?.nombre_comercial || "Fármaco"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Número de Lote" value={lote} onChange={setLote} placeholder="Ej: L1234" />
        <FormField
          label="Fecha de Fabricación"
          value={fechaFabricacion}
          onChange={setFechaFabricacion}
          type="date" placeholder={""}        />
        <FormField
          label="Fecha de Vencimiento"
          value={fechaVencimiento}
          onChange={setFechaVencimiento}
          type="date" placeholder={""}        />
        <FormField
          label="Cantidad"
          value={cantidad}
          onChange={setCantidad}
          type="number"
          placeholder="Ej: 100"
        />
        <FormField
          label="Precio"
          value={precio}
          onChange={setPrecio}
          type="number"
          placeholder="Opcional"
          required={false} // Hacer el campo de precio opcional
        />
        {/* Selector de Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <select
            value={idProveedor}
            onChange={(e) => setIdProveedor(e.target.value)}
            className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 transition"
          >
            <option value="" disabled>
              Seleccione un proveedor
            </option>
            {proveedores.map((p) => (
              <option key={p.id_proveedor} value={p.id_proveedor}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Agregando..." : "Agregar Lote"}
          </Button>
        </div>
      </form>
    </BaseModal>
  )
}
