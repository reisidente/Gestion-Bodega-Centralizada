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

// Unidades de medida más comunes en farmacéutica
const unidadesMedidaComunes = [
  "mg", // miligramos
  "g", // gramos
  "kg", // kilogramos
  "ml", // mililitros
  "l", // litros
  "mcg", // microgramos
  "UI", // unidades internacionales
  "comprimidos",
  "cápsulas",
  "tabletas",
  "sobres",
  "ampollas",
  "viales",
  "gotas",
  "supositorios",
  "óvulos",
  "parches",
  "Otro"
]

// Presentaciones farmacéuticas más comunes
const presentacionesComunes = [
  "Tableta",
  "Cápsula",
  "Jarabe",
  "Suspensión",
  "Solución oral",
  "Inyectable",
  "Ampolla",
  "Vial",
  "Gotas",
  "Crema",
  "Gel",
  "Pomada",
  "Supositorio",
  "Óvulo",
  "Parche",
  "Inhalador",
  "Spray nasal",
  "Colirio",
  "Solución oftálmica",
  "Polvo",
  "Granulado",
  "Otro"
]

export function RegistrarFarmacoModal({
  open,
  onClose,
  onRegistrar,
}: RegistrarFarmacoModalProps) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [unidadPersonalizada, setUnidadPersonalizada] = useState("")
  const [mostrarUnidadPersonalizada, setMostrarUnidadPersonalizada] = useState(false)
  const [presentacionPersonalizada, setPresentacionPersonalizada] = useState("")
  const [mostrarPresentacionPersonalizada, setMostrarPresentacionPersonalizada] = useState(false)

  // Reiniciar el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      setForm(initialForm)
      setError("")
      setIsLoading(false)
      setUnidadPersonalizada("")
      setMostrarUnidadPersonalizada(false)
      setPresentacionPersonalizada("")
      setMostrarPresentacionPersonalizada(false)
    }
  }, [open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleConcentracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    // Solo permitir números y punto decimal
    const regex = /^[0-9]*\.?[0-9]*$/
    if (regex.test(valor) || valor === "") {
      setForm({ ...form, concentracion: valor })
    }
  }

  const handleUnidadMedidaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value
    if (valor === "Otro") {
      setMostrarUnidadPersonalizada(true)
      setForm({ ...form, uni_medida: "" })
    } else {
      setMostrarUnidadPersonalizada(false)
      setUnidadPersonalizada("")
      setForm({ ...form, uni_medida: valor })
    }
  }

  const handleUnidadPersonalizadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setUnidadPersonalizada(valor)
    setForm({ ...form, uni_medida: valor })
  }

  const handlePresentacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value
    if (valor === "Otro") {
      setMostrarPresentacionPersonalizada(true)
      setForm({ ...form, presentacion: "" })
    } else {
      setMostrarPresentacionPersonalizada(false)
      setPresentacionPersonalizada("")
      setForm({ ...form, presentacion: valor })
    }
  }

  const handlePresentacionPersonalizadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setPresentacionPersonalizada(valor)
    setForm({ ...form, presentacion: valor })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      // Validar unidad de medida personalizada
      if (mostrarUnidadPersonalizada && unidadPersonalizada.trim()) {
        const unidadesExistentes = unidadesMedidaComunes.filter(u => u !== "Otro").map(u => u.toLowerCase())
        if (unidadesExistentes.includes(unidadPersonalizada.toLowerCase().trim())) {
          setError("La unidad de medida personalizada ya existe en las opciones comunes")
          setIsLoading(false)
          return
        }
      }

      // Validar presentación personalizada
      if (mostrarPresentacionPersonalizada && presentacionPersonalizada.trim()) {
        const presentacionesExistentes = presentacionesComunes.filter(p => p !== "Otro").map(p => p.toLowerCase())
        if (presentacionesExistentes.includes(presentacionPersonalizada.toLowerCase().trim())) {
          setError("La presentación personalizada ya existe en las opciones comunes")
          setIsLoading(false)
          return
        }
      }

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
              placeholder="Ej: PARA500, IBU400, AMIT25"
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
              placeholder="Ej: Paracetamol, Ibuprofeno, Aspirina"
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
              placeholder="Ej: Acetaminofén, Ácido acetilsalicílico"
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
              placeholder="Ej: Analgésico, Antibiótico, Antiinflamatorio"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Unidad de medida</label>
            <select
              value={mostrarUnidadPersonalizada ? "Otro" : form.uni_medida}
              onChange={handleUnidadMedidaChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una unidad</option>
              {unidadesMedidaComunes.map((unidad) => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </select>
            {mostrarUnidadPersonalizada && (
              <input
                type="text"
                value={unidadPersonalizada}
                onChange={handleUnidadPersonalizadaChange}
                placeholder="Ingrese la unidad personalizada"
                className="w-full border rounded-md px-3 py-2 mt-2"
                required
              />
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Principio Activo</label>
            <input
              name="principio_activo"
              value={form.principio_activo}
              onChange={handleChange}
              placeholder="Ej: Acetaminofén, Ibuprofeno, Amoxicilina"
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Presentación</label>
            <select
              value={mostrarPresentacionPersonalizada ? "Otro" : form.presentacion}
              onChange={handlePresentacionChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Seleccione una presentación</option>
              {presentacionesComunes.map((presentacion) => (
                <option key={presentacion} value={presentacion}>
                  {presentacion}
                </option>
              ))}
            </select>
            {mostrarPresentacionPersonalizada && (
              <input
                type="text"
                value={presentacionPersonalizada}
                onChange={handlePresentacionPersonalizadaChange}
                placeholder="Ingrese la presentación personalizada"
                className="w-full border rounded-md px-3 py-2 mt-2"
                required
              />
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Concentración</label>
            <input
              name="concentracion"
              value={form.concentracion}
              onChange={handleConcentracionChange}
              placeholder="Ej: 500, 10.5, 0.25"
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
              placeholder="Ej: Oral, Intravenosa, Intramuscular, Tópica"
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
              placeholder="Ej: Refrigerar, No exponer al sol, Uso pediátrico"
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