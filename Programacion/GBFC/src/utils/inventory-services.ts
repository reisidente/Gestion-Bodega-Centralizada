import { supabase } from "../libs/supabase"
import { getFechaLocal, guardarTimestampActividad } from "../libs/utils"

/**
 * Servicio para operaciones de fármacos
 */
export class FarmacoService {
  /**
   * Actualiza un fármaco existente
   */
  static async updateFarmaco(
    farmacoId: number,
    data: {
      nombre_comercial: string
      categoria: string
      codigo: string
      uni_medida: string
    }
  ) {
    const { error } = await supabase
      .from("farmaco")
      .update(data)
      .eq("id_farmaco", farmacoId)

    if (error) throw error
  }

  /**
   * Actualiza el precio de un lote específico
   */
  static async updateLotePrice(loteId: number, precio: number) {
    const { error } = await supabase
      .from("lote")
      .update({ precio })
      .eq("id_lote", loteId)

    if (error) throw error
  }

  /**
   * Valida que un código de fármaco sea único
   */
  static async validateUniqueCode(codigo: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("farmaco")
      .select("codigo")
      .eq("codigo", codigo)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
      throw error
    }

    return !data // true si no existe
  }

  /**
   * Registra un nuevo fármaco
   */
  static async createFarmaco(data: {
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
  }) {
    // Validar código único
    const isUnique = await this.validateUniqueCode(data.codigo)
    if (!isUnique) {
      throw new Error(`Ya existe un fármaco con el código: ${data.codigo}`)
    }

    const { error } = await supabase.from("farmaco").insert([data])
    if (error) throw error
  }
}

/**
 * Servicio para operaciones de lotes
 */
export class LoteService {
  /**
   * Valida las fechas de un lote
   */
  static validateDates(fechaFabricacion: string, fechaVencimiento: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const vencimientoDate = new Date(fechaVencimiento)
    vencimientoDate.setHours(0, 0, 0, 0)
    
    const fabricacionDate = new Date(fechaFabricacion)
    fabricacionDate.setHours(0, 0, 0, 0)

    if (vencimientoDate < today) {
      throw new Error("La fecha de vencimiento no puede ser anterior a la fecha actual.")
    }

    if (vencimientoDate <= fabricacionDate) {
      throw new Error("La fecha de vencimiento debe ser posterior a la fecha de fabricación.")
    }
  }

  /**
   * Crea un nuevo lote
   */
  static async createLote(data: {
    num_lote: string
    fec_fabri: string
    fec_venci: string
    cantidad: number
    precio: number
    farmaco_id_farmaco: number
    id_proveedor?: number
  }) {
    // Validar fechas
    this.validateDates(data.fec_fabri, data.fec_venci)

    const { data: nuevoLote, error } = await supabase
      .from("lote")
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return nuevoLote
  }

  /**
   * Elimina un lote (solo si tiene stock 0)
   */
  static async deleteLote(loteId: number, stock: number) {
    if (stock > 0) {
      throw new Error("No se puede eliminar un lote que tiene stock disponible.")
    }

    const { error } = await supabase
      .from("lote")
      .delete()
      .eq("id_lote", loteId)

    if (error) throw error
  }

  /**
   * Obtiene el stock actual de un lote
   */
  static async getCurrentStock(loteId: number): Promise<number> {
    const { data, error } = await supabase
      .from("lote")
      .select("cantidad")
      .eq("id_lote", loteId)
      .single()

    if (error) throw error
    return data?.cantidad || 0
  }

  /**
   * Actualiza el stock de un lote
   */
  static async updateStock(loteId: number, nuevaCantidad: number) {
    const { error } = await supabase
      .from("lote")
      .update({ cantidad: nuevaCantidad })
      .eq("id_lote", loteId)

    if (error) throw error
  }
}

/**
 * Servicio para operaciones de historial y ajustes
 */
export class AjusteService {
  /**
   * Registra un ajuste de stock
   */
  static async createAjuste(data: {
    tipo_ajuste: "Entrada" | "Salida"
    cant_ajuste: number
    cant_ant: number
    cant_nueva: number
    motivo: string
    lote_id_lote: number
  }) {
    const ajusteData = {
      ...data,
      fec_ajuste: getFechaLocal(),
    }

    const { data: ajuste, error } = await supabase
      .from("historial_ajuste")
      .insert([ajusteData])
      .select()
      .single()

    if (error) throw error

    // Guardar timestamp de actividad
    if (ajuste) {
      await guardarTimestampActividad(ajuste.id_ajuste, "Ajuste")
    }

    return ajuste
  }

  /**
   * Realiza un ajuste completo de stock (actualiza lote + registra historial)
   */
  static async performStockAdjustment(
    loteId: number,
    tipo: "Entrada" | "Salida",
    cantidad: number,
    motivo: string
  ) {
    // Obtener stock actual
    const stockActual = await LoteService.getCurrentStock(loteId)

    // Calcular nuevo stock
    const nuevoStock = tipo === "Entrada" 
      ? stockActual + cantidad 
      : Math.max(0, stockActual - cantidad)

    // Actualizar stock
    await LoteService.updateStock(loteId, nuevoStock)

    // Registrar ajuste
    const ajuste = await this.createAjuste({
      tipo_ajuste: tipo,
      cant_ajuste: cantidad,
      cant_ant: stockActual,
      cant_nueva: nuevoStock,
      motivo,
      lote_id_lote: loteId,
    })

    return { ajuste, stockAnterior: stockActual, stockNuevo: nuevoStock }
  }

  /**
   * Registra un ingreso inicial de lote (para nuevos lotes)
   */
  static async registerInitialEntry(loteId: number, cantidad: number) {
    return this.createAjuste({
      tipo_ajuste: "Entrada",
      cant_ajuste: cantidad,
      cant_ant: 0,
      cant_nueva: cantidad,
      motivo: "Registro",
      lote_id_lote: loteId,
    })
  }
}
