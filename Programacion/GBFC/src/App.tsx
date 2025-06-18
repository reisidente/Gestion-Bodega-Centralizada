import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './pages/logins/login'
import Dashboard from './pages/dashboard/dashboard'
import Inventario from './pages/inventario/inventario'
import Solicitudes from './pages/solicitudes/solicitudes'
import Alertas from './pages/alertas/alertas'
import Reportes from './pages/reportes/reportes'
import { Sidebar } from './components/loyout/sliderbar'
import NuevoUsuario from './pages/logins/nuevo-usuario'


<Route path="/" element={<Login />} />

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <Sidebar activeSection="home">
              <Dashboard />
            </Sidebar>
          }
        />
        <Route
          path="/inventario"
          element={
            <Sidebar activeSection="inventario">
              <Inventario />
            </Sidebar>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <Sidebar activeSection="solicitudes">
              <Solicitudes />
            </Sidebar>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <Sidebar activeSection="solicitudes">
              <Solicitudes />
            </Sidebar>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <Sidebar activeSection="solicitudes">
              <Solicitudes />
            </Sidebar>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <Sidebar activeSection="solicitudes">
              <Solicitudes />
            </Sidebar>
          }
        />
        <Route
          path="/alertas"
          element={
            <Sidebar activeSection="alertas">
              <Alertas />
            </Sidebar>
          }
        />
        <Route
          path="/reportes"
          element={
            <Sidebar activeSection="reportes">
              <Reportes />
            </Sidebar>
          }
        />
        <Route
          path="/nuevo-usuario"
          element={
            <Sidebar activeSection="usuarios">
              <NuevoUsuario />
            </Sidebar>
          }
        />
      </Routes>
    </Router>
  )
}

export default App