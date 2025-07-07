import { useState, useEffect } from "react"
import { BaseModal } from "./base"
import { supabase } from "../../libs/supabase"

interface ParametrosStockBajo {
  ordenarPor?: string
}
interface ParametrosVencimientos {
  dias?: string | number
  ordenarPor?: string
}
interface ParametrosInventario {
  incluirStockCero?: boolean
  ordenarPor?: string
}
interface ParametrosMovimientos {
  fechaInicio?: string
  fechaFin?: string
  farmacia?: string
}

type Parametros =
  | ParametrosStockBajo
  | ParametrosVencimientos
  | ParametrosInventario
  | ParametrosMovimientos
  | Record<string, any>

interface CrearReporteModalProps {
  open: boolean
  onClose: () => void
  onCreate?: (data: any) => void
}

const formatos = ["PDF"]
const frecuencias = ["Única", "Diaria", "Semanal", "Mensual"]
const tipos = ["Stock Bajo", "Vencimientos", "Inventario", "Movimientos"]

const ordenStockBajo = [
  "Porcentaje de stock",
  "Déficit (unidades faltantes)",
  "Nombre",
  "Categoría",
]
const ordenVencimientos = ["Días restantes"]
const ordenInventario = ["Categoría"]

const initialState = {
  titulo: "",
  tipo: "Stock Bajo",
  formato: "PDF",
  frecuencia: "Única",
  descripcion: "",
  parametros: {} as Parametros,
}

