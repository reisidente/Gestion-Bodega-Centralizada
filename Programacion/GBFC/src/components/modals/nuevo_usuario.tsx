import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { FormField } from "../../components/ui/form/form-field"
import { Button } from "../../components/ui/button"
import { parseRUT } from "../../utils/rut-validor"
import { supabase } from "../../libs/supabase"
import { getFechaLocal } from "../../libs/utils"
import { BaseModal } from "./base"

interface NuevoUsuarioModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NuevoUsuarioModal({ open, onClose, onSuccess }: NuevoUsuarioModalProps) {
  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rolId, setRolId] = useState<number>(3) // Default: Bodeguero
  const [farmaciaId, setFarmaciaId] = useState<number | null>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [farmacias, setFarmacias] = useState<any[]>([])
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Cargar roles y farmacias cuando el modal se abre
      const cargarDatos = async () => {
        const { data: rolesData } = await supabase.from("rol").select("id_rol, rol").order("rol")
        if (rolesData) setRoles(rolesData)

        const { data: farmaciasData } = await supabase.from("farmacia").select("id_farmacia, nom_farma").order("nom_farma")
        if (farmaciasData) setFarmacias(farmaciasData)
      }
      cargarDatos()
    } else {
      // Limpiar el formulario cuando el modal se cierra
      setRut("")
      setNombre("")
      setApellido("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setRolId(3)
      setFarmaciaId(null)
      setErrors({})
      setIsLoading(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: any = {}
    
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
      const { data: rutExistente } = await supabase.from("usuario").select("id_usuario").eq("rut", parsed!.rut).maybeSingle()
      if (rutExistente) {
        setErrors({ rut: "Ya existe un usuario con este RUT" }); setIsLoading(false); return
      }

      const { data: emailExistente } = await supabase.from("usuario").select("id_usuario").eq("email", email).maybeSingle()
      if (emailExistente) {
        setErrors({ email: "Ya existe un usuario con este email" }); setIsLoading(false); return
      }

      const { data: authUser, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError || !authUser.user) {
        setErrors({ email: "No se pudo registrar el usuario: " + (authError?.message || "Error desconocido") }); setIsLoading(false); return
      }

      const uid = authUser.user.id

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
          contraseña: password,
          uid: uid,
        },
      ]).select('id_usuario').single()

      if (dbError || !usuarioInsertado) {
        setErrors({ general: "No se pudo guardar en DB: " + (dbError?.message || "Error desconocido") }); setIsLoading(false); return
      }

      const { error: errorRegistro } = await supabase.from("registro_usuario").insert([
        {
          fecha_mod: getFechaLocal(),
          observacion: "Registro inicial de usuario",
          usuario_id_usuario: usuarioInsertado.id_usuario,
          estado_usuario_id_estado: 1
        },
      ])

      if (errorRegistro) {
        setErrors({ general: "Error al crear registro: " + errorRegistro.message }); setIsLoading(false); return
      }

      onSuccess() // Llama a la función de éxito para refrescar y cerrar

    } catch (error) {
      console.error("Error inesperado:", error)
      setErrors({ general: "Error inesperado al registrar usuario" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <Card className="border-none shadow-none">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold">Registro de Nuevo Usuario</h2>
          <p className="text-gray-600">Complete todos los campos requeridos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="RUT" value={rut} onChange={setRut} error={errors.rut} placeholder="12.345.678-9" required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nombre" value={nombre} onChange={setNombre} error={errors.nombre} placeholder="Nombre" required />
              <FormField label="Apellido" value={apellido} onChange={setApellido} error={errors.apellido} placeholder="Apellido" required />
            </div>
            <FormField label="Email" value={email} onChange={setEmail} error={errors.email} type="email" placeholder="correo@ejemplo.com" required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Contraseña" value={password} onChange={setPassword} error={errors.password} type="password" placeholder="••••••••" required />
              <FormField label="Confirmar Contraseña" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} type="password" placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
              <select value={rolId} onChange={(e) => setRolId(Number(e.target.value))} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Seleccionar rol</option>
                {roles.map((rol) => (<option key={rol.id_rol} value={rol.id_rol}>{rol.rol}</option>))}
              </select>
              {errors.rol && <div className="text-red-500 text-xs mt-1">{errors.rol}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmacia (opcional)</label>
              <select value={farmaciaId || ""} onChange={(e) => setFarmaciaId(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin farmacia asignada</option>
                {farmacias.map((farmacia) => (<option key={farmacia.id_farmacia} value={farmacia.id_farmacia}>{farmacia.nom_farma}</option>))}
              </select>
            </div>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3"><div className="text-red-700 text-sm">{errors.general}</div></div>
            )}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>{isLoading ? "Registrando..." : "Registrar Usuario"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </BaseModal>
  )
}
