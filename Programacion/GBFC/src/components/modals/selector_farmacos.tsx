import { useEffect, useState } from "react"
import { TableContainer } from "../ui/table"
import { supabase } from "../../libs/supabase"
import { Button } from "../ui/button"

interface Farmaco {
  id_farmaco: number
  codigo: string
  nombre: string
  categoria: string
  stock: number
}

interface Seleccion {
  id_farmaco: number
  codigo: string
  nombre: string
  cantidad: number
}

interface SelectorFarmacosProps {
  value: Seleccion[]
  onChange: (seleccion: Seleccion[]) => void
}

export function SelectorFarmacos({ value, onChange }: SelectorFarmacosProps) {
  const [farmacos, setFarmacos] = useState<Farmaco[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchFarmacos = async () => {
      const { data } = await supabase.from("farmaco").select("id_farmaco, codigo, nombre, categoria, stock")
      setFarmacos(data || [])
    }
    fetchFarmacos()
  }, [])

  const handleSelect = (farmaco: Farmaco) => {
    if (!value.some(f => f.id_farmaco === farmaco.id_farmaco)) {
      onChange([...value, { ...farmaco, cantidad: 1 }])
    }
  }

  const handleCantidad = (id_farmaco: number, cantidad: number) => {
    onChange(value.map(f => f.id_farmaco === id_farmaco ? { ...f, cantidad } : f))
  }

  const handleRemove = (id_farmaco: number) => {
    onChange(value.filter(f => f.id_farmaco !== id_farmaco))
  }

  const filtered = farmacos.filter(f =>
    f.codigo.toLowerCase().includes(search.toLowerCase()) ||
    f.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 w-full"
        />
      </div>
      <TableContainer
        columns={[
          { header: "Código", render: f => f.codigo },
          { header: "Nombre", render: f => f.nombre },
          { header: "Categoría", render: f => f.categoria },
          { header: "Stock", render: f => f.stock },
          {
            header: "Seleccionar",
            render: f => (
              <Button size="sm" onClick={() => handleSelect(f)} disabled={!!value.find(v => v.id_farmaco === f.id_farmaco)}>
                Agregar
              </Button>
            )
          }
        ]}
        data={filtered}
        emptyMessage="No hay fármacos disponibles."
        minWidth="600px"
      />
      {value.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Fármacos seleccionados</h3>
          <TableContainer
            columns={[
              { header: "Código", render: f => f.codigo },
              { header: "Nombre", render: f => f.nombre },
              {
                header: "Cantidad solicitada",
                render: f => (
                  <input
                    type="number"
                    min={1}
                    value={f.cantidad}
                    onChange={e => handleCantidad(f.id_farmaco, Math.max(1, Number(e.target.value)))}
                    className="border rounded-md px-2 py-1 w-20"
                  />
                )
              },
              {
                header: "Quitar",
                render: f => (
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(f.id_farmaco)}>
                    Quitar
                  </Button>
                )
              }
            ]}
            data={value}
            minWidth="400px"
          />
        </div>
      )}
    </div>
  )
}
