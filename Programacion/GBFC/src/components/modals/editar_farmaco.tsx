import { BaseModal } from "./base"
import { useState } from "react"

interface EditFarmacoModalProps {
  open: boolean
  onClose: () => void
  initialData?: {
    nombre?: string
    categoria?: string
    codigo?: string
    concentracion?: string
    stockMinimo?: string
  }
  onSave?: (data: any) => void
}

export function EditFarmacoModal({
  open,
  onClose,
  initialData = {},
  onSave,
}: EditFarmacoModalProps) {
  const [nombre, setNombre] = useState(initialData.nombre || "")
  const [categoria, setCategoria] = useState(initialData.categoria || "")
  const [codigo, setCodigo] = useState(initialData.codigo || "")
  const [concentracion, setConcentracion] = useState(initialData.concentracion || "")
  const [stockMinimo, setStockMinimo] = useState(initialData.stockMinimo || "")

  const handleSave = () => {
    onSave?.({
      nombre,
      categoria,
      codigo,
      concentracion,
      stockMinimo,
    })
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose}>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Editar Fármaco</h2>
      <p className="text-gray-500 mb-6">
        Actualice la información del fármaco. Haga clic en guardar cuando termine.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-medium mb-1">Nombre</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre del fármaco"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Categoría</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
          >
            <option value="">Seleccione una categoría</option>
            <option value="Antibióticos">Antibióticos</option>
            <option value="Analgésicos">Analgésicos</option>
            <option value="Antiinflamatorios">Antiinflamatorios</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Código</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            placeholder="Código del fármaco"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Concentración</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={concentracion}
            onChange={e => setConcentracion(e.target.value)}
            placeholder="Ej: 500mg"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Stock Mínimo</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={stockMinimo}
            onChange={e => setStockMinimo(e.target.value)}
            placeholder="Cantidad mínima antes de generar alertas"
          />
        </div>
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
          onClick={handleSave}
        >
          Guardar cambios
        </button>
      </div>
    </BaseModal>
  )
}