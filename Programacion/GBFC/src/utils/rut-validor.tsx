// Función para validar RUT chileno
export const validateRUT = (rut: string): boolean => {
    if (!rut) return false
  
    const cleanRUT = rut.replace(/[^0-9kK]/g, "").toLowerCase()
    if (cleanRUT.length < 8) return false
  
    const body = cleanRUT.slice(0, -1)
    const dv = cleanRUT.slice(-1)
  
    let sum = 0
    let multiplier = 2
  
    for (let i = body.length - 1; i >= 0; i--) {
      sum += Number.parseInt(body[i]) * multiplier
      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }
  
    const remainder = sum % 11
    const calculatedDV = remainder < 2 ? remainder.toString() : 11 - remainder === 10 ? "k" : (11 - remainder).toString()
  
    return dv === calculatedDV
  }
  
  // Función para formatear RUT
  export const formatRUT = (value: string): string => {
    const cleaned = value.replace(/[^0-9kK]/g, "")
    if (cleaned.length <= 1) return cleaned
  
    const body = cleaned.slice(0, -1)
    const dv = cleaned.slice(-1)
  
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  
    return `${formattedBody}-${dv}`
  }
  