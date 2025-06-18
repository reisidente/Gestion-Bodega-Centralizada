import { useEffect, useState } from "react"
import { Eye, Plus } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { DetalleSolicitudModal } from "../../components/modals/detalle_solicitud"
import { OrdenDespachoModal } from "../../components/modals/orden_despacho"
import { OrdenCompraModal } from "../../components/modals/orden_compra"
import { supabase } from "../../libs/supabase"

export default function Solicitudes() {
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [search, setSearch] = useState("")
  const [modalDetalle, setModalDetalle] = useState<{ open: boolean; data?: any }>({ open: false })
  const [modalOrdenDespacho, setModalOrdenDespacho] = useState(false)
  const [modalOrdenCompra, setModalOrdenCompra] = useState(false)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [detalleSolicitudes, setDetalleSolicitudes] = useState<any[]>([])

  useEffect(() => {
    const fetchSolicitudes = async () => {
      // Traer solicitudes y detalles relacionados
      const { data: solicitudesData } = await supabase.from("solicitud").select("*, farmacia: farmacia_id_farmacia (nom_farma)")
      // JOIN para traer el nombre del fármaco en cada detalle
      const { data: detallesData } = await supabase
        .from("detalle_solicitud")
        .select("*, farmaco: id_farmaco (nombre)")
      setSolicitudes(solicitudesData || [])
      setDetalleSolicitudes(detallesData || [])
    }
    fetchSolicitudes()
  }, [])

  // Unir solicitudes con sus detalles y fármacos
  const requestsData = solicitudes.map(sol => {
    const detalles = detalleSolicitudes.filter(d => d.solicitud_id_sol === sol.id_sol)
    return {
      id: sol.cod_sol, // Usar cod_sol como identificador principal
      cod_sol: sol.cod_sol,
      id_sol: sol.id_sol, // Solo si necesitas el id interno para joins
      farmacia: sol.farmacia?.nom_farma || "",
      farmacia_id_farmacia: sol.farmacia?.id_farmacia || sol.farmacia_id_farmacia || "",
      fechaCreacion: sol.fec_creacion,
      estado: sol.estado,
      prioridad: sol.prioridad,
      cantidad: sol.cant_sol,
      farmacos: detalles.map(d => ({
        id_detalle: d.id_detalle,
        farmaco: d.farmaco?.nombre || "-",
        cantidadSolicitada: d.cant_despacho,
        cantidadAprobada: null,
        estado: d.estado_fmc,
      }))
    }
  })

  const categories = [
    "Todas",
    ...Array.from(new Set(solicitudes.map(s => s.estado)))
  ]

  const filteredData = requestsData.filter(
    (item) =>
      (selectedCategory === "Todas" || item.estado === selectedCategory) &&
      (item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.farmacia.toLowerCase().includes(search.toLowerCase()))
  )

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "Alta":
        return "destructive"
      case "Media":
        return "warning"
      case "Baja":
        return "secondary"
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Aprobada":
        return "success"
      case "Pendiente":
        return "destructive"
      case "Completada":
        return "warning"
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-gray-500 text-lg mt-1">Gestión de solicitudes de farmacia</p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalOrdenDespacho(true)}
          >
            <Plus className="h-5 w-5" />
            Nueva Solicitud
          </Button>
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalOrdenCompra(true)}
          >
            <Plus className="h-5 w-5" />
            Nueva Orden
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex flex-1 gap-1 flex-wrap">
          {categories.map((filter) => (
            <Button
              key={filter}
              variant={selectedCategory === filter ? "default" : "ghost"}
              className={`rounded-md px-4 py-2 text-base font-medium ${
                selectedCategory === filter ? "" : "text-gray-700"
              }`}
              onClick={() => setSelectedCategory(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
        <div className="flex-1 flex justify-end">
          <input
            type="text"
            placeholder="Buscar solicitud o farmacia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-md px-4 py-2 text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>
      </div>

      <TableContainer
        columns={[
          { header: "ID", render: item => <span className="font-medium text-gray-900">{item.id}</span> },
          { header: "Farmacia", render: item => item.farmacia },
          { header: "Fecha", render: item => item.fechaCreacion },
          {
            header: "Prioridad",
            render: item => (
              <Badge variant={getPriorityColor(item.prioridad)} className="text-xs">
                {item.prioridad}
              </Badge>
            ),
          },
          {
            header: "Estado",
            render: item => (
              <Badge variant={getStatusColor(item.estado)} className="text-xs">
                {item.estado}
              </Badge>
            ),
          },
          {
            header: "Acciones",
            render: item => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => setModalDetalle({ open: true, data: item })}
                aria-label="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
        data={filteredData}
      />

      <DetalleSolicitudModal
        open={modalDetalle.open}
        onClose={() => setModalDetalle({ open: false })}
        solicitud={modalDetalle.data || {
          id: "",
          farmacia: "",
          fechaCreacion: "",
          estado: "",
          prioridad: "",
          farmacos: [],
        }}
        onSave={solicitudActualizada => {
          setModalDetalle({ open: false })
        }}
      />

      <OrdenDespachoModal
        open={modalOrdenDespacho}
        onClose={() => setModalOrdenDespacho(false)}
        onCrear={async (form) => {
          // Insertar solicitud en Supabase con los datos correctos
          const { medicamentos, ...solicitudPayload } = form;
          const { data: nuevaSolicitud, error } = await supabase.from("solicitud").insert([
            solicitudPayload
          ]).select().single();
          if (error || !nuevaSolicitud) {
            alert("Error al crear solicitud");
            return;
          }
          // Insertar detalles de solicitud en detalle_solicitud
          if (medicamentos && medicamentos.length > 0) {
            const detalles = medicamentos.map((med: any) => ({
              solicitud_id_sol: nuevaSolicitud.id_sol,
              cant_despacho: med.cantidad, // cantidad solicitada
              estado_fmc: 'Pendiente',
              fec_despacho: null, // Se actualizará al despachar
            }));
            await supabase.from("detalle_solicitud").insert(detalles);
          }
          setModalOrdenDespacho(false);
          // Refrescar solicitudes
          const { data: solicitudesData } = await supabase.from("solicitud").select("*, farmacia: farmacia_id_farmacia (nom_farma)");
          const { data: detallesData } = await supabase.from("detalle_solicitud").select("*");
          setSolicitudes(solicitudesData || []);
          setDetalleSolicitudes(detallesData || []);
        }}
      />

      <OrdenCompraModal
        open={modalOrdenCompra}
        onClose={() => setModalOrdenCompra(false)}
        onEnviar={async (form) => {
          // Insertar solicitud de compra en Supabase con los datos correctos
          const { medicamentos, ...solicitudPayload } = form;
          const { data: nuevaSolicitud, error } = await supabase.from("solicitud").insert([
            solicitudPayload
          ]).select().single();
          if (error || !nuevaSolicitud) {
            alert("Error al crear solicitud de compra");
            return;
          }
          // Insertar detalles de solicitud en detalle_solicitud
          if (medicamentos && medicamentos.length > 0) {
            const detalles = medicamentos.map((med: any) => ({
              solicitud_id_sol: nuevaSolicitud.id_sol,
              cant_despacho: med.cantidad, // cantidad solicitada
              estado_fmc: 'Pendiente',
              fec_despacho: null, // Se actualizará al despachar
            }));
            await supabase.from("detalle_solicitud").insert(detalles);
          }
          setModalOrdenCompra(false);
          // Refrescar solicitudes
          const { data: solicitudesData } = await supabase.from("solicitud").select("*, farmacia: farmacia_id_farmacia (nom_farma)");
          const { data: detallesData } = await supabase.from("detalle_solicitud").select("*");
          setSolicitudes(solicitudesData || []);
          setDetalleSolicitudes(detallesData || []);
        }}
      />
    </div>
  )
}