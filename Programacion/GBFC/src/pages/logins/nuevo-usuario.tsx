import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { FormField } from "../../components/ui/form/form-field"
import { Button } from "../../components/ui/button"
import { parseRUT } from "../../utils/rut-validor"
import { supabase } from "../../libs/supabase"
import { useAdminGuard } from "../../hooks/useAdminGuard"
import { getFechaLocal } from "../../libs/utils"

export default function NuevoUsuario() {
  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rolId, setRolId] = useState<number>(2) // Default: usuario normal
  const [farmaciaId, setFarmaciaId] = useState<number | null>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [farmacias, setFarmacias] = useState<any[]>([])
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const { isAdmin, loading } = useAdminGuard()
  
  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar roles
      const { data: rolesData } = await supabase
        .from("rol")
        .select("id_rol, rol")
        .order("rol")
      
      if (rolesData) {
        setRoles(rolesData)
      }

      // Cargar farmacias
      const { data: farmaciasData } = await supabase
        .from("farmacia")
        .select("id_farmacia, nom_farma")
        .order("nom_farma")
      
      if (farmaciasData) {
        setFarmacias(farmaciasData)
      }
    }

    if (!loading && isAdmin) {
      cargarDatos()
    }
  }, [loading, isAdmin])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }
  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">Acceso denegado: solo administradores</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: any = {}
    
    // Validaciones mejoradas
    const parsed = parseRUT(rut)
    if (!rut) newErrors.rut = "RUT requerido"
    else if (!parsed) newErrors.rut = "RUT inválido"
    
    if (!nombre.trim()) newErrors.nombre = "Nombre requerido"
    if (!apellido.trim()) newErrors.apellido = "Apellido requerido"
    
    if (!email.trim()) newErrors.email = "Email requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email inválido"
    
    if (!password) newErrors.password = "Contraseña requerida"
    else if (password.length < 6) newErrors.password = "Contraseña mínima 6 caracteres"
    
    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden"
    
    if (!rolId) newErrors.rol = "Debe seleccionar un rol"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)

    try {
      // Verificar si el RUT ya existe
      const { data: rutExistente } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("rut", parsed!.rut)
        .maybeSingle()

      if (rutExistente) {
        setErrors({ rut: "Ya existe un usuario con este RUT" })
        setIsLoading(false)
        return
      }

      // Verificar si el email ya existe
      const { data: emailExistente } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("email", email)
        .maybeSingle()

      if (emailExistente) {
        setErrors({ email: "Ya existe un usuario con este email" })
        setIsLoading(false)
        return
      }

      // 1. Crear usuario en Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError || !authUser.user) {
        console.error("Error de autenticación:", authError)
        setErrors({ email: "No se pudo registrar el usuario: " + (authError?.message || "Error desconocido") })
        setIsLoading(false)
        return
      }

      const uid = authUser.user.id

      // 2. Insertar en tabla usuario
      const { data: usuarioInsertado, error: dbError } = await supabase.from("usuario").insert([
        {
          rut: parsed!.rut,
          d_verificador: parsed!.dv,
          nom_usuario: nombre.trim(),
          ape_usuario: apellido.trim(),
          email: email.trim(),
          activo: true,
          farmacia_id_farmacia: farmaciaId,
          rol_id_rol: rolId,
          contraseña: password, // En producción usar hash
          uid: uid,
        },
      ]).select('id_usuario').single()

      if (dbError || !usuarioInsertado) {
        console.error("Error de base de datos:", dbError)
        setErrors({ general: "No se pudo registrar el usuario: " + (dbError?.message || "Error desconocido") })
        setIsLoading(false)
        return
      }

      // 3. Crear registro en registro_usuario
      const { error: errorRegistro } = await supabase.from("registro_usuario").insert([
        {
          fecha_mod: getFechaLocal(),
          observacion: "Registro inicial de usuario",
          usuario_id_usuario: usuarioInsertado.id_usuario,
          estado_usuario_id_estado: 1 // Estado activo
        },
      ])

      if (errorRegistro) {
        console.error("Error al crear registro:", errorRegistro)
        setErrors({ general: "Error al crear registro de usuario: " + errorRegistro.message })
        setIsLoading(false)
        return
      }

      // Éxito
      alert("Usuario registrado exitosamente")
      navigate("/dashboard")

    } catch (error) {
      console.error("Error inesperado:", error)
      setErrors({ general: "Error inesperado al registrar usuario" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold">Registro de Nuevo Usuario</h2>
          <p className="text-gray-600">Complete todos los campos requeridos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información Personal */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Información Personal</h3>
              <div className="space-y-3">
                <FormField 
                  label="RUT" 
                  value={rut} 
                  onChange={setRut} 
                  error={errors.rut} 
                  placeholder="12.345.678-9" 
                  required 
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField 
                    label="Nombre" 
                    value={nombre} 
                    onChange={setNombre} 
                    error={errors.nombre} 
                    placeholder="Nombre" 
                    required 
                  />
                  <FormField 
                    label="Apellido" 
                    value={apellido} 
                    onChange={setApellido} 
                    error={errors.apellido} 
                    placeholder="Apellido" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Información de Acceso */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Información de Acceso</h3>
              <div className="space-y-3">
                <FormField 
                  label="Email" 
                  value={email} 
                  onChange={setEmail} 
                  error={errors.email} 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  required 
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField 
                    label="Contraseña" 
                    value={password} 
                    onChange={setPassword} 
                    error={errors.password} 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                  />
                  <FormField 
                    label="Confirmar Contraseña" 
                    value={confirmPassword} 
                    onChange={setConfirmPassword} 
                    error={errors.confirmPassword} 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Asignación de Rol y Farmacia */}
            <div className="pb-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Asignación</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rolId}
                    onChange={(e) => setRolId(Number(e.target.value))}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.rol}
                      </option>
                    ))}
                  </select>
                  {errors.rol && <div className="text-red-500 text-xs mt-1">{errors.rol}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farmacia (opcional)
                  </label>
                  <select
                    value={farmaciaId || ""}
                    onChange={(e) => setFarmaciaId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin farmacia asignada</option>
                    {farmacias.map((farmacia) => (
                      <option key={farmacia.id_farmacia} value={farmacia.id_farmacia}>
                        {farmacia.nom_farma}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    Solo asignar si el usuario pertenece a una farmacia específica
                  </div>
                </div>
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-red-700 text-sm">{errors.general}</div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/logins/login")}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrar Usuario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
