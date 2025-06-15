import { useState } from "react"
import { BaseModal } from "./base"

interface OrdenCompraModalProps {
  open: boolean
  onClose: () => void
  onEnviar: (data: any) => void
}

const motivosOpciones = [
  "Stock bajo",
  "Urgencia",
  "Reposición programada",
  "Otro",
]

const farmaciasOpciones = [
  "Farmacia Central",
  "Farmacia Urgencias",
  "Farmacia Pediatría",
  "Farmacia Oncología",
]

export function OrdenCompraModal({
  open,
  onClose,
  onEnviar,
}: OrdenCompraModalProps) {
  const [form, setForm] = useState<{
    numero: string
    fecha: string
    farmacia: string
    motivo: string
    medicamento: string
  }>({
    numero: "",
    fecha: "",
    farmacia: "",
    motivo: "",
    medicamento: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEnviar(form)
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <h2 className="font-semibold text-2xl text-center mb-6">Nueva orden de compra</h2>
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
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Farmacia Solicitante</label>
            <select
              name="farmacia"
              value={form.farmacia}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una farmacia</option>
              {farmaciasOpciones.map(farmacia => (
                <option key={farmacia} value={farmacia}>{farmacia}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Motivo</label>
            <select
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione un motivo</option>
              {motivosOpciones.map(motivo => (
                <option key={motivo} value={motivo}>{motivo}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className="block font-medium mb-1">Medicamento</label>
          <textarea
            name="medicamento"
            value={form.medicamento}
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
            Enviar orden
          </button>
        </div>
      </form>
    </BaseModal>
  )
}