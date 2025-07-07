import { useEffect, useState } from "react"
import { TableContainer } from "../ui/table"
import { supabase } from "../../libs/supabase"
import { Button } from "../ui/button"

// Función para formatear fecha
const formatearFecha = (fecha: string) => {
  if (!fecha) return "-"
  const partes = fecha.split('-')
  if (partes.length === 3) {
    const [año, mes, dia] = partes
    return `${dia}/${mes}/${año}`
  }
  return fecha
}

interface Farmaco {
  id_farmaco: number
  codigo: string
  nombre_comercial: string
  categoria: string
  lotes: Lote[]
}

interface Lote {
  id_lote: number
  num_lote: string
  fec_venci: string
  cantidad: number
  precio: number
}

interface Seleccion {
  id_farmaco: number
  codigo: string
  nombre_comercial: string
  cantidad: number
  lote_seleccionado?: Lote
}

interface SelectorFarmacosProps {
  value: Seleccion[]
  onChange: (seleccion: Seleccion[]) => void
  mostrarLotes?: boolean // Nueva prop para controlar si mostrar información de lotes
}

export function SelectorFarmacos({ value, onChange, mostrarLotes = true }: SelectorFarmacosProps) {
  const [farmacos, setFarmacos] = useState<Farmaco[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchFarmacos = async () => {
      if (mostrarLotes) {
        // Modo original: obtener fármacos con lotes para despacho
        const [{ data: farmacosData }, { data: lotesData }] = await Promise.all([
          supabase.from("farmaco").select("id_farmaco, codigo, nombre_comercial, categoria"),
          supabase.from("lote").select("id_lote, num_lote, fec_venci, cantidad, precio, farmaco_id_farmaco").gt("cantidad", 0).eq("activo", true)
        ])

        if (farmacosData && lotesData) {
          // Combinar fármacos con sus lotes disponibles
          const farmacosConLotes = farmacosData.map(farmaco => ({
            ...farmaco,
            lotes: lotesData.filter(lote => lote.farmaco_id_farmaco === farmaco.id_farmaco)
          })).filter(farmaco => farmaco.lotes.length > 0) // Solo mostrar fármacos con stock disponible

          setFarmacos(farmacosConLotes)
        }
      } else {
        // Modo orden de compra: solo obtener fármacos sin lotes
        const { data: farmacosData } = await supabase
          .from("farmaco")
          .select("id_farmaco, codigo, nombre_comercial, categoria")

        if (farmacosData) {
          // Para órdenes de compra, todos los fármacos están disponibles (sin considerar stock)
          const farmacosParaCompra = farmacosData.map(farmaco => ({
            ...farmaco,
            lotes: [] // Sin lotes para órdenes de compra
          }))

          setFarmacos(farmacosParaCompra)
        }
      }
    }
    fetchFarmacos()
  }, [mostrarLotes])

  const handleSelect = (farmaco: Farmaco, lote?: Lote) => {
    if (!value.some(f => f.id_farmaco === farmaco.id_farmaco)) {
      const nuevaSeleccion = {
        ...farmaco,
        cantidad: 1,
        ...(lote && { lote_seleccionado: lote }) // Solo agregar lote si existe
      }
      onChange([...value, nuevaSeleccion])
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
    f.nombre_comercial.toLowerCase().includes(search.toLowerCase())
  )

  // Generar datos para la tabla según el modo
  const datosParaTabla = mostrarLotes 
    ? // Modo con lotes: expandir fármacos con sus lotes para mostrar cada lote como una fila
      filtered.flatMap(farmaco =>
        farmaco.lotes.map(lote => ({
          ...farmaco,
          lote_actual: lote,
          ya_seleccionado: !!value.find(v => v.id_farmaco === farmaco.id_farmaco)
        }))
      )
    : // Modo sin lotes: mostrar solo fármacos
      filtered.map(farmaco => ({
        ...farmaco,
        ya_seleccionado: !!value.find(v => v.id_farmaco === farmaco.id_farmaco)
      }))

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
        columns={mostrarLotes ? [
          // Columnas para modo con lotes (despacho)
          { header: "Código", render: (f: any) => f.codigo },
          { header: "Nombre", render: (f: any) => f.nombre_comercial },
          { header: "Categoría", render: (f: any) => f.categoria },
          { 
            header: "Lote", 
            render: (f: any) => (
              <span className="font-medium">
                {f.lote_actual.num_lote}
                <span className="ml-1 text-xs text-gray-500">#{f.lote_actual.id_lote}</span>
              </span>
            )
          },
          { header: "Vencimiento", render: (f: any) => formatearFecha(f.lote_actual.fec_venci) },
          { header: "Stock", render: (f: any) => f.lote_actual.cantidad },
          { header: "Precio", render: (f: any) => `$${f.lote_actual.precio?.toLocaleString() || '0'}` },
          {
            header: "Seleccionar",
            render: (f: any) => (
              <Button 
                size="sm" 
                onClick={() => handleSelect(f, f.lote_actual)} 
                disabled={f.ya_seleccionado}
              >
                {f.ya_seleccionado ? 'Seleccionado' : 'Agregar'}
              </Button>
            )
          }
        ] : [
          // Columnas para modo sin lotes (orden de compra)
          { header: "Código", render: (f: any) => f.codigo },
          { header: "Nombre", render: (f: any) => f.nombre_comercial },
          { header: "Categoría", render: (f: any) => f.categoria },
          {
            header: "Seleccionar",
            render: (f: any) => (
              <Button 
                size="sm" 
                onClick={() => handleSelect(f)} 
                disabled={f.ya_seleccionado}
              >
                {f.ya_seleccionado ? 'Seleccionado' : 'Agregar'}
              </Button>
            )
          }
        ]}
        data={datosParaTabla}
        emptyMessage={mostrarLotes ? "No hay fármacos con stock disponible." : "No hay fármacos disponibles."}
        minWidth={mostrarLotes ? "800px" : "600px"}
      />
      {value.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Fármacos seleccionados</h3>
          <TableContainer
            columns={mostrarLotes ? [
              // Columnas para modo con lotes (despacho)
              { header: "Código", render: (f: any) => f.codigo },
              { header: "Nombre", render: (f: any) => f.nombre_comercial },
              { 
                header: "Lote", 
                render: (f: any) => f.lote_seleccionado ? (
                  <span className="font-medium">
                    {f.lote_seleccionado.num_lote}
                    <span className="ml-1 text-xs text-gray-500">#{f.lote_seleccionado.id_lote}</span>
                  </span>
                ) : 'N/A'
              },
              { header: "Vencimiento", render: (f: any) => f.lote_seleccionado ? formatearFecha(f.lote_seleccionado.fec_venci) : 'N/A' },
              { header: "Stock Disponible", render: (f: any) => f.lote_seleccionado?.cantidad || 0 },
              {
                header: "Cantidad solicitada",
                render: (f: any) => (
                  <input
                    type="number"
                    min={1}
                    max={f.lote_seleccionado?.cantidad || 999}
                    value={f.cantidad}
                    onChange={e => handleCantidad(f.id_farmaco, Math.max(1, Math.min(Number(e.target.value), f.lote_seleccionado?.cantidad || 999)))}
                    className="border rounded-md px-2 py-1 w-20"
                  />
                )
              },
              {
                header: "Quitar",
                render: (f: any) => (
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(f.id_farmaco)}>
                    Quitar
                  </Button>
                )
              }
            ] : [
              // Columnas para modo sin lotes (orden de compra)
              { header: "Código", render: (f: any) => f.codigo },
              { header: "Nombre", render: (f: any) => f.nombre_comercial },
              { header: "Categoría", render: (f: any) => f.categoria },
              {
                header: "Cantidad solicitada",
                render: (f: any) => (
                  <input
                    type="number"
                    min={1}
                    value={f.cantidad}
                    onChange={e => handleCantidad(f.id_farmaco, Number(e.target.value))}
                    className="border rounded-md px-2 py-1 w-20"
                  />
                )
              },
              {
                header: "Quitar",
                render: (f: any) => (
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(f.id_farmaco)}>
                    Quitar
                  </Button>
                )
              }
            ]}
            data={value}
            minWidth={mostrarLotes ? "800px" : "600px"}
          />
        </div>
      )}
    </div>
  )
}
