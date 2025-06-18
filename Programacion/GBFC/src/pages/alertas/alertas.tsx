import { useEffect, useState } from "react"
import { Filter, Download, Settings } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { TableContainer } from "../../components/ui/table"
import { ConfigAlertasModal } from "../../components/modals/configurar_alertas"
import { supabase } from "../../libs/supabase"

export default function Alertas() {
  const [SelectedCategory, setSelectedCategory] = useState("Todas")
  const [search, setSearch] = useState("")
  const [modalConfig, setModalConfig] = useState(false)
  const [alertas, setAlertas] = useState<any[]>([])

  useEffect(() => {
    const fetchAlertas = async () => {
      const { data: alertasData } = await supabase
        .from("alerta")
        .select(
          "*, farmaco: farmaco_id_farmaco (nombre), id_alerta, tipo_alerta, nivel, mensaje, fec_creacion, fec_vencimiento, cant_actual"
        )
      setAlertas(alertasData || [])
    }
    fetchAlertas()
  }, [])

  const categories = [
    "Todas",
    ...Array.from(new Set(alertas.map((a) => a.tipo_alerta))),
  ]

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "Alto":
        return "destructive"
      case "Medio":
        return "warning"
      case "Bajo":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Próximo a vencer":
        return "warning"
      case "Stock bajo":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const filteredData = alertas
    .filter(
      (item) =>
        (SelectedCategory === "Todas" ||
          item.tipo_alerta === SelectedCategory) &&
        (item.farmaco?.nombre
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          (item.lote || "").toLowerCase().includes(search.toLowerCase()))
    )
    .map((item) => ({
      farmaco: item.farmaco?.nombre || "",
      lote: item.lote || "",
      tipo: item.tipo_alerta,
      nivel: item.nivel,
      estado:
        item.nivel === "Alto"
          ? "Próximo a vencer"
          : item.nivel === "Medio"
          ? "Stock bajo"
          : "Normal",
    }))

  return (
    <div className="w-full max-w-7xl mx-auto px-2 py-6">
      {/* Título y acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-500 text-lg mt-1">
            Gestión y monitoreo de alertas de fármacos
          </p>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2 font-medium">
            <Download className="h-5 w-5" />
            Exportar
          </Button>
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalConfig(true)}
          >
            <Settings className="h-5 w-5" />
            Configurar alertas
          </Button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <div className="flex flex-1 gap-1 flex-wrap">
          {categories.map((filtro) => (
            <Button
              key={filtro}
              variant={SelectedCategory === filtro ? "default" : "ghost"}
              className={`rounded-md px-4 py-2 text-base font-medium ${
                SelectedCategory === filtro ? "" : "text-gray-700"
              }`}
              onClick={() => setSelectedCategory(filtro)}
            >
              {filtro}
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
            placeholder="Buscar fármaco o lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md px-4 py-2 text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>
      </div>

      {/* Tabla */}
      <TableContainer
        columns={[
          {
            header: "Fármaco",
            render: (item) => (
              <span className="font-medium text-gray-900">{item.farmaco}</span>
            ),
          },
          { header: "Lote", render: (item) => item.lote },
          { header: "Tipo", render: (item) => item.tipo },
          {
            header: "Nivel",
            render: (item) => (
              <Badge variant={getNivelColor(item.nivel)} className="text-xs">
                {item.nivel}
              </Badge>
            ),
          },
          {
            header: "Estado",
            render: (item) => (
              <Badge variant={getEstadoColor(item.estado)} className="text-xs">
                {item.estado}
              </Badge>
            ),
          },
        ]}
        data={filteredData}
      />

      <ConfigAlertasModal
        open={modalConfig}
        onClose={() => setModalConfig(false)}
        onSave={() => setModalConfig(false)}
      />
    </div>
  )
}