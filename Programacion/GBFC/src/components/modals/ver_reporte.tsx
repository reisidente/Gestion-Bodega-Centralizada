import { BaseModal } from "./base"

interface ReporteInfo {
  titulo: string
  tipo: string
  formato: string
  fecha: string
  descripcion?: string
  columnas?: string[]
  datos?: { [key: string]: string | number }[]
}

interface VerReporteModalProps {
  open: boolean
  onClose: () => void
  reporte: ReporteInfo
  onDescargar?: () => void
  onEditar?: () => void
  onVolver?: () => void
}

export function VerReporteModal({
  open,
  onClose,
  reporte,
  onDescargar,
  onEditar,
  onVolver,
}: VerReporteModalProps) {
  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-4xl">
      <div className="p-6">
        {/* Título y acciones */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">{reporte.titulo}</h2>
            <p className="text-gray-500">Detalles del reporte</p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 rounded-md border bg-white text-black font-medium shadow hover:bg-gray-50"
              onClick={onVolver}
            >
              Volver
            </button>
            <button
              className="px-4 py-2 rounded-md border bg-white text-black font-medium shadow hover:bg-gray-50"
              onClick={onDescargar}
            >
              Descargar
            </button>
            <button
              className="px-4 py-2 rounded-md border bg-white text-black font-medium shadow hover:bg-gray-50"
              onClick={onEditar}
            >
              Editar
            </button>
          </div>
        </div>

        {/* Información del reporte */}
        <div className="border rounded-md p-6 bg-white mb-6">
          <div className="font-semibold text-lg mb-2">{reporte.titulo}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
            <div>
              <span className="text-gray-600">Tipo:</span> {reporte.tipo}
            </div>
            <div>
              <span className="text-gray-600">Formato:</span> {reporte.formato}
            </div>
            <div>
              <span className="text-gray-600">Fecha generación:</span> {reporte.fecha}
            </div>
          </div>
          {reporte.descripcion && (
            <div className="mt-3 text-gray-700">{reporte.descripcion}</div>
          )}
        </div>

        {/* Datos del reporte */}
        <div className="border rounded-md p-6 bg-white">
          <div className="font-semibold text-lg mb-2">Datos reporte</div>
          <div className="overflow-x-auto">
            <table className="w-full text-base border-collapse">
              <thead>
                <tr>
                  {(reporte.columnas || []).map((col, idx) => (
                    <th
                      key={idx}
                      className="bg-gray-200 text-left px-3 py-2 font-medium border-b"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(reporte.datos || []).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50" : ""}>
                    {(reporte.columnas || []).map((col, cidx) => (
                      <td key={cidx} className="px-3 py-2 border-b">
                        {row[col] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseModal>
  )
}