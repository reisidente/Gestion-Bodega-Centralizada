"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Edit, Settings, Plus, Filter, History, Download } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

const inventoryData = [
  {
    id: 1,
    nombre: "Paracetamol",
    lote: "PAR001",
    categoria: "Analgésicos",
    stock: 150,
    vencimiento: "2024-12-15",
    estado: "Disponible",
  },
  {
    id: 2,
    nombre: "Amoxicilina",
    lote: "AMX002",
    categoria: "Antibióticos",
    stock: 75,
    vencimiento: "2024-08-20",
    estado: "Stock Bajo",
  },
  {
    id: 3,
    nombre: "Ibuprofeno",
    lote: "IBU003",
    categoria: "Analgésicos",
    stock: 200,
    vencimiento: "2024-06-10",
    estado: "Próximo a vencer",
  },
]

const categories = ["Todos", "Antibióticos", "Analgésicos"]

export function InventoryTable() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Disponible":
        return "success"
      case "Stock Bajo":
        return "warning"
      case "Próximo a vencer":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Inventario</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Fármaco
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtros:</span>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="h-8"
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Historial
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Lote</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vencimiento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{item.nombre}</td>
                    <td className="py-3 px-4 text-gray-600">{item.lote}</td>
                    <td className="py-3 px-4 text-gray-600">{item.categoria}</td>
                    <td className="py-3 px-4 text-gray-600">{item.stock}</td>
                    <td className="py-3 px-4 text-gray-600">{item.vencimiento}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(item.estado)} className="text-xs">
                        {item.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
