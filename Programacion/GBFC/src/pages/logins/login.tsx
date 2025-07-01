import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { FormField } from "../../components/ui/form/form-field"
import { SmoothBackground } from "../../components/animations/smooth-bachground"
import { LoadingSpinner } from "../../components/animations/loading-spinner"
import { validateRUT, formatRUT, parseRUT } from "../../utils/rut-validor"
import { supabase } from "../../libs/supabase"

export default function Component() {
  const [rut, setRut] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ rut?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleRutChange = (value: string) => {
    const formatted = formatRUT(value)
    setRut(formatted)
    if (errors.rut) {
      setErrors((prev) => ({ ...prev, rut: undefined }))
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { rut?: string; password?: string } = {}

    if (!rut) {
      newErrors.rut = "RUT requerido"
    } else if (!validateRUT(rut)) {
      newErrors.rut = "RUT inválido"
    }

    if (!password) {
      newErrors.password = "Contraseña requerida"
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      // --- INICIO FLUJO VALIDACIÓN EN SUPABASE ---
      const parsed = parseRUT(rut)
      if (!parsed) {
        setErrors({ rut: "RUT inválido" })
        setIsLoading(false)
        return
      }
      // Buscar usuario por rut, dv y contraseña
      console.log("Login params:", parsed.rut, parsed.dv, password);
      const { data: usuario, error } = await supabase
        .from('usuario')
        .select('uid, email, activo')
        .eq('rut', parsed.rut)
        .eq('d_verificador', parsed.dv)
        .eq('contraseña', password) // ¡En producción usa hash!
        .eq('activo', true) // Solo usuarios activos
        .single()
      
      console.log("Login result:", usuario, error);
      if (error || !usuario) {
        setErrors({ rut: "RUT o contraseña incorrectos. Si el problema persiste, contacte al administrador." })
        setIsLoading(false)
        return
      }
      if (!usuario.uid) {
        setErrors({ rut: "El usuario no está asociado a un UID válido. Contacte al administrador." })
        setIsLoading(false)
        return
      }
      
      // Autenticación exitosa - establecer sesión local y en Supabase
      console.log("Login exitoso para usuario:", usuario.email)
      
      // Intentar establecer sesión en Supabase Auth también
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: usuario.email,
          password,
        })
        if (authError) {
          console.warn("No se pudo establecer sesión en Supabase Auth:", authError.message)
          // Continuar con sesión local si falla Supabase Auth
        }
      } catch (authError) {
        console.warn("Error al intentar sesión en Supabase Auth:", authError)
      }
      
      // Guardar información del usuario en localStorage como respaldo
      localStorage.setItem('userSession', JSON.stringify({
        uid: usuario.uid,
        email: usuario.email,
        authenticated: true,
        loginTime: new Date().toISOString()
      }))
      
      setIsLoading(false)
      navigate("/dashboard")
      // --- FIN FLUJO VALIDACIÓN EN SUPABASE ---
    }
  }

  return (
    <>
      <SmoothBackground />

      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-md">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="mx-auto mb-4 w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center"
              >
                <Plus className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h1 className="text-xl font-semibold text-gray-900 mb-1">G B F C</h1>
                <p className="text-sm text-gray-500">Acceso seguro al sistema</p>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  label="RUT"
                  placeholder="12.345.678-9"
                  value={rut}
                  onChange={handleRutChange}
                  error={errors.rut}
                />

                <FormField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  error={errors.password}
                  showPasswordToggle
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner /> : "Iniciar Sesión"}
                  </Button>
                </motion.div>
              </form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-center pt-2"
              >
              </motion.div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-400">Sistema Hospitalario © 2024</p>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
