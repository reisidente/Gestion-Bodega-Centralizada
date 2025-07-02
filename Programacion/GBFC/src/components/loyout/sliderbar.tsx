import type { ReactNode } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Package, FileText, AlertTriangle, BarChart3, Plus, Menu, X, LogOut, Truck } from "lucide-react"
import { Button } from "../ui/button"
import { useIsAdmin } from "../../hooks/useIsAdmin"
import { supabase } from "../../libs/supabase"

interface SidebarProps {
  activeSection: string
  children?: ReactNode
}

const menuItems = [
  { id: "home", label: "Home", icon: Home, path: "/dashboard" },
  { id: "inventario", label: "Inventario", icon: Package, path: "/inventario" },
  { id: "solicitudes", label: "Solicitudes", icon: FileText, path: "/solicitudes" },
  { id: "alertas", label: "Alertas", icon: AlertTriangle, path: "/alertas" },
  { id: "reportes", label: "Reportes", icon: BarChart3, path: "/reportes" },
  { id: "proveedores", label: "Proveedores", icon: Truck, path: "/proveedor" },
]

export function Sidebar({ activeSection, children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const { isAdmin, user } = useIsAdmin()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  return (
    <div className="min-h-screen flex">
      <motion.div
        className={`fixed left-0 top-0 h-full bg-white/80 backdrop-blur-md border-r border-gray-200/50 z-40 flex flex-col justify-between transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <div className="p-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">GBFC</span>
                </motion.div>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8">
                {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <nav className="p-2">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 mb-1 ${
                  activeSection === item.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </motion.button>
            ))}
            {isAdmin && (
              <motion.button
                onClick={() => navigate("/nuevo-usuario")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 mb-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">Nuevo Usuario</span>}
              </motion.button>
            )}
          </nav>
        </div>

        <div className="p-2 border-t border-gray-200/50">
          {user && (
            <>
              {!isCollapsed ? (
                <motion.div
                  className="px-3 py-2 mb-2 bg-gray-50/50 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.nom_usuario} {user.ape_usuario}
                  </div>
                  {isAdmin && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 inline-block">
                      Administrador
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center mb-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  title={`${user.nom_usuario} ${user.ape_usuario}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isAdmin ? 'bg-blue-600' : 'bg-gray-600'
                  }`}>
                    <span className="text-white text-xs font-medium">
                      {user.nom_usuario?.[0]?.toUpperCase()}{user.ape_usuario?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              )}
            </>
          )}
          
          <motion.button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 text-gray-600 hover:bg-red-100 hover:text-red-600`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </motion.button>
        </div>
      </motion.div>
      <main className="flex-1 ml-16 md:ml-64 transition-all duration-300">{children}</main>
    </div>
  )
}