import { useState } from "react"
import { BaseModal } from "./base"

interface SeleccionarFarmacoParaLoteModalProps {
  open: boolean
  onClose: () => void
  farmacos: any[]
  onSelect: (farmaco: any) => void
}

export function SeleccionarFarmacoParaLoteModal({ open, onClose, farmacos, onSelect }: SeleccionarFarmacoParaLoteModalProps) {
  const [search, setSearch] = useState("")

  const filteredFarmacos = farmacos.filter(f =>
    f.nombre_comercial.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-2xl">
      <div className="p-2">
        <h2 className="font-semibold text-2xl mb-2">Seleccionar Fármaco</h2>
        <p className="text-gray-500 mb-4">Elige un fármaco para agregarle un nuevo lote.</p>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border rounded-md px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-200 transition"
        />
        <div className="max-h-80 overflow-y-auto pr-2">
          {filteredFarmacos.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredFarmacos.map(farmaco => (
                <li key={farmaco.id_farmaco}>
                  <button
                    className="w-full text-left py-3 px-2 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => onSelect(farmaco)}
                  >
                    <p className="font-semibold text-gray-800">{farmaco.nombre_comercial}</p>
                    <p className="text-sm text-gray-500">Código: {farmaco.codigo}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">No se encontraron fármacos.</p>
          )}
        </div>
      </div>
    </BaseModal>
  )
}