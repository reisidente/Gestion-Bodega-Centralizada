import { useEffect, useState } from "react"
import { supabase } from "../libs/supabase"

export function useAdminGuard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      // Buscar el usuario en la tabla usuario y verificar el rol
      const { data, error } = await supabase
        .from('usuario')
        .select('rol_id_rol')
        .eq('uid', user.id)
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
