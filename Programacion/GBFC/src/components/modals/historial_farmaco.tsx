import { BaseModal } from "./base"

interface HistorialFarmacoModalProps {
  open: boolean
  onClose: () => void
  farmaco: string
  historial?: {
    fecha: string
    entrada: number | null
    salida: number | null
    total: number
  }[]
}

export function HistorialFarmacoModal({
  open,
  onClose,
  farmaco,
  historial = [],
}: HistorialFarmacoModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-2xl">
      <h2 className="text-xl font-bold text-center mb-6">Historial Fármaco</h2>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2">Fecha</th>
              <th className="border border-gray-300 px-3 py-2">Entrada</th>
              <th className="border border-gray-300 px-3 py-2">Salida</th>
              <th className="border border-gray-300 px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-gray-400">
                  No hay movimientos registrados.
                </td>
              </tr>
            ) : (
              historial.map((item, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 1 ? "bg-gray-50" : ""}
                >
                  <td className="border border-gray-300 px-3 py-2">{item.fecha}</td>
                  <td className="border border-gray-300 px-3 py-2">{item.entrada ?? ""}</td>
                  <td className="border border-gray-300 px-3 py-2">{item.salida ?? ""}</td>
                  <td className="border border-gray-300 px-3 py-2">{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </BaseModal>
  )
}