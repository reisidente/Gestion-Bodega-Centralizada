import { useEffect, useState } from "react"
import { supabase } from "../libs/supabase"

export function useAdminGuard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true)
      
      // Primero intentar con Supabase Auth
      const { data: { user } } = await supabase.auth.getUser()
      let uid = user?.id
      
      // Si no hay usuario en Supabase Auth, usar sesión local
      if (!uid) {
        const localSession = localStorage.getItem('userSession')
        if (localSession) {
          const session = JSON.parse(localSession)
          uid = session.uid
        }
      }
      
      if (!uid) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      
      // Buscar el usuario en la tabla usuario y verificar el rol
      const { data, error } = await supabase
        .from('usuario')
        .select('rol_id_rol')
        .eq('uid', uid)
        .single()
      if (error || !data) {
        setIsAdmin(false)
      } else {
        setIsAdmin(data.rol_id_rol === 1) // Asume que rol_id_rol=1 es admin
      }
      setLoading(false)
    }
    checkAdmin()
  }, [])

  return { isAdmin, loading }
}
