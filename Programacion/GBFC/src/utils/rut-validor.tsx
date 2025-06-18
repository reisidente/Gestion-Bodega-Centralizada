// Valida un RUT chileno. Retorna true si es válido, false si no.
export const validateRUT = (rut: string): boolean => {
  if (!rut) return false;
  const cleanRUT = rut.replace(/[^0-9kK]/g, '').toLowerCase();
  if (cleanRUT.length < 8) return false;
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  const dvCalc = 11 - remainder;
  const calculatedDV = dvCalc === 11 ? '0' : dvCalc === 10 ? 'k' : dvCalc.toString();
  return dv === calculatedDV;
};

// Formatea un RUT chileno a la forma 12.345.678-9	ex: 12345678k -> 12.345.678-k
export const formatRUT = (rut: string): string => {
  const cleaned = rut.replace(/[^0-9kK]/g, '');
  if (cleaned.length <= 1) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
};

// Parsea un RUT y retorna el número y dígito verificador si es válido, o null si no lo es
export const parseRUT = (rut: string): { rut: number; dv: string } | null => {
  if (!rut) return null;
  const cleanRUT = rut.replace(/[^0-9kK]/g, '').toLowerCase();
  if (cleanRUT.length < 8) return null;
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  if (!validateRUT(rut)) return null;
  return { rut: parseInt(body, 10), dv };
};