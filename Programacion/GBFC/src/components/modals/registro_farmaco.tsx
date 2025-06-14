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
        <h2 className="text-xl font-bold text-center mb-6">Registrar Fármaco</h2>
        <div className="flex flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block font-medium mb-1">Nombre:</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Lote:</label>
              <input
                name="lote"
                value={form.lote}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Fecha vencimiento:</label>
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
              <label className="block font-medium mb-1">Código:</label>
              <input
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Unidad de medida:</label>
              <input
                name="unidad"
                value={form.unidad}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="flex flex-col justify-start items-start pt-2 min-w-[120px]">
            <label className="block font-medium mb-1">Total:</label>
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
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="px-8 py-2 rounded-md border bg-white text-black font-medium shadow hover:bg-gray-50"
          >
            Registrar
          </button>
        </div>
      </form>
    </BaseModal>
  )
}