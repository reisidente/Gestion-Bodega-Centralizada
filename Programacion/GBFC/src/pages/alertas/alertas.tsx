import { useState } from "react"
import { Filter, Download, Settings } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"

const alertasData = [
  {
    farmaco: "Paracetamol",
    lote: "PAR001",
    tipo: "Vencimiento",
    nivel: "Alto",
    estado: "Próximo a vencer",
  },
  {
    farmaco: "Amoxicilina",
    lote: "AMX002",
    tipo: "Stock bajo",
    nivel: "Medio",
    estado: "Stock bajo",
  },
  {
    farmaco: "Ibuprofeno",
    lote: "IBU003",
    tipo: "Vencimiento",
    nivel: "Alto",
    estado: "Próximo a vencer",
  },
]

const filtros = ["Vencimiento", "Stock bajo", "Todas"]

export default function Alertas() {
  const [filtroActivo, setFiltroActivo] = useState("Vencimiento")

  return (
    <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm m-8">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {filtros.map((filtro) => (
              <Button
                key={filtro}
                variant={filtroActivo === filtro ? "default" : "outline"}
                onClick={() => setFiltroActivo(filtro)}
                className="h-8"
              >
                {filtro}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurar alertas
            </Button>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <Button variant="outline" size="sm" className="mr-2">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Fármaco</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Lote</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nivel</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {alertasData.map((item, idx) => (
                <tr
                  key={item.lote}
                  className={idx % 2 === 1 ? "bg-gray-100/50" : ""}
                >
                  <td className="py-3 px-4">{item.farmaco}</td>
                  <td className="py-3 px-4">{item.lote}</td>
                  <td className="py-3 px-4">{item.tipo}</td>
                  <td className="py-3 px-4">{item.nivel}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}