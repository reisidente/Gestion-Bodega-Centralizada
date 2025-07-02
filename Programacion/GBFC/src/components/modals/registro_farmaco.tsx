import { useState, useEffect } from "react"
import { BaseModal } from "./base"
import { supabase } from "../../libs/supabase"

interface RegistrarFarmacoModalProps {
  open: boolean
  onClose: () => void
  onRegistrar: (data: any) => void
}

const initialForm = {
  nombre_comercial: "",
  nombre_generico: "",
  codigo: "",
  uni_medida: "",
  categoria: "",
  principio_activo: "",
  presentacion: "",
  concentracion: "",
  via_administracion: "",
  observacion: "",
}

export function RegistrarFarmacoModal({
  open,
  onClose,
  onRegistrar,
}: RegistrarFarmacoModalProps) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Reiniciar el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      setForm(initialForm)
      setError("")
      setIsLoading(false)
    }
  }, [open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      // Validar que el código no exista
      const { data: existingFarmaco, error: checkError } = await supabase
        .from("farmaco")
        .select("codigo")
        .eq("codigo", form.codigo)
        .single()

      if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows found
        setError("Error al validar el código")
        setIsLoading(false)
        return
      }

      if (existingFarmaco) {
        setError("Ya existe un fármaco con este código")
        setIsLoading(false)
        return
      }

      // Si llegamos aquí, el código es único
      onRegistrar(form)
      onClose()
    } catch (err) {
      setError("Error inesperado al validar el código")
    }
    setIsLoading(false)
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <h2 className="font-semibold text-2xl mb-1">Registrar Fármaco</h2>
        <p className="text-gray-500 mb-6">
          Complete los datos para registrar un nuevo fármaco
        </p>
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
            <label className="block font-medium mb-1">Nombre Comercial</label>
            <input
              name="nombre_comercial"
              value={form.nombre_comercial}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Nombre Genérico</label>
            <input
              name="nombre_generico"
              value={form.nombre_generico}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Categoría</label>
            <input
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Unidad de medida</label>
            <input
              name="uni_medida"
              value={form.uni_medida}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Principio Activo</label>
            <input
              name="principio_activo"
              value={form.principio_activo}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Presentación</label>
            <input
              name="presentacion"
              value={form.presentacion}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Concentración</label>
            <input
              name="concentracion"
              value={form.concentracion}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Vía de Administración</label>
            <input
              name="via_administracion"
              value={form.via_administracion}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Observación (opcional)</label>
            <input
              name="observacion"
              value={form.observacion}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
        {error && <div className="text-red-500 text-sm mt-4">{error}</div>}
        <div className="flex justify-end gap-2 mt-8">
          <button
            type="button"
            className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Validando..." : "Registrar"}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}