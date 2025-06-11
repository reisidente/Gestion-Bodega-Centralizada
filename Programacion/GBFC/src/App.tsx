import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './pages/logins/login'
import Dashboard from './pages/dashboard/dashboard'
import Inventario from './pages/inventario/inventario'
import Solicitudes from './pages/solicitudes/solicitudes'
import { Sidebar } from './components/loyout/sliderbar'



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
      </Routes>
    </Router>
  )
}

export default App