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
      const { data: solicitudesData, error: solError } = await supabase
        .from("solicitud")
        .select("*, motivo, farmacia: farmacia_id_farmacia (nom_farma)")
      if (solError) console.error("Error fetching solicitudes:", solError)

      const { data: detallesData, error: detError } = await supabase
        .from("detalle_solicitud")
        .select("*, farmaco: id_farmaco (nombre)")
      if (detError) console.error("Error fetching detalles:", detError)

      setSolicitudes(solicitudesData || [])
      setDetalleSolicitudes(detallesData || [])
    }
    fetchSolicitudes()
  }, [])

  // Unir solicitudes con sus detalles y fármacos
  const requestsData = solicitudes.map(sol => {
    const detalles = detalleSolicitudes.filter(d => d.solicitud_id_sol === sol.id_sol)
    let fechaDespacho = null
    if (sol.estado === 'Completada' && detalles.length > 0) {
      const detalleConFecha = detalles.find(d => d.fec_despacho)
      if (detalleConFecha) {
        fechaDespacho = detalleConFecha.fec_despacho
      }
    }

    let farmacosData

    if (sol.estado === 'Completada') {
      const farmacosAgrupados = detalles.reduce((acc, d) => {
        if (d.estado_fmc === 'Despachado') {
          if (!acc[d.id_farmaco]) {
            acc[d.id_farmaco] = {
              id_detalle: d.id_detalle,
              id_farmaco: d.id_farmaco,
              farmaco: d.farmaco?.nombre || "-",
              cantidadSolicitada: 0,
              cantidadAprobada: null,
              estado: "Despachado",
            }
          }
          acc[d.id_farmaco].cantidadSolicitada += d.cant_despacho
        }
        return acc
      }, {} as Record<string, any>)

      farmacosData = Object.values(farmacosAgrupados)
    } else {
      farmacosData = detalles.map(d => ({
        id_detalle: d.id_detalle,
        id_farmaco: d.id_farmaco,
        farmaco: d.farmaco?.nombre || "-",
        cantidadSolicitada: d.cant_despacho,
        cantidadAprobada: null,
        estado: d.estado_fmc,
      }))
    }

    return {
      id: sol.cod_sol,
      cod_sol: sol.cod_sol,
      id_sol: sol.id_sol,
      farmacia: sol.farmacia?.nom_farma || "",
      farmacia_id_farmacia: sol.farmacia?.id_farmacia || sol.farmacia_id_farmacia || "",
      fechaCreacion: sol.fec_creacion,
      fechaDespacho,
      estado: sol.estado,
      prioridad: sol.prioridad,
      motivo: sol.motivo,
      cantidad: sol.cant_sol,
      farmacos: farmacosData,
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
      case "Pendiente":
        return "destructive"
      case "Completada":
        return "success"
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
          { header: "ID", render: item => <span className="font-medium text-gray-900">{item.id}</span>, sortKey: "id" },
          { header: "Farmacia", render: item => item.farmacia, sortKey: "farmacia" },
          { header: "Fecha Creación", render: item => item.fechaCreacion, sortKey: "fechaCreacion" },
          { header: "Fecha Despacho", render: item => item.fechaDespacho || '-', sortKey: "fechaDespacho" },
          {
            header: "Prioridad",
            render: item => (
              <Badge variant={getPriorityColor(item.prioridad)} className="text-xs">
                {item.prioridad}
              </Badge>
            ),
            sortKey: "prioridad"
          },
          {
            header: "Estado",
            render: item => (
              <Badge variant={getStatusColor(item.estado)} className="text-xs">
                {item.estado}
              </Badge>
            ),
            sortKey: "estado"
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
        onSave={async () => {
          setModalDetalle({ open: false });

          // Refrescar la data para ver los cambios en tiempo real
          const { data: solicitudesData } = await supabase.from("solicitud").select("*, motivo, farmacia: farmacia_id_farmacia (nom_farma)");
          const { data: detallesData } = await supabase.from("detalle_solicitud").select("*, farmaco: id_farmaco (nombre)");

          setSolicitudes(solicitudesData || []);
          setDetalleSolicitudes(detallesData || []);
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
              id_farmaco: med.id_farmaco, // Relación con farmaco
              cant_despacho: med.cantidad, // cantidad solicitada
              estado_fmc: 'Pendiente',
              fec_despacho: null, // Se actualizará al despachar
            }));
            await supabase.from("detalle_solicitud").insert(detalles);
          }
          setModalOrdenDespacho(false);
          // Refrescar solicitudes
          const { data: solicitudesData } = await supabase.from("solicitud").select("*, motivo, farmacia: farmacia_id_farmacia (nom_farma)");
          const { data: detallesData } = await supabase.from("detalle_solicitud").select("*, farmaco: id_farmaco (nombre)");
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
              id_farmaco: med.id_farmaco, // Relación con farmaco
              cant_despacho: med.cantidad, // cantidad solicitada
              estado_fmc: 'Pendiente',
              fec_despacho: null, // Se actualizará al despachar
            }));
            await supabase.from("detalle_solicitud").insert(detalles);
          }
          setModalOrdenCompra(false);
          // Refrescar solicitudes
          const { data: solicitudesData } = await supabase.from("solicitud").select("*, motivo, farmacia: farmacia_id_farmacia (nom_farma)");
          const { data: detallesData } = await supabase.from("detalle_solicitud").select("*, farmaco: id_farmaco (nombre)");
          setSolicitudes(solicitudesData || []);
          setDetalleSolicitudes(detallesData || []);
        }}
      />
    </div>
  )
}