import { useState } from "react"
import { BaseModal } from "./base"

interface EditarReporteModalProps {
  open: boolean
  onClose: () => void
  initialData: {
    titulo: string
    tipo: "Stock Bajo" | "Vencimientos" | "Inventario" | "Movimientos"
    formato: string
    frecuencia: string
    descripcion: string
    parametros: any
  }
  onSave?: (data: any) => void
}

export function EditarReporteModal({
  open,
  onClose,
  initialData,
  onSave,
}: EditarReporteModalProps) {
  const [data, setData] = useState(initialData)

  // Opciones generales
  const formatos = ["PDF"]
  const frecuencias = ["Única", "Diaria", "Semanal", "Mensual"]
  const tipos = ["Stock Bajo", "Vencimientos", "Inventario", "Movimientos"]

  // Opciones específicas
  const ordenStockBajo = [
    "Porcentaje de stock",
    "Déficit (unidades faltantes)",
    "Nombre",
    "Categoría",
  ]
  const ordenVencimientos = ["Días restantes"]
  const ordenInventario = ["Categoría"]
  const ordenMovimientos = ["Fecha"]

  // Handlers
  const handleChange = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleParametro = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      parametros: {
        ...prev.parametros,
        [field]: value,
      },
    }))
  }

  // Renderiza los parámetros según el tipo de reporte
  const renderParametros = () => {
    switch (data.tipo) {
      case "Stock Bajo":
        return (
          <>
            <div className="mb-4">
              <label className="block font-medium mb-1">Ordenar por</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={data.parametros.ordenarPor || ""}
                onChange={e => handleParametro("ordenarPor", e.target.value)}
              >
                {ordenStockBajo.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </>
        )
      case "Vencimientos":
        return (
          <>
            <div className="mb-4">
              <label className="block font-medium mb-1">Días para vencimiento</label>
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2"
                value={data.parametros.dias || ""}
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
                value={data.parametros.ordenarPor || ""}
                onChange={e => handleParametro("ordenarPor", e.target.value)}
              >
                {ordenVencimientos.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </>
        )
      case "Inventario":
        return (
          <>
            <div className="mb-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!data.parametros.incluirStockCero}
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
                value={data.parametros.ordenarPor || ""}
                onChange={e => handleParametro("ordenarPor", e.target.value)}
              >
                {ordenInventario.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {/* Aquí puedes agregar selección de categorías si lo necesitas */}
          </>
        )
      case "Movimientos":
        return (
          <>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2"
                  value={data.parametros.fechaInicio || ""}
                  onChange={e => handleParametro("fechaInicio", e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Fecha de fin</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-3 py-2"
                  value={data.parametros.fechaFin || ""}
                  onChange={e => handleParametro("fechaFin", e.target.value)}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Farmacia</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={data.parametros.farmacia || ""}
                onChange={e => handleParametro("farmacia", e.target.value)}
              >
                <option value="">Todas las farmacias</option>
                {/* Agrega aquí las farmacias disponibles */}
              </select>
              <div className="text-gray-400 text-sm mt-1">
                Filtrar movimientos por farmacia destino
              </div>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-3xl">
      <div className="mb-8 border rounded-md p-6 bg-white">
        <h2 className="font-semibold text-xl mb-1">Información del Reporte</h2>
        <p className="text-gray-500 mb-6">Modifique los datos básicos del reporte</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Título</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={data.titulo}
              onChange={e => handleChange("titulo", e.target.value)}
            />
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
          className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-900"
          onClick={() => onSave?.(data)}
        >
          Guardar cambios
        </button>
      </div>
    </BaseModal>
  )
}