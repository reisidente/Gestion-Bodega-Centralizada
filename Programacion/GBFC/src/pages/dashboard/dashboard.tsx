import { useState } from "react"
import { motion } from "framer-motion"
import { Sidebar } from "../../components/layaut/sliderbar"
import { SmoothBackground } from "../../components/animations/smooth-bachground"
import { MetricsCards } from "../../components/dashboard/metrics-cards"
import { RecentActivity } from "../../components/dashboard/recent-activity"
import { InventoryTable } from "../../components/dashboard/iventory-table"
import { RequestsTable } from "../../components/dashboard/requests-table"

export default function Component() {
  const [activeSection, setActiveSection] = useState("home")

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div className="space-y-6">
            <MetricsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <InventoryTable />
              </div>
              <div>
                <RecentActivity />
              </div>
            </div>
          </div>
        )
      case "inventario":
        return <InventoryTable />
      case "solicitudes":
        return <RequestsTable />
      case "alertas":
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Alertas</h2>
            <p className="text-gray-600">Sección en desarrollo</p>
          </div>
        )
      case "reportes":
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Reportes</h2>
            <p className="text-gray-600">Sección en desarrollo</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <SmoothBackground />

      <div className="min-h-screen">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <main className="ml-64 transition-all duration-300">
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {activeSection === "home" && "Dashboard"}
                {activeSection === "inventario" && "Gestión de Inventario"}
                {activeSection === "solicitudes" && "Gestión de Solicitudes"}
                {activeSection === "alertas" && "Centro de Alertas"}
                {activeSection === "reportes" && "Reportes y Análisis"}
              </h1>
              <p className="text-gray-600">
                {activeSection === "home" && "Resumen general del sistema farmacéutico"}
                {activeSection === "inventario" && "Control y seguimiento de medicamentos"}
                {activeSection === "solicitudes" && "Administración de pedidos y despachos"}
                {activeSection === "alertas" && "Monitoreo de vencimientos y stock"}
                {activeSection === "reportes" && "Análisis y estadísticas del sistema"}
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {renderContent()}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </>
  )
}
