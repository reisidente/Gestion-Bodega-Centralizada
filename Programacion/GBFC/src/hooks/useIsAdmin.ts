import { useEffect, useState } from "react"
import { supabase } from "../libs/supabase"

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
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
      
      const { data, error } = await supabase
        .from('usuario')
        .select('rol_id_rol')
        .eq('uid', uid)
        .single()
      setIsAdmin(!error && data && data.rol_id_rol === 1)
      setLoading(false)
    }
    check()
  }, [])

  return { isAdmin, loading }
}
