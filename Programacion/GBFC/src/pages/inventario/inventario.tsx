import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, Download, Plus, MoreVertical, Pencil, Package, Clock } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { EditFarmacoModal } from "../../components/modals/editar_farmaco"
import { AjustarStockModal } from "../../components/modals/ajuste_farmaco"
import { HistorialFarmacoModal } from "../../components/modals/historial_farmaco"
import { RegistrarFarmacoModal } from "../../components/modals/registro_farmaco"
import { supabase } from "../../libs/supabase"

export default function Inventario() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})
  const [modalEditar, setModalEditar] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalAjuste, setModalAjuste] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalHistorial, setModalHistorial] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalRegistrar, setModalRegistrar] = useState(false)
  const [farmacos, setFarmacos] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [historial, setHistorial] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: farmacosData, error: farmacosError } = await supabase.from("farmaco").select("*, categoria, codigo, uni_medida, stock, id_farmaco")
      const { data: lotesData, error: lotesError } = await supabase.from("lote").select("*, id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco")
      if (!farmacosError && !lotesError) {
        setFarmacos(farmacosData || [])
        setLotes(lotesData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!modalHistorial.open || !modalHistorial.data?.id) {
        setHistorial([])
        return
      }
      // Buscar lotes del fármaco
      const lotesFarmaco = lotes.filter(l => l.farmaco_id_farmaco === modalHistorial.data.id)
      if (lotesFarmaco.length === 0) {
        setHistorial([])
        return
      }
      // Buscar historial de ajustes para esos lotes
      const loteIds = lotesFarmaco.map(l => l.id_lote)
      const { data: ajustes } = await supabase
        .from("historial_ajuste")
        .select("*")
        .in("lote_id_lote", loteIds)
        .order("fec_ajuste", { ascending: false })
      setHistorial(
        (ajustes || []).map(a => ({
          fecha: a.fec_ajuste,
          entrada: a.tipo_ajuste === "Entrada" ? a.cant_ajuste : null,
          salida: a.tipo_ajuste === "Salida" ? a.cant_ajuste : null,
          total: a.cant_nueva,
        }))
      )
    }
    fetchHistorial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalHistorial.open, modalHistorial.data, lotes])

  const inventoryData = farmacos.flatMap(farmaco => {
    const lotesFarmaco = lotes.filter(l => l.farmaco_id_farmaco === farmaco.id_farmaco)
    if (lotesFarmaco.length === 0) {
      return [{
        id: farmaco.id_farmaco,
        nombre: farmaco.nombre,
        lote: "-",
        categoria: farmaco.categoria,
        stock: farmaco.stock,
        vencimiento: "-",
        estado: farmaco.stock < 50 ? "Stock bajo" : "Disponible",
      }]
    }
    return lotesFarmaco.map(lote => ({
      id: farmaco.id_farmaco,
      nombre: farmaco.nombre,
      lote: lote.num_lote,
      categoria: farmaco.categoria,
      stock: lote.cantidad,
      vencimiento: lote.fec_venci,
      estado: lote.cantidad < 50 ? "Stock bajo" : "Disponible",
    }))
  })

  const categories = [
    "Todos",
    ...Array.from(new Set(farmacos.map(f => f.categoria)))
  ]

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Disponible":
        return "success"
      case "Stock bajo":
        return "destructive"
      case "Proximo a vencer":
        return "warning"
    }
  }

  const filteredData = inventoryData.filter(
    (item) =>
      (selectedCategory === "Todos" || item.categoria === selectedCategory) &&
      (item.nombre.toLowerCase().includes(search.toLowerCase()) ||
        item.lote.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 text-lg mt-1">Gestión de fármacos y lotes</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2 font-medium">
            <Download className="h-5 w-5" />
            Exportar
          </Button>
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalRegistrar(true)} // <-- Abre el modal al hacer click
          >
            <Plus className="h-5 w-5" />
            Registrar Fármaco
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex flex-1 gap-1 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "ghost"}
              className={`rounded-md px-4 py-2 text-base font-medium ${
                selectedCategory === cat ? "" : "text-gray-700"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
          <Button
            variant="outline"
            className="flex items-center gap-2 px-4 py-2 text-base font-medium"
          >
            <Filter className="h-5 w-5" />
            Filtros
          </Button>
        </div>
        <div className="flex-1 flex justify-end">
          <input
            type="text"
            placeholder="Buscar fármaco..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-md px-4 py-2 text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>
      </div>

      <TableContainer
        columns={[
          { header: "Nombre", render: item => <span className="font-medium text-gray-900">{item.nombre}</span> },
          { header: "Lote", render: item => item.lote },
          { header: "Categoría", render: item => item.categoria },
          { header: "Stock", render: item => item.stock },
          { header: "Vencimiento", render: item => item.vencimiento },
          {
            header: "Estado",
            render: item => (
              <Badge
                variant={getStatusColor(item.estado)}
                className={`text-xs px-3 py-1 ${
                  item.estado === "Disponible"
                    ? "bg-green-500/90 text-white"
                    : item.estado === "Stock bajo"
                    ? "bg-red-100 text-red-600 border border-red-300"
                    : item.estado === "Proximo a vencer"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : ""
                }`}
              >
                {item.estado}
              </Badge>
            ),
          },
          {
            header: "Acciones",
            render: item => (
              <div className="flex items-center">
                <Button
                  ref={el => { buttonRefs.current[item.id] = el }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const rect = buttonRefs.current[item.id]?.getBoundingClientRect()
                    setOpenMenu(openMenu === item.id ? null : item.id)
                    setMenuPosition(
                      rect
                        ? {
                            top: rect.bottom + window.scrollY,
                            left: Math.min(rect.left, window.innerWidth - 220),
                          }
                        : null
                    )
                  }}
                  aria-label="Acciones"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                <AnimatePresence>
                  {openMenu === item.id && menuPosition && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenu(null)}
                        aria-hidden="true"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed bg-white border rounded-xl shadow-lg z-50 min-w-[200px] py-2"
                        style={{
                          top: menuPosition.top,
                          left: menuPosition.left,
                        }}
                      >
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setModalEditar({ open: true, data: item })
                            setOpenMenu(null)
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setModalAjuste({ open: true, data: item })
                            setOpenMenu(null)
                          }}
                        >
                          <Package className="h-4 w-4" /> Ajustar stock
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setModalHistorial({ open: true, data: item })
                            setOpenMenu(null)
                          }}
                        >
                          <Clock className="h-4 w-4" /> Historial
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ),
          },
        ]}
        data={filteredData}
      />

      <EditFarmacoModal
        open={modalEditar.open}
        onClose={() => setModalEditar({ open: false })}
        initialData={modalEditar.data}
        onSave={async (data) => {
          if (!modalEditar.data?.id) return;
          await supabase.from("farmaco").update({
            nombre: data.nombre,
            categoria: data.categoria,
            codigo: data.codigo,
          }).eq("id_farmaco", modalEditar.data.id)
          const { data: farmacosData } = await supabase.from("farmaco").select("*, categoria, codigo, uni_medida, stock, id_farmaco")
          setFarmacos(farmacosData || [])
          setModalEditar({ open: false })
        }}
      />
      <AjustarStockModal
        open={modalAjuste.open}
        onClose={() => setModalAjuste({ open: false })}
        farmaco={modalAjuste.data?.nombre || ""}
        onConfirm={async ({ tipo, cantidad, motivo, observaciones }) => {
          if (!modalAjuste.data?.id) return;
          const { data: lotesFarmaco } = await supabase.from("lote").select("*").eq("farmaco_id_farmaco", modalAjuste.data.id)
          if (!lotesFarmaco || lotesFarmaco.length === 0) return;
          const lote = lotesFarmaco[0];
          const nuevoStock = tipo === "Entrada"
            ? lote.cantidad + cantidad
            : Math.max(0, lote.cantidad - cantidad)
          await supabase.from("lote").update({ cantidad: nuevoStock }).eq("id_lote", lote.id_lote)
          await supabase.from("historial_ajuste").insert([
            {
              tipo_ajuste: tipo,
              cant_ajuste: cantidad,
              cant_ant: lote.cantidad,
              cant_nueva: nuevoStock,
              motivo,
              fec_ajuste: new Date().toISOString().slice(0, 10),
              lote_id_lote: lote.id_lote,
            }
          ])
          const { data: lotesData } = await supabase.from("lote").select("*, id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco")
          setLotes(lotesData || [])
          setModalAjuste({ open: false })
        }}
      />
      <HistorialFarmacoModal
        open={modalHistorial.open}
        onClose={() => setModalHistorial({ open: false })}
        farmaco={modalHistorial.data?.nombre || ""}
        historial={historial}
      />
      <RegistrarFarmacoModal
        open={modalRegistrar}
        onClose={() => setModalRegistrar(false)}
        onRegistrar={async (form) => {
          const { data: newFarmaco, error: errorFarmaco } = await supabase.from("farmaco").insert([
            {
              nombre: form.nombre,
              categoria: form.categoria || "Otros",
              codigo: form.codigo,
              uni_medida: form.unidad,
              stock: Number(form.total),
            }
          ]).select().single()
          if (errorFarmaco || !newFarmaco) {
            alert("Error al registrar fármaco")
            return
          }
          await supabase.from("lote").insert([
            {
              num_lote: form.lote,
              fec_fabri: new Date().toISOString().slice(0, 10), 
              fec_venci: form.fechaVencimiento,
              cantidad: Number(form.total),
              precio: 0,
              farmaco_id_farmaco: newFarmaco.id_farmaco,
            }
          ])
          setModalRegistrar(false)
          const { data: farmacosData } = await supabase.from("farmaco").select("*, categoria, codigo, uni_medida, stock, id_farmaco")
          const { data: lotesData } = await supabase.from("lote").select("*, id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco")
          setFarmacos(farmacosData || [])
          setLotes(lotesData || [])
        }}
      />
    </div>
  )
}