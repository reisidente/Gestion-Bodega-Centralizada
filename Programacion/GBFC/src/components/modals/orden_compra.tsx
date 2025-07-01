import { useState, useEffect } from "react"
import { BaseModal } from "./base"
import { SelectorFarmacos } from "./selector_farmacos"
import { useFarmacias } from "./useFarmacias"
import { supabase } from "../../libs/supabase"
import { getFechaLocal } from "../../libs/utils"

const motivosOpciones = [
  "Stock bajo",
  "Urgencia",
  "Reposición programada",
  "Otro",
]

interface OrdenCompraModalProps {
  open: boolean
  onClose: () => void
  onEnviar: (data: any) => void
}

export function OrdenCompraModal({
  open,
  onClose,
  onEnviar,
}: OrdenCompraModalProps) {
  const farmacias = useFarmacias()
  const [form, setForm] = useState<{
    cod_sol: string
    fec_creacion: string
    farmacia_id_farmacia: string
    motivo: string
    prioridad: string
    medicamentos: any[]
  }>({
    cod_sol: "",
    fec_creacion: getFechaLocal(), // Fecha actual para mostrar
    farmacia_id_farmacia: "",
    motivo: "",
    prioridad: "Normal",
    medicamentos: [],
  })

  useEffect(() => {
    if (open) {
      supabase
        .from("solicitud")
        .select("cod_sol")
        .like("cod_sol", "C-%")
        .order("id_sol", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          const last = data && data[0]?.cod_sol
          let next = "C-0001"
          if (last && /^C-\d+$/.test(last)) {
            const num = parseInt(last.split("-")[1]) + 1
            next = `C-${num.toString().padStart(4, "0")}`
          }
          setForm(f => ({ ...f, cod_sol: next }))
        })
    }
  }, [open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleMedicamentos = (meds: any[]) => {
    setForm({ ...form, medicamentos: meds })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // cant_sol es la suma de cantidades solicitadas
    const cant_sol = form.medicamentos.reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0)
    onEnviar({
      cod_sol: form.cod_sol,
      estado: "Pendiente",
      prioridad: form.prioridad,
      cant_sol,
      fec_cierre: null,
      farmacia_id_farmacia: form.farmacia_id_farmacia,
      motivo: form.motivo,
      medicamentos: form.medicamentos,
    })
    onClose()
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <h2 className="font-semibold text-2xl text-center mb-6">Nueva orden de compra</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium mb-1">N° Solicitud</label>
            <input
              name="cod_sol"
              value={form.cod_sol}
              readOnly
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha</label>
            <input
              name="fec_creacion"
              type="date"
              value={form.fec_creacion}
              readOnly
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Farmacia Solicitante</label>
            <select
              name="farmacia_id_farmacia"
              value={form.farmacia_id_farmacia}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una farmacia</option>
              {farmacias.map(f => (
                <option key={f.id_farmacia} value={f.id_farmacia}>{f.nom_farma}</option>
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
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Prioridad</label>
            <select
              name="prioridad"
              value={form.prioridad}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="Normal">Normal</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className="block font-medium mb-1">Medicamentos</label>
          <SelectorFarmacos value={form.medicamentos} onChange={handleMedicamentos} />
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