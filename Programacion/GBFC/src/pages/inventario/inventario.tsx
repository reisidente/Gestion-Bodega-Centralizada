import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, MoreVertical, Pencil, Package, Clock, Tag, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { EditFarmacoModal } from "../../components/modals/editar_farmaco"
import { AjustarStockModal } from "../../components/modals/ajuste_farmaco"
import { HistorialFarmacoModal } from "../../components/modals/historial_farmaco"
import { RegistrarFarmacoModal } from "../../components/modals/registro_farmaco"
import { AgregarLoteModal } from "../../components/modals/agregar_lote"
import { supabase } from "../../libs/supabase"
import { BaseModal } from "../../components/modals/base"
import { getFechaLocal, guardarTimestampActividad } from "../../libs/utils"

interface SeleccionarFarmacoParaLoteModalProps {
  open: boolean
  onClose: () => void
  farmacos: any[]
  onSelect: (farmaco: any) => void
}

function SeleccionarFarmacoParaLoteModal({ open, onClose, farmacos, onSelect }: SeleccionarFarmacoParaLoteModalProps) {
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
        <div className="max-h-96 overflow-y-auto pr-2">
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
  const [modalAgregarLote, setModalAgregarLote] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalSeleccionarFarmaco, setModalSeleccionarFarmaco] = useState(false)
  const [farmacos, setFarmacos] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [mostrarStockCero, setMostrarStockCero] = useState(false)
  const [alertConfig, setAlertConfig] = useState(() => {
    const savedConfig = localStorage.getItem("alertConfig")
    return savedConfig
      ? JSON.parse(savedConfig)
      : {
          diasVencimiento: 30,
          cantidadMinimaStock: 50,
        }
  })

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "alertConfig" && event.newValue) {
        setAlertConfig(JSON.parse(event.newValue))
      }
    }
    window.addEventListener("storage", handleStorageChange)

    const fetchData = async () => {
      try {
        console.log("🔍 Iniciando carga de datos de inventario...")
        
        // Verificar usuario autenticado
        const { data: { user } } = await supabase.auth.getUser()
        console.log("👤 Usuario autenticado:", user?.email || "No hay usuario en Supabase Auth")
        
        // Verificar sesión local
        const localSession = localStorage.getItem('userSession')
        if (localSession) {
          const session = JSON.parse(localSession)
          console.log("📱 Sesión local:", session.email)
        }
        
        const [
          { data: farmacosData, error: farmacosError },
          { data: lotesData, error: lotesError },
          { data: proveedoresData, error: proveedoresError },
        ] = await Promise.all([
          supabase
            .from("farmaco")
            .select(
              "id_farmaco, nombre_comercial, nombre_generico, categoria, codigo, uni_medida, principio_activo, presentacion, concentracion, via_administracion, observacion"
            ),
          supabase
            .from("lote")
            .select(
              "id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco, id_proveedor"
            ),
          supabase.from("proveedor").select("*"),
        ])

        console.log("📊 Resultados de consultas:")
        console.log("- Fármacos:", farmacosData?.length || 0, farmacosError ? `Error: ${farmacosError.message}` : "")
        console.log("- Lotes:", lotesData?.length || 0, lotesError ? `Error: ${lotesError.message}` : "")
        console.log("- Proveedores:", proveedoresData?.length || 0, proveedoresError ? `Error: ${proveedoresError.message}` : "")

        if (farmacosData && lotesData && proveedoresData) {
          setFarmacos(farmacosData)
          setLotes(lotesData)
          setProveedores(proveedoresData)
        } else {
          console.error("❌ Algunas consultas fallaron:")
          if (farmacosError) console.error("- Error fármacos:", farmacosError)
          if (lotesError) console.error("- Error lotes:", lotesError)
          if (proveedoresError) console.error("- Error proveedores:", proveedoresError)
        }
      } catch (error) {
        console.error("💥 Error general al cargar datos:", error)
      }
    }
    fetchData()

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const inventoryData = farmacos.flatMap((farmaco) => {
    const lotesFarmaco = lotes.filter(
      (l) => l.farmaco_id_farmaco === farmaco.id_farmaco
    )

    let precioFarmaco = 0
    if (lotesFarmaco.length > 0) {
      precioFarmaco = Math.max(...lotesFarmaco.map(l => l.precio || 0))
    }

    const today = new Date()
    const limitDate = new Date()
    limitDate.setDate(today.getDate() + alertConfig.diasVencimiento)

    const totalStock = lotesFarmaco.reduce((sum, l) => sum + l.cantidad, 0)
    const isStockBajo =
      totalStock > 0 && totalStock <= alertConfig.cantidadMinimaStock

    if (lotesFarmaco.length === 0) {
      return []
    }

    if (!mostrarStockCero && totalStock === 0) {
      return []
    }

    return lotesFarmaco.map((lote) => {
      const vencimientoParts = lote.fec_venci.split("-").map(Number);
      const vencimientoDate = new Date(vencimientoParts[0], vencimientoParts[1] - 1, vencimientoParts[2]);

      const isProximoAVencer = vencimientoDate <= limitDate && vencimientoDate >= today;
      
      let estado = "Disponible";

      if (isStockBajo) {
        estado = "Stock bajo";
      } 
      else if (isProximoAVencer) {
        estado = "Proximo a vencer";
      }

      return {
        id: farmaco.id_farmaco,
        codigo: farmaco.codigo,
        nombre: farmaco.nombre_comercial,
        lote: lote.num_lote,
        categoria: farmaco.categoria,
        stock: lote.cantidad,
        vencimiento: lote.fec_venci,
        precio: precioFarmaco,
        uni_medida: farmaco.uni_medida,
        estado,
        id_lote: lote.id_lote,
        totalStock,
      }
    })
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

  const handleEliminarLote = async (item: any) => {
    if (item.stock > 0) {
      alert("No se puede eliminar un lote que tiene stock disponible.");
      return;
    }

    if (window.confirm(`¿Está seguro de que desea eliminar el lote "${item.lote}" del fármaco "${item.nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        const { error: loteError } = await supabase
          .from("lote")
          .delete()
          .eq("id_lote", item.id_lote);

        if (loteError) {
          console.error("Error al eliminar lote:", loteError);
          alert("Error al eliminar el lote.");
          return;
        }
        const { data: lotesData } = await supabase
          .from("lote")
          .select(
            "id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco, id_proveedor"
          );

        if (lotesData) {
          setLotes(lotesData);
        }
      } catch (error) {
        console.error("Error al eliminar lote:", error);
        alert("Error inesperado al eliminar el lote.");
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 text-lg mt-1">Gestión de fármacos y lotes</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button
            variant={mostrarStockCero ? "default" : "outline"}
            className={`flex items-center gap-2 font-medium ${
              mostrarStockCero 
                ? "bg-gray-600 hover:bg-gray-700 text-white" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setMostrarStockCero(!mostrarStockCero)}
          >
            {mostrarStockCero ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {mostrarStockCero ? "Ocultar Stock 0" : "Mostrar Stock 0"}
          </Button>
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalSeleccionarFarmaco(true)}
          >
            <Tag className="h-5 w-5" />
            Añadir Lote
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
          { header: "Código", render: item => <span className="font-medium text-gray-900">{item.codigo}</span>, sortKey: "codigo" },
          { header: "Nombre", render: item => item.nombre, sortKey: "nombre" },
          { header: "Lote", render: item => item.lote, sortKey: "lote" },
          { header: "Categoría", render: item => item.categoria, sortKey: "categoria" },
          { header: "Stock", render: item => item.stock, sortKey: "stock" },
          {
            header: "Vencimiento",
            render: (item) => {
              if (!item.vencimiento || item.vencimiento === "-") return "-";
              try {
                const [year, month, day] = item.vencimiento.split("-");
                return `${day}-${month}-${year}`;
              } catch (e) {
                return item.vencimiento;
              }
            },
            sortKey: "vencimiento",
          },
          { header: "Precio", render: item => `$${item.precio || 0}`, sortKey: "precio" },
          {
            header: "Estado",
            render: item => (
              <Badge
                variant={getStatusColor(item.estado)}
                className={`text-xs px-3 py-1 ${
                  item.estado === "Disponible"
                    ? "bg-green-500/90 text-white"
                    : item.estado === "Stock bajo"
                    ? "bg-red-500/90 text-white"
                    : item.estado === "Proximo a vencer"
                    ? "bg-yellow-500/90 text-white"
                    : ""
                }`}
              >
                {item.estado}
              </Badge>
            ),
            sortKey: "estado"
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
                    const buttonElement = buttonRefs.current[item.id]
                    if (!buttonElement) return

                    const rect = buttonElement.getBoundingClientRect()
                    const isMenuOpen = openMenu === item.id
                    setOpenMenu(isMenuOpen ? null : item.id)

                    if (!isMenuOpen) {
                      const menuWidth = 200
                      const margin = 10

                      let left = rect.left
                      if (left + menuWidth > window.innerWidth - margin) {
                        left = rect.right - menuWidth
                      }
                      left = Math.max(margin, left)

                      setMenuPosition({
                        top: rect.bottom + window.scrollY,
                        left: left,
                      })
                    }
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
                            setModalEditar({
                              open: true,
                              data: {
                                ...item,
                                id_farmaco: item.id,
                                uni_medida: item.uni_medida,
                                precio: item.precio
                              }
                            })
                            setOpenMenu(null)
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setModalAgregarLote({ open: true, data: item })
                            setOpenMenu(null)
                          }}
                        >
                          <Tag className="h-4 w-4" /> Agregar lote
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
                        {item.stock === 0 && (
                          <button
                            className="flex items-center gap-2 w-full text-left text-base py-2 px-4 hover:bg-red-50 text-red-600 transition-colors"
                            onClick={() => {
                              handleEliminarLote(item)
                              setOpenMenu(null)
                            }}
                          >
                             <Trash2 className="h-4 w-4" /> Eliminar Lote
                          </button>
                        )}
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

      <SeleccionarFarmacoParaLoteModal
        open={modalSeleccionarFarmaco}
        onClose={() => setModalSeleccionarFarmaco(false)}
        farmacos={farmacos}
        onSelect={(farmaco) => {
          setModalSeleccionarFarmaco(false);
          setModalAgregarLote({ open: true, data: { ...farmaco, id: farmaco.id_farmaco } });
        }}
      />

      <EditFarmacoModal
        open={modalEditar.open}
        onClose={() => setModalEditar({ open: false })}
        initialData={modalEditar.data}
        onSave={async (data) => {
          if (!modalEditar.data?.id) return;
          try {
            const { error: updateError } = await supabase
              .from("farmaco")
              .update({
                nombre_comercial: data.nombre_comercial,
                categoria: data.categoria,
                codigo: data.codigo,
                uni_medida: data.uni_medida,
              })
              .eq("id_farmaco", modalEditar.data.id);

            if (updateError) {
              console.error("Error al actualizar fármaco:", updateError);
              return;
            }

            if (modalEditar.data.id_lote) {
              const { error: updateLoteError } = await supabase
                .from("lote")
                .update({
                  precio: data.precio
                })
                .eq("id_lote", modalEditar.data.id_lote);

              if (updateLoteError) {
                console.error("Error al actualizar precio del lote:", updateLoteError);
                return;
              }
            }

            const [{ data: farmacosData }, { data: lotesData }] = await Promise.all([
              supabase
                .from("farmaco")
                .select(
                  "id_farmaco, nombre_comercial, nombre_generico, categoria, codigo, uni_medida, principio_activo, presentacion, concentracion, via_administracion, observacion"
                ),
              supabase
                .from("lote")
                .select("id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco")
            ]);

            if (farmacosData && lotesData) {
              setFarmacos(farmacosData);
              setLotes(lotesData);
            }

            setModalEditar({ open: false });
          } catch (error) {
            console.error("Error en la actualización:", error);
          }
        }}
      />
      <AjustarStockModal
        open={modalAjuste.open}
        onClose={() => setModalAjuste({ open: false })}
        farmaco={modalAjuste.data?.nombre || ""}
        onConfirm={async ({ tipo, cantidad, motivo }) => {
          if (!modalAjuste.data?.id_lote) return;
          const { data: loteActual, error: loteError } = await supabase
            .from("lote")
            .select("cantidad")
            .eq("id_lote", modalAjuste.data.id_lote)
            .single();

          if (loteError || !loteActual) {
            console.error("Error al obtener el lote para ajustar:", loteError);
            return;
          }

          const nuevoStock =
            tipo === "Entrada"
              ? loteActual.cantidad + cantidad
              : Math.max(0, loteActual.cantidad - cantidad);

          await supabase
            .from("lote")
            .update({ cantidad: nuevoStock })
            .eq("id_lote", modalAjuste.data.id_lote);

          const ajusteResult = await supabase.from("historial_ajuste").insert([
            {
              tipo_ajuste: tipo,
              cant_ajuste: cantidad,
              cant_ant: loteActual.cantidad,
              cant_nueva: nuevoStock,
              motivo,
              fec_ajuste: getFechaLocal(),
              lote_id_lote: modalAjuste.data.id_lote,
            },
          ]).select();

          if (ajusteResult.data && ajusteResult.data[0]) {
            guardarTimestampActividad(ajusteResult.data[0].id_ajuste, "Ajuste");
          }

          const { data: lotesData } = await supabase
            .from("lote")
            .select(
              "id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco, id_proveedor"
            );
          setLotes(lotesData || []);
          setModalAjuste({ open: false });
        }}
      />
      <HistorialFarmacoModal
        open={modalHistorial.open}
        onClose={() => setModalHistorial({ open: false })}
        farmaco={modalHistorial.data?.nombre || ""}
        farmacoId={modalHistorial.data?.id || 0}
      />
      <RegistrarFarmacoModal
        open={modalRegistrar}
        onClose={() => setModalRegistrar(false)}
        onRegistrar={async (form) => {
          try {
            // Validar que el código no exista antes de insertar
            const { data: existingFarmaco, error: checkError } = await supabase
              .from("farmaco")
              .select("codigo")
              .eq("codigo", form.codigo)
              .single()

            if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows found
              alert("Error al validar el código: " + checkError.message)
              return
            }

            if (existingFarmaco) {
              alert("Ya existe un fármaco con el código: " + form.codigo)
              return
            }

            // Si llegamos aquí, el código es único, proceder con el registro
            const { error } = await supabase.from("farmaco").insert([
              {
                nombre_comercial: form.nombre_comercial,
                nombre_generico: form.nombre_generico,
                categoria: form.categoria,
                codigo: form.codigo,
                uni_medida: form.uni_medida,
                principio_activo: form.principio_activo,
                presentacion: form.presentacion,
                concentracion: form.concentracion,
                via_administracion: form.via_administracion,
                observacion: form.observacion,
              },
            ])

            if (error) {
              alert("Error al registrar fármaco: " + error.message)
              return
            }

            setModalRegistrar(false)
            const { data: farmacosData } = await supabase
              .from("farmaco")
              .select(
                "id_farmaco, nombre_comercial, nombre_generico, categoria, codigo, uni_medida, principio_activo, presentacion, concentracion, via_administracion, observacion"
              )
            if (farmacosData) {
              setFarmacos(farmacosData)
            }
          } catch (error) {
            alert("Error inesperado: " + error)
          }
        }}
      />
      <AgregarLoteModal
        open={modalAgregarLote.open}
        onClose={() => setModalAgregarLote({ open: false })}
        farmaco={modalAgregarLote.data}
        proveedores={proveedores}
        onAgregar={async (form) => {
          if (!modalAgregarLote.data?.id) return;
          
          try {
            // Validaciones adicionales en el lado del servidor
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const vencimientoDate = new Date(form.fechaVencimiento)
            vencimientoDate.setHours(0, 0, 0, 0)
            const fabricacionDate = new Date(form.fechaFabricacion)
            fabricacionDate.setHours(0, 0, 0, 0)

            if (vencimientoDate < today) {
              alert("La fecha de vencimiento no puede ser anterior a la fecha actual.")
              return
            }

            if (vencimientoDate <= fabricacionDate) {
              alert("La fecha de vencimiento debe ser posterior a la fecha de fabricación.")
              return
            }

            const { data: nuevoLote, error: loteError } = await supabase.from("lote").insert([
              {
                num_lote: form.lote,
                fec_fabri: form.fechaFabricacion,
                fec_venci: form.fechaVencimiento,
                cantidad: Number(form.cantidad),
                precio: Number(form.precio) || 0,
                farmaco_id_farmaco: modalAgregarLote.data.id,
                id_proveedor: form.id_proveedor,
              },
            ]).select().single();

            if (loteError) {
              console.error("Error al crear lote:", loteError);
              alert("Error al crear el lote: " + loteError.message);
              return;
            }

            if (nuevoLote) {
              const ingresoResult = await supabase.from("historial_ajuste").insert([
                {
                  tipo_ajuste: "Entrada",
                  cant_ajuste: Number(form.cantidad),
                  cant_ant: 0,
                  cant_nueva: Number(form.cantidad),
                  motivo: "Registro",
                  fec_ajuste: getFechaLocal(),
                  lote_id_lote: nuevoLote.id_lote,
                },
              ]).select();

              if (ingresoResult.data && ingresoResult.data[0]) {
                guardarTimestampActividad(ingresoResult.data[0].id_ajuste, "Ingreso");
              }
            }

            setModalAgregarLote({ open: false });
            const { data: lotesData } = await supabase
              .from("lote")
              .select(
                "id_lote, num_lote, fec_fabri, fec_venci, cantidad, precio, farmaco_id_farmaco, id_proveedor"
              );
            setLotes(lotesData || []);
          } catch (error) {
            console.error("Error inesperado:", error);
            alert("Error inesperado al crear el lote.");
          }
        }}
      />
    </div>
  )
}