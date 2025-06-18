import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { FormField } from "../../components/ui/form/form-field"
import { Button } from "../../components/ui/button"
import { parseRUT } from "../../utils/rut-validor"
import { supabase } from "../../libs/supabase"
import { useAdminGuard } from "../../hooks/useAdminGuard"

export default function NuevoUsuario() {
  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const { isAdmin, loading } = useAdminGuard()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }
  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">Acceso denegado: solo administradores</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: any = {}
    const parsed = parseRUT(rut)
    if (!rut) newErrors.rut = "RUT requerido"
    else if (!parsed) newErrors.rut = "RUT inválido"
    if (!nombre) newErrors.nombre = "Nombre requerido"
    if (!apellido) newErrors.apellido = "Apellido requerido"
    if (!email) newErrors.email = "Email requerido"
    if (!password || password.length < 6) newErrors.password = "Contraseña mínima 6 caracteres"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    setIsLoading(true)
    // 1. Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError || !authUser.user) {
      setErrors({ email: "No se pudo registrar el usuario en Auth" })
      setIsLoading(false)
      return
    }
    const uid = authUser.user.id

    // 2. Validar que la uid no exista en la tabla usuario
    const { data: usuarioExistente } = await supabase
      .from("usuario")
      .select("id_usuario")
      .eq("uid", uid)
      .single()

    if (usuarioExistente) {
      setErrors({ general: "El usuario ya existe en la base de datos." })
      setIsLoading(false)
      return
    }
    // 3. Insertar en tabla usuario
    const { data: usuarioInsertado, error: dbError } = await supabase.from("usuario").insert([
      {
        rut: parsed!.rut,
        d_verificador: parsed!.dv,
        nom_usuario: nombre,
        ape_usuario: apellido,
        email,
        activo: true,
        farmacia_id_farmacia: null, // Asigna la farmacia si corresponde
        rol_id_rol: 2, // Asigna el rol que corresponda
        contraseña: password, // ¡En producción usa hash!
        uid: authUser.user.id,
      },
    ]).select('id_usuario').single()
    if (dbError || !usuarioInsertado) {
      setErrors({ general: "No se pudo registrar el usuario en la base de datos" })
      setIsLoading(false)
      return
    }
    // 4. Crear registro en registro_usuario
    const { error: errorRegistro } = await supabase.from("registro_usuario").insert([
      {
        fecha_mod: new Date().toISOString().slice(0, 10), // formato YYYY-MM-DD
        observacion: "Registro inicial de usuario",
        usuario_id_usuario: usuarioInsertado.id_usuario,
        estado_usuario_id_estado: 1 // Ajusta según tu catálogo de estados
      },
    ])
    if (errorRegistro) {
      setErrors({ general: "Error al crear registro de usuario: " + errorRegistro.message })
      setIsLoading(false)
      return
    }
    setIsLoading(false)
    navigate("/logins/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">Registro de Nuevo Usuario</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="RUT" value={rut} onChange={setRut} error={errors.rut} placeholder="12.345.678-9" />
            <FormField label="Nombre" value={nombre} onChange={setNombre} error={errors.nombre} placeholder="Nombre" />
            <FormField label="Apellido" value={apellido} onChange={setApellido} error={errors.apellido} placeholder="Apellido" />
            <FormField label="Email" value={email} onChange={setEmail} error={errors.email} type="email" placeholder="correo@ejemplo.com" />
            <FormField label="Contraseña" value={password} onChange={setPassword} error={errors.password} type="password" placeholder="••••••••" />
            {errors.general && <div className="text-red-500 text-sm">{errors.general}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
