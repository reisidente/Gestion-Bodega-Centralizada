import { useState } from "react"
import { BaseModal } from "./base"

interface RegistrarFarmacoModalProps {
  open: boolean
  onClose: () => void
  onRegistrar: (data: any) => void
}

export function RegistrarFarmacoModal({
  open,
  onClose,
  onRegistrar,
}: RegistrarFarmacoModalProps) {
  const [form, setForm] = useState({
    nombre: "",
    lote: "",
    fechaVencimiento: "",
    codigo: "",
    unidad: "",
    total: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRegistrar(form)
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <h2 className="font-semibold text-2xl mb-1">Registrar Fármaco</h2>
        <p className="text-gray-500 mb-6">Complete los datos para registrar un nuevo fármaco</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Código</label>
            <input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Lote</label>
            <input
              name="lote"
              value={form.lote}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha vencimiento</label>
            <input
              name="fechaVencimiento"
              type="date"
              value={form.fechaVencimiento}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Unidad de medida</label>
            <input
              name="unidad"
              value={form.unidad}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Total</label>
            <input
              name="total"
              type="number"
              min={0}
              value={form.total}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-8">
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
            Registrar
          </button>
        </div>
      </form>
    </BaseModal>
  )
}