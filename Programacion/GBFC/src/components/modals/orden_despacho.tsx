import { useState } from "react"
import { BaseModal } from "./base"

interface OrdenDespachoModalProps {
  open: boolean
  onClose: () => void
  onCrear: (data: any) => void
}

export function OrdenDespachoModal({
  open,
  onClose,
  onCrear,
}: OrdenDespachoModalProps) {
  const [form, setForm] = useState({
    numero: "",
    fecha: "",
    farmacia: "",
    prioridad: "",
    medicamentos: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCrear(form)
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <h2 className="font-semibold text-2xl text-center mb-6">Nueva Solictud de despacho</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium mb-1">N° Solicitud</label>
            <input
              name="numero"
              value={form.numero}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha</label>
            <input
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Farmacia</label>
            <input
              name="farmacia"
              value={form.farmacia}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Prioridad</label>
            <input
              name="prioridad"
              value={form.prioridad}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block font-medium mb-1">Medicamentos</label>
          <textarea
            name="medicamentos"
            value={form.medicamentos}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 min-h-[80px]"
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
          >
            Crear Orden
          </button>
        </div>
      </form>
    </BaseModal>
  )
}