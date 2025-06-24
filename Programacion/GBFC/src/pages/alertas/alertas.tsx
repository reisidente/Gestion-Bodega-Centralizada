import { useEffect, useState, useCallback } from "react"
import { Settings } from "lucide-react"
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
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem("configAlertas")
    return savedConfig
      ? JSON.parse(savedConfig)
      : {
          diasVencimiento: 30,
          cantidadMinimaStock: 50,
        }
  })

  const fetchAlertas = useCallback(async () => {
    setLoading(true)
    const { data: alertasData, error } = await supabase
      .from("alerta")
      .select("*, farmaco: farmaco_id_farmaco (id_farmaco, nombre)")

    if (error) {
      console.error("Error fetching alerts:", error)
      setAlertas([])
    } else {
      console.log("Alertas recibidas de la base de datos:", alertasData)
      setAlertas(alertasData || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlertas()
  }, [fetchAlertas])

  const handleSaveConfig = async (newConfig: {
    diasVencimiento: number
    cantidadMinimaStock: number
  }) => {
    localStorage.setItem("configAlertas", JSON.stringify(newConfig))
    setConfig(newConfig)
    setModalConfig(false)
    setLoading(true)

    // 1. Delete all existing alerts
    const { error: deleteError } = await supabase
      .from("alerta")
      .delete()
      .gt("id_alerta", 0)
    if (deleteError) {
      console.error("Error deleting old alerts:", deleteError)
      setLoading(false)
      return
    }

    // 2. Fetch farmacos and lotes
    const { data: farmacosData, error: farmacosError } = await supabase
      .from("farmaco")
      .select("id_farmaco, nombre")

    if (farmacosError) {
      console.error("Error fetching farmacos:", farmacosError)
      setLoading(false)
      return
    }

    const { data: lotesData, error: lotesError } = await supabase
      .from("lote")
      .select(
        "id_lote, farmaco_id_farmaco, num_lote, cantidad, fec_venci"
      )

    if (lotesError) {
      console.error("Error fetching lotes:", lotesError)
      setLoading(false)
      return
    }

    const farmacoStock = new Map<number, number>()
    if (lotesData) {
      lotesData.forEach((lote) => {
        farmacoStock.set(
          lote.farmaco_id_farmaco,
          (farmacoStock.get(lote.farmaco_id_farmaco) || 0) + lote.cantidad
        )
      })
    }

    const generatedAlertsToInsert: any[] = []
    const stockAlertSet = new Set<string>()
    const vencAlertSet = new Set<string>()

    // 3. Generate stock alerts
    if (farmacosData) {
      farmacosData.forEach((farmaco) => {
        const stockActual = farmacoStock.get(farmaco.id_farmaco) || 0
        const stockKey = `${farmaco.id_farmaco}`
        if (
          stockActual > 0 &&
          stockActual <= newConfig.cantidadMinimaStock &&
          !stockAlertSet.has(stockKey)
        ) {
          stockAlertSet.add(stockKey)
          generatedAlertsToInsert.push({
            tipo_alerta: "Stock",
            nivel: "Medio",
            mensaje: `Stock bajo para ${farmaco.nombre}. Cantidad actual: ${stockActual}, Mínimo configurado: ${newConfig.cantidadMinimaStock}`,
            fec_creacion: new Date().toISOString().slice(0, 10),
            fec_vencimiento: "9999-12-31",
            cant_actual: stockActual,
            farmaco_id_farmaco: farmaco.id_farmaco,
          })
        }
      })
    }

    // 4. Generate expiration alerts
    const today = new Date()
    const limitDate = new Date()
    limitDate.setDate(today.getDate() + newConfig.diasVencimiento)

    if (lotesData) {
      lotesData.forEach((lote) => {
        const vencimiento = new Date(lote.fec_venci)
        const vencKey = `${lote.farmaco_id_farmaco}_${lote.num_lote}_${lote.fec_venci}`
        if (
          vencimiento <= limitDate &&
          vencimiento >= today &&
          !vencAlertSet.has(vencKey)
        ) {
          vencAlertSet.add(vencKey)
          const farmaco = farmacosData?.find(
            (f) => f.id_farmaco === lote.farmaco_id_farmaco
          )
          if (farmaco) {
            generatedAlertsToInsert.push({
              tipo_alerta: "Vencimiento",
              nivel: "Alto",
              mensaje: `El lote ${lote.num_lote} de ${farmaco.nombre} está próximo a vencer.`,
              fec_creacion: new Date().toISOString().slice(0, 10),
              fec_vencimiento: lote.fec_venci,
              cant_actual: lote.cantidad,
              farmaco_id_farmaco: farmaco.id_farmaco,
            })
          }
        }
      })
    }

    // 5. Insert new alerts into DB
    if (generatedAlertsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("alerta")
        .insert(generatedAlertsToInsert)
      if (insertError) {
        console.error("Error inserting new alerts:", insertError)
      }
    }

    // 6. Fetch new alerts to update UI
    await fetchAlertas()
    setLoading(false)
  }

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
    .map((item) => {
      let lote = "-"
      if (item.tipo_alerta === "Vencimiento") {
        const match = item.mensaje.match(/lote (\S+)/)
        if (match) {
          lote = match[1]
        }
      }
      return {
        farmaco: item.farmaco?.nombre || "",
        lote,
        tipo: item.tipo_alerta,
        nivel: item.nivel,
        estado:
          item.tipo_alerta === "Vencimiento" ? "Próximo a vencer" : "Stock bajo",
        mensaje: item.mensaje,
        vencimiento:
          item.fec_vencimiento === "9999-12-31"
            ? "N/A"
            : new Date(item.fec_vencimiento).toLocaleDateString(),
        cantidad: item.cant_actual,
      }
    })
    .filter(
      (item) =>
        (SelectedCategory === "Todas" || item.tipo === SelectedCategory) &&
        (item.farmaco?.toLowerCase().includes(search.toLowerCase()) ||
          (item.lote || "").toLowerCase().includes(search.toLowerCase()))
    )

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
          <Button
            className="flex items-center gap-2 font-medium bg-black hover:bg-gray-900 text-white"
            onClick={() => setModalConfig(true)}
            disabled={loading}
          >
            {loading ? (
              "Generando..."
            ) : (
              <>
                <Settings className="h-5 w-5" />
                Configurar alertas
              </>
            )}
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
      {loading ? (
        <p>Cargando alertas...</p>
      ) : (
        <TableContainer
          columns={[
            {
              header: "Fármaco",
              render: (item) => (
                <span className="font-medium text-gray-900">{item.farmaco}</span>
              ),
              sortKey: "farmaco"
            },
            { header: "Lote", render: (item) => item.lote, sortKey: "lote" },
            { header: "Tipo", render: (item) => item.tipo, sortKey: "tipo" },
            {
              header: "Nivel",
              render: (item) => (
                <Badge variant={getNivelColor(item.nivel)} className="text-xs">
                  {item.nivel}
                </Badge>
              ),
              sortKey: "nivel"
            },
            {
              header: "Estado",
              render: (item) => (
                <Badge variant={getEstadoColor(item.estado)} className="text-xs">
                  {item.estado}
                </Badge>
              ),
              sortKey: "estado"
            },
            {
              header: "Mensaje",
              render: (item) => (
                <p className="text-sm text-gray-600">{item.mensaje}</p>
              ),
              sortKey: "mensaje"
            },
            { header: "Vencimiento", render: (item) => item.vencimiento, sortKey: "vencimiento" },
            { header: "Cant. Actual", render: (item) => item.cantidad, sortKey: "cantidad" },
          ]}
          data={filteredData}
        />
      )}

      <ConfigAlertasModal
        open={modalConfig}
        onClose={() => setModalConfig(false)}
        onSave={handleSaveConfig}
        initialConfig={config}
      />
    </div>
  )
}