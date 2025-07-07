import type { InventoryItem } from "../hooks/useInventoryData"

/**
 * Obtiene el color de badge para el estado del fármaco
 */
export function getStatusColor(estado: string): "success" | "destructive" | "warning" {
  switch (estado) {
    case "Disponible":
      return "success"
    case "Stock bajo":
      return "destructive"
    case "Proximo a vencer":
      return "warning"
    default:
      return "success"
  }
}

/**
 * Obtiene las clases CSS para el badge de estado
 */
export function getStatusBadgeClasses(estado: string): string {
  const baseClasses = "text-xs px-3 py-1"
  
  switch (estado) {
    case "Disponible":
      return `${baseClasses} bg-green-500/90 text-white`
    case "Stock bajo":
      return `${baseClasses} bg-red-500/90 text-white`
    case "Proximo a vencer":
      return `${baseClasses} bg-yellow-500/90 text-white`
    default:
      return baseClasses
  }
}

/**
 * Formatea una fecha desde formato YYYY-MM-DD a DD-MM-YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString || dateString === "-") return "-"
  
  try {
    const [year, month, day] = dateString.split("-")
    return `${day}-${month}-${year}`
  } catch (e) {
    return dateString
  }
}

/**
 * Filtra los datos del inventario según categoría y búsqueda
 */
export function filterInventoryData(
  data: InventoryItem[],
  selectedCategory: string,
  searchTerm: string
): InventoryItem[] {
  return data.filter(
    (item) =>
      (selectedCategory === "Todos" || item.categoria === selectedCategory) &&
      (item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lote.toLowerCase().includes(searchTerm.toLowerCase()))
  )
}

/**
 * Valida si un lote puede ser eliminado
 */
export function canDeleteLote(stock: number): boolean {
  return stock === 0
}

/**
 * Genera un mensaje de confirmación para eliminar lote
 */
export function getDeleteLoteConfirmMessage(lote: string, farmaco: string): string {
  return `¿Está seguro de que desea eliminar el lote "${lote}" del fármaco "${farmaco}"? Esta acción no se puede deshacer.`
}

/**
 * Formatea el precio para mostrar
 */
export function formatPrice(price: number | string): string {
  const num = typeof price === "string" ? parseFloat(price) : price
  return `$${num || 0}`
}

/**
 * Calcula el total de unidades de un fármaco
 */
export function calculateTotalStock(items: InventoryItem[], farmacoId: number): number {
  return items
    .filter(item => item.id === farmacoId)
    .reduce((sum, item) => sum + item.stock, 0)
}

/**
 * Obtiene los colores para el botón de toggle de stock cero
 */
export function getStockToggleButtonClasses(mostrarStockCero: boolean): string {
  const baseClasses = "flex items-center gap-2 font-medium"
  
  if (mostrarStockCero) {
    return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white`
  }
  
  return `${baseClasses} border-gray-300 text-gray-700 hover:bg-gray-50`
}

/**
 * Valida los datos de un formulario de fármaco
 */
export function validateFarmacoForm(form: {
  nombre_comercial: string
  categoria: string
  codigo: string
  uni_medida: string
}): string[] {
  const errors: string[] = []

  if (!form.nombre_comercial.trim()) {
    errors.push("El nombre comercial es requerido")
  }

  if (!form.categoria.trim()) {
    errors.push("La categoría es requerida")
  }

  if (!form.codigo.trim()) {
    errors.push("El código es requerido")
  }

  if (!form.uni_medida.trim()) {
    errors.push("La unidad de medida es requerida")
  }

  return errors
}

/**
 * Valida los datos de un formulario de lote
 */
export function validateLoteForm(form: {
  lote: string
  fechaFabricacion: string
  fechaVencimiento: string
  cantidad: string
  precio: string
}): string[] {
  const errors: string[] = []

  if (!form.lote.trim()) {
    errors.push("El número de lote es requerido")
  }

  if (!form.fechaFabricacion) {
    errors.push("La fecha de fabricación es requerida")
  }

  if (!form.fechaVencimiento) {
    errors.push("La fecha de vencimiento es requerida")
  }

  if (!form.cantidad || parseInt(form.cantidad) <= 0) {
    errors.push("La cantidad debe ser mayor a 0")
  }

  if (!form.precio || parseFloat(form.precio) < 0) {
    errors.push("El precio debe ser mayor o igual a 0")
  }

  return errors
}
