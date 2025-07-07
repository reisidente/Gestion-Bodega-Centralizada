import { useState, useEffect } from "react"
import { supabase } from "../libs/supabase"

export interface Farmaco {
  id_farmaco: number
  nombre_comercial: string
  nombre_generico: string
  categoria: string
  codigo: string
  uni_medida: string
  principio_activo?: string
  presentacion?: string
  concentracion?: string
  via_administracion?: string
  observacion?: string
}

export interface Lote {
  id_lote: number
  num_lote: string
  fec_fabri: string
  fec_venci: string
  cantidad: number
  precio: number
  farmaco_id_farmaco: number
  id_proveedor?: number
}

export interface Proveedor {
  id_proveedor: number
  nombre: string
  rut: string
  telefono?: string
  email?: string
  direccion?: string
}

export interface InventoryItem {
  id: number
  codigo: string
  nombre: string
  lote: string
  categoria: string
  stock: number
  vencimiento: string
  precio: number
  uni_medida: string
  estado: "Disponible" | "Stock bajo" | "Proximo a vencer"
  id_lote: number
  totalStock: number
}

export interface AlertConfig {
  diasVencimiento: number
  cantidadMinimaStock: number
}

/**
 * Hook personalizado para manejar los datos del inventario
 */
export function useInventoryData() {
  const [farmacos, setFarmacos] = useState<Farmaco[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [alertConfig] = useState<AlertConfig>(() => {
    const savedConfig = localStorage.getItem("alertConfig")
    return savedConfig
      ? JSON.parse(savedConfig)
      : {
          diasVencimiento: 30,
          cantidadMinimaStock: 50,
        }
  })

  /**
   * Carga todos los datos necesarios para el inventario
   */
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        { data: farmacosData, error: farmacosError },
        { data: lotesData, error: lotesError },
        { data: proveedoresData, error: proveedoresError },
      ] = await Promise.all([
        supabase
          .from("farmaco")
          .select(
            "id_farmaco, nombre_comercial, nombre_generico, categoria, codigo, uni_medida, principio_activo, presentacion, concentracion, via_administracion, observacion"
          ),
        supabase
          .from("lote")
          .select(
            "id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco, id_proveedor"
          ),
        supabase.from("proveedor").select("*"),
      ])

      if (farmacosError) throw farmacosError
      if (lotesError) throw lotesError
      if (proveedoresError) throw proveedoresError

      if (farmacosData && lotesData && proveedoresData) {
        setFarmacos(farmacosData)
        setLotes(lotesData)
        setProveedores(proveedoresData)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setError("Error al cargar los datos del inventario")
    } finally {
      setLoading(false)
    }
  }

  /**
   * Refresca solo los datos de lotes
   */
  const refreshLotes = async () => {
    try {
      const { data: lotesData, error } = await supabase
        .from("lote")
        .select(
          "id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco, id_proveedor"
        )
      
      if (error) throw error
      if (lotesData) setLotes(lotesData)
    } catch (error) {
      console.error("Error al actualizar lotes:", error)
    }
  }

  /**
   * Refresca solo los datos de fármacos
   */
  const refreshFarmacos = async () => {
    try {
      const { data: farmacosData, error } = await supabase
        .from("farmaco")
        .select(
          "id_farmaco, nombre_comercial, nombre_generico, categoria, codigo, uni_medida, principio_activo, presentacion, concentracion, via_administracion, observacion"
        )
      
      if (error) throw error
      if (farmacosData) setFarmacos(farmacosData)
    } catch (error) {
      console.error("Error al actualizar fármacos:", error)
    }
  }

  /**
   * Procesa los datos para generar los items del inventario
   */
  const getInventoryData = (mostrarStockCero: boolean = false): InventoryItem[] => {
    const today = new Date()
    const limitDate = new Date()
    limitDate.setDate(today.getDate() + alertConfig.diasVencimiento)

    return farmacos.flatMap((farmaco) => {
      const lotesFarmaco = lotes.filter(
        (l) => l.farmaco_id_farmaco === farmaco.id_farmaco
      )

      if (lotesFarmaco.length === 0) {
        return []
      }

      const totalStock = lotesFarmaco.reduce((sum, l) => sum + l.cantidad, 0)
      
      if (!mostrarStockCero && totalStock === 0) {
        return []
      }

      const precioFarmaco = lotesFarmaco.length > 0 
        ? Math.max(...lotesFarmaco.map(l => l.precio || 0))
        : 0

      const isStockBajo = totalStock > 0 && totalStock <= alertConfig.cantidadMinimaStock

      return lotesFarmaco.map((lote) => {
        const vencimientoParts = lote.fec_venci.split("-").map(Number)
        const vencimientoDate = new Date(vencimientoParts[0], vencimientoParts[1] - 1, vencimientoParts[2])
        const isProximoAVencer = vencimientoDate <= limitDate && vencimientoDate >= today

        let estado: "Disponible" | "Stock bajo" | "Proximo a vencer" = "Disponible"

        if (isStockBajo) {
          estado = "Stock bajo"
        } else if (isProximoAVencer) {
          estado = "Proximo a vencer"
        }

        return {
          id: farmaco.id_farmaco,
          codigo: farmaco.codigo,
          nombre: farmaco.nombre_comercial,
          lote: lote.num_lote,
          categoria: farmaco.categoria,
          stock: lote.cantidad,
          vencimiento: lote.fec_venci,
          precio: precioFarmaco,
          uni_medida: farmaco.uni_medida,
          estado,
          id_lote: lote.id_lote,
          totalStock,
        }
      })
    })
  }

  /**
   * Obtiene las categorías únicas ordenadas alfabéticamente
   */
  const getCategories = (): string[] => {
    return [
      "Todos",
      ...Array.from(new Set(farmacos.map(f => f.categoria))).sort()
    ]
  }

  useEffect(() => {
    fetchData()

    // Escuchar cambios en la configuración de alertas
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "alertConfig" && event.newValue) {
        // La configuración se actualiza automáticamente en el estado inicial
        fetchData() // Recargar para aplicar nueva configuración
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return {
    farmacos,
    lotes,
    proveedores,
    loading,
    error,
    alertConfig,
    fetchData,
    refreshLotes,
    refreshFarmacos,
    getInventoryData,
    getCategories,
  }
}
