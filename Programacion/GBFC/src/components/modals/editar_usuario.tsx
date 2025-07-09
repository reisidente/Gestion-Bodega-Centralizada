import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { FormField } from "../../components/ui/form/form-field"
import { Button } from "../../components/ui/button"
import { supabase } from "../../libs/supabase"
import { BaseModal } from "./base"

interface User {
  id_usuario: string
  rut: number
  d_verificador: string
  nom_usuario: string
  ape_usuario: string
  email: string
  activo: boolean
  farmacia_id_farmacia: number | null
  rol_id_rol: number
  rol: {
    rol: string
  } | null
  farmacia: {
    nom_farma: string
  } | null
}

interface EditarUsuarioModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export function EditarUsuarioModal({ open, onClose, onSuccess, user }: EditarUsuarioModalProps) {
  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [activo, setActivo] = useState(true)
  const [rolId, setRolId] = useState<number>(3)
  const [farmaciaId, setFarmaciaId] = useState<number | null>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [farmacias, setFarmacias] = useState<any[]>([])
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      // Cargar roles y farmacias
      const cargarDatos = async () => {
        const { data: rolesData } = await supabase.from("rol").select("id_rol, rol").order("rol")
        if (rolesData) setRoles(rolesData)

        const { data: farmaciasData } = await supabase.from("farmacia").select("id_farmacia, nom_farma").order("nom_farma")
        if (farmaciasData) setFarmacias(farmaciasData)
      }
      cargarDatos()

      // Cargar datos del usuario
      setRut(`${user.rut.toLocaleString('es-CL')}-${user.d_verificador}`)
      setNombre(user.nom_usuario)
      setApellido(user.ape_usuario)
      setEmail(user.email)
      setActivo(user.activo)
      setRolId(user.rol_id_rol)
      setFarmaciaId(user.farmacia_id_farmacia)
    } else if (!open) {
      // Limpiar formulario cuando se cierra
      setRut("")
      setNombre("")
      setApellido("")
      setEmail("")
      setActivo(true)
      setRolId(3)
      setFarmaciaId(null)
      setErrors({})
      setIsLoading(false)
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const newErrors: any = {}
    
    // El RUT es de solo lectura, no se valida ni actualiza
    
    if (!nombre.trim()) newErrors.nombre = "Nombre requerido"
    if (!apellido.trim()) newErrors.apellido = "Apellido requerido"
    
    if (!email.trim()) newErrors.email = "Email requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email inválido"
    
    if (!rolId) newErrors.rol = "Debe seleccionar un rol"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)

    try {
      // Verificar si el email ya existe en otro usuario
      if (email !== user.email) {
        const { data: emailExistente } = await supabase
          .from("usuario")
          .select("id_usuario")
          .eq("email", email)
          .neq("id_usuario", user.id_usuario)
          .maybeSingle()

        if (emailExistente) {
          setErrors({ email: "Ya existe otro usuario con este email" })
          setIsLoading(false)
          return
        }
      }

      // Actualizar usuario (sin modificar RUT)
      const { error: updateError } = await supabase
        .from("usuario")
        .update({
          nom_usuario: nombre.trim(),
          ape_usuario: apellido.trim(),
          email: email.trim(),
          activo,
          farmacia_id_farmacia: farmaciaId,
          rol_id_rol: rolId,
        })
        .eq("id_usuario", user.id_usuario)

      if (updateError) {
        setErrors({ general: "Error al actualizar usuario: " + updateError.message })
        setIsLoading(false)
        return
      }

      onSuccess() // Cerrar modal y refrescar

    } catch (error) {
      console.error("Error inesperado:", error)
      setErrors({ general: "Error inesperado al actualizar usuario" })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <BaseModal open={open} onClose={onClose} widthClass="max-w-lg">
      <Card className="border-none shadow-none">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold">Editar Usuario</h2>
          <p className="text-gray-600">Modifique los campos necesarios</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField 
              label="RUT" 
              value={rut} 
              onChange={setRut} 
              error={errors.rut} 
              placeholder="12.345.678-9" 
              required 
              disabled={true}
            />
            <div className="text-sm text-gray-500 -mt-2">
              El RUT no puede ser modificado por seguridad
            </div>
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
            <FormField 
              label="Email" 
              value={email} 
              onChange={setEmail} 
              error={errors.email} 
              type="email" 
              placeholder="correo@ejemplo.com" 
              required 
            />
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={activo ? "true" : "false"}
                onChange={(e) => setActivo(e.target.value === "true")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
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
                onClick={onClose} 
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
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </BaseModal>
  )
}