export function CrearReporteModal({ open, onClose, onCreate }: CrearReporteModalProps) {
  const [data, setData] = useState(initialState)
  const [farmacias, setFarmacias] = useState<any[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Reiniciar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      setData(initialState)
      setErrors({})
    }
  }, [open])

  // Cargar farmacias cuando se abre el modal
  useEffect(() => {
    if (open) {
      const fetchFarmacias = async () => {
        const { data: farmaciasData } = await supabase
          .from("farmacia")
          .select("id_farmacia, nom_farma")
          .order("nom_farma")
        
        setFarmacias(farmaciasData || [])
      }
      fetchFarmacias()
    }
  }, [open])

  const handleChange = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value,
      // Reset parámetros si cambia el tipo
      ...(field === "tipo" ? { parametros: {} } : {}),
    }))
    
    // Validar título en tiempo real
    if (field === "titulo") {
      const newErrors = { ...errors }
      if (!value.trim()) {
        newErrors.titulo = "El título del reporte es obligatorio"
      } else {
        delete newErrors.titulo
      }
      setErrors(newErrors)
    }
    
    // Limpiar errores si se cambia el tipo de reporte
    if (field === "tipo") {
      setErrors({})
    }
  }

  const handleParametro = (field: string, value: any) => {
    setData(prev => {
      const newParametros = {
        ...prev.parametros,
        [field]: value,
      }
      
      // Validación especial para fechas en reportes de movimientos
      if (prev.tipo === "Movimientos") {
        const movimientosParams = newParametros as ParametrosMovimientos
        // Obtener la fecha actual en formato YYYY-MM-DD en la zona horaria local
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
        
        // Si se cambia la fecha de inicio y hay una fecha de fin
        if (field === "fechaInicio" && movimientosParams.fechaFin) {
          // Si la fecha de fin es menor a la nueva fecha de inicio, limpiarla
          if (value && movimientosParams.fechaFin < value) {
            movimientosParams.fechaFin = ""
          }
        }
        
        // Validar fechas y actualizar errores
        const newErrors = { ...errors }
        if (field === "fechaInicio") {
          if (value && value > today) {
            newErrors.fechaInicio = "La fecha de inicio debe ser igual o anterior a la fecha actual"
          } else {
            delete newErrors.fechaInicio
          }
        }
        if (field === "fechaFin") {
          if (value && movimientosParams.fechaInicio && value < movimientosParams.fechaInicio) {
            newErrors.fechaFin = "La fecha de fin debe ser igual o posterior a la fecha de inicio"
          } else {
            delete newErrors.fechaFin
          }
        }
        setErrors(newErrors)
      }
      
      return {
        ...prev,
        parametros: newParametros,
      }
    })
  }

  const isFormValid = () => {
    if (!data.titulo.trim()) return false
    if (Object.keys(errors).length > 0) return false
    
    // Validaciones específicas para reportes de movimientos
    if (data.tipo === "Movimientos") {
      const parametros = data.parametros as ParametrosMovimientos
      // Obtener la fecha actual en formato YYYY-MM-DD en la zona horaria local
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
      
      // Si hay fecha de inicio, validar que sea igual o anterior a hoy
      if (parametros.fechaInicio && parametros.fechaInicio > today) {
        return false
      }
      
      // Si hay ambas fechas, validar que fecha fin sea igual o posterior a fecha inicio
      if (parametros.fechaInicio && parametros.fechaFin && parametros.fechaFin < parametros.fechaInicio) {
        return false
      }
    }
    
    return true
  }

  const renderParametros = () => {
    switch (data.tipo) {
      case "Stock Bajo": {
        const parametros = data.parametros as ParametrosStockBajo
        return (
          <div className="mb-4">
            <label className="block font-medium mb-1">Ordenar por</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={parametros.ordenarPor || ""}
              onChange={e => handleParametro("ordenarPor", e.target.value)}
            >
              {ordenStockBajo.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )
      }
      case "Vencimientos": {
        const parametros = data.parametros as ParametrosVencimientos
        return (
          <>
            <div className="mb-4">
              <label className="block font-medium mb-1">Días para vencimiento</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={parametros.dias || ""}
                onChange={e => handleParametro("dias", e.target.value)}
                placeholder="Ej: 90"
              />
              <div className="text-gray-400 text-sm mt-1">
                Incluir productos que vencen en los próximos X días
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Ordenar por</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={parametros.ordenarPor || ""}
                onChange={e => handleParametro("ordenarPor", e.target.value)}
              >
                {ordenVencimientos.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </>
        )
      }
      case "Inventario": {
        const parametros = data.parametros as ParametrosInventario
        return (
          <>
            <div className="mb-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!parametros.incluirStockCero}
                  onChange={e => handleParametro("incluirStockCero", e.target.checked)}
                />
                Incluir productos con stock cero
              </label>
              <div className="text-gray-400 text-sm mt-1">
                Incluir en el reporte los productos que no tienen existencias
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Ordenar por</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={parametros.ordenarPor || ""}
                onChange={e => handleParametro("ordenarPor", e.target.value)}
              >
                {ordenInventario.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </>
        )
      }
      case "Movimientos": {
        const parametros = data.parametros as ParametrosMovimientos
        // Obtener la fecha actual en formato YYYY-MM-DD en la zona horaria local
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0]
        return (
          <>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.fechaInicio ? "border-red-500" : ""
                  }`}
                  value={parametros.fechaInicio || ""}
                  max={today}
                  onChange={e => handleParametro("fechaInicio", e.target.value)}
                />
                {errors.fechaInicio ? (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.fechaInicio}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm mt-1">
                    Debe ser igual o anterior a la fecha actual
                  </div>
                )}
              </div>
              <div>
                <label className="block font-medium mb-1">Fecha de fin</label>
                <input
                  type="date"
                  className={`w-full border rounded-md px-3 py-2 ${
                    errors.fechaFin ? "border-red-500" : ""
                  }`}
                  value={parametros.fechaFin || ""}
                  min={parametros.fechaInicio || ""}
                  onChange={e => handleParametro("fechaFin", e.target.value)}
                />
                {errors.fechaFin ? (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.fechaFin}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm mt-1">
                    Debe ser igual o posterior a la fecha de inicio
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Farmacia</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={parametros.farmacia || ""}
                onChange={e => handleParametro("farmacia", e.target.value)}
              >
                <option value="">Todas las farmacias</option>
                {farmacias.map(farmacia => (
                  <option key={farmacia.id_farmacia} value={farmacia.id_farmacia}>
                    {farmacia.nom_farma}
                  </option>
                ))}
              </select>
              <div className="text-gray-400 text-sm mt-1">
                Filtrar movimientos por farmacia destino
              </div>
            </div>
          </>
        )
      }
      default:
        return null
    }
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-3xl">
      <div className="mb-8 border rounded-md p-6 bg-white">
        <h2 className="font-semibold text-xl mb-1">Crear Nuevo Reporte</h2>
        <p className="text-gray-500 mb-6">Complete los datos básicos del reporte</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Título</label>
            <input
              className={`w-full border rounded-md px-3 py-2 ${
                errors.titulo ? "border-red-500" : ""
              }`}
              value={data.titulo}
              onChange={e => handleChange("titulo", e.target.value)}
              placeholder="Ingrese el título del reporte"
            />
            {errors.titulo && (
              <div className="text-red-500 text-sm mt-1">
                {errors.titulo}
              </div>
            )}
          </div>
          <div>
            <label className="block font-medium mb-1">Tipo de Reporte</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={data.tipo}
              onChange={e => handleChange("tipo", e.target.value)}
            >
              {tipos.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Formato</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={data.formato}
              onChange={e => handleChange("formato", e.target.value)}
            >
              {formatos.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Frecuencia</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={data.frecuencia}
              onChange={e => handleChange("frecuencia", e.target.value)}
            >
              {frecuencias.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block font-medium mb-1">Descripción</label>
          <textarea
            className="w-full border rounded-md px-3 py-2"
            value={data.descripcion}
            onChange={e => handleChange("descripcion", e.target.value)}
            rows={3}
            placeholder="Información adicional sobre el reporte (opcional)"
          />
        </div>
      </div>

      <div className="border rounded-md p-6 bg-white">
        <h2 className="font-semibold text-xl mb-1">Parámetros del Reporte</h2>
        <p className="text-gray-500 mb-6">
          Configure los parámetros específicos según el tipo de reporte
        </p>
        {renderParametros()}
      </div>

      <div className="flex justify-end gap-2 mt-8">
        <button
          className="px-6 py-2 rounded-md border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className={`px-6 py-2 rounded-md font-medium ${
            isFormValid()
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={() => {
            // Validar título antes de crear el reporte
            if (!data.titulo.trim()) {
              setErrors(prev => ({ ...prev, titulo: "El título del reporte es obligatorio" }))
              return
            }
            if (isFormValid()) {
              onCreate?.(data)
            }
          }}
          disabled={!isFormValid()}
        >
          Crear reporte
        </button>
      </div>
    </BaseModal>
  )
}
