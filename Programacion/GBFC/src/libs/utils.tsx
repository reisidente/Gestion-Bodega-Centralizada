import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para obtener la fecha local en formato YYYY-MM-DD
export function getFechaLocal(): string {
  const ahora = new Date()
  const año = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${año}-${mes}-${dia}`
}

// Función para obtener la fecha y hora local en formato ISO para registros
export function getFechaHoraLocalParaRegistro(): string {
  return new Date().toISOString()
}

// Función para guardar timestamp de actividad local (para mejorar precisión de tiempo relativo)
export function guardarTimestampActividad(id: string, tipo: string): void {
  const timestamps = JSON.parse(localStorage.getItem('activity_timestamps') || '{}')
  timestamps[`${tipo}-${id}`] = new Date().toISOString()
  localStorage.setItem('activity_timestamps', JSON.stringify(timestamps))
}

// Función para obtener timestamp de actividad local
export function obtenerTimestampActividad(id: string, tipo: string): string | null {
  const timestamps = JSON.parse(localStorage.getItem('activity_timestamps') || '{}')
  return timestamps[`${tipo}-${id}`] || null
}

// Función para convertir una fecha a formato YYYY-MM-DD manteniendo la fecha local
export function formatearFechaLocal(fecha: Date): string {
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${año}-${mes}-${dia}`
}

// Función para mostrar fechas del historial manteniendo la fecha local
export function formatearFechaHistorial(fechaStr: string): string {
  const fecha = new Date(fechaStr + 'T00:00:00')
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Función mejorada para mostrar tiempo relativo
export function formatTimeAgo(dateInput: string | Date, activityId?: string, activityType?: string): string {
  let date: Date
  
  // Intentar usar timestamp local si está disponible para actividades del día actual
  if (activityId && activityType) {
    const localTimestamp = obtenerTimestampActividad(activityId, activityType)
    if (localTimestamp) {
      const localDate = new Date(localTimestamp)
      const today = new Date()
      // Si el timestamp local es del mismo día, usarlo para mayor precisión
      if (localDate.toDateString() === today.toDateString()) {
        date = localDate
      } else {
        // Si no es del mismo día, usar la fecha original
        date = typeof dateInput === 'string' ? 
          (dateInput.includes('T') || dateInput.includes('Z') ? 
            new Date(dateInput) : 
            new Date(dateInput + 'T12:00:00')) : 
          dateInput
      }
    } else {
      // No hay timestamp local, usar fecha original
      date = typeof dateInput === 'string' ? 
        (dateInput.includes('T') || dateInput.includes('Z') ? 
          new Date(dateInput) : 
          new Date(dateInput + 'T12:00:00')) : 
        dateInput
    }
  } else {
    // Procesamiento normal sin timestamp local
    if (typeof dateInput === 'string') {
      // Si ya incluye información de hora (formato ISO o con T)
      if (dateInput.includes('T') || dateInput.includes('Z')) {
        date = new Date(dateInput)
      } else {
        // Para fechas sin hora (YYYY-MM-DD), usar mediodía del día
        date = new Date(dateInput + 'T12:00:00')
      }
    } else {
      date = dateInput
    }
  }

  // Para fechas inválidas
  if (isNaN(date.getTime())) {
    return 'fecha inválida'
  }

  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  // Calcular la diferencia en días de manera más precisa
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inputDate = new Date(date)
  inputDate.setHours(0, 0, 0, 0)
  const daysDiff = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 0) {
    return 'fecha futura'
  } else if (daysDiff === 0) {
    // Es el mismo día - si tenemos timestamp local, mostrar tiempo exacto
    if (activityId && activityType && obtenerTimestampActividad(activityId, activityType)) {
      if (diffInMinutes < 1) {
        return 'hace un momento'
      } else if (diffInMinutes < 60) {
        return `hace ${diffInMinutes} min`
      } else {
        return `hace ${diffInHours}h`
      }
    } else {
      // Sin timestamp local, mostrar "hoy"
      return 'hoy'
    }
  } else if (daysDiff === 1) {
    return 'hace 1 día'
  } else if (daysDiff < 7) {
    return `hace ${daysDiff} días`
  } else if (daysDiff < 30) {
    const weeks = Math.floor(daysDiff / 7)
    return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  } else if (daysDiff < 365) {
    const months = Math.floor(daysDiff / 30)
    return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
  } else {
    const years = Math.floor(daysDiff / 365)
    return years === 1 ? 'hace 1 año' : `hace ${years} años`
  }
}

// Función para limpiar timestamps antiguos (mayores a 7 días)
export function limpiarTimestampsAntiguos(): void {
  const timestamps = JSON.parse(localStorage.getItem('activity_timestamps') || '{}')
  const ahora = new Date()
  const unaSemanaEnMs = 7 * 24 * 60 * 60 * 1000
  
  let cambios = false
  Object.keys(timestamps).forEach(key => {
    const timestamp = new Date(timestamps[key])
    if (ahora.getTime() - timestamp.getTime() > unaSemanaEnMs) {
      delete timestamps[key]
      cambios = true
    }
  })
  
  if (cambios) {
    localStorage.setItem('activity_timestamps', JSON.stringify(timestamps))
  }
}
