import { useEffect, useState } from "react"
import { supabase } from "../libs/supabase"

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const check = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setIsAdmin(false)
        setUser(null)
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('usuario')
        .select('rol_id_rol, nom_usuario, ape_usuario, email')
        .eq('uid', authUser.id)
        .single()
      
      if (!error && data) {
        setIsAdmin(data.rol_id_rol === 1)
        setUser(data)
      } else {
        setIsAdmin(false)
        setUser(null)
      }
      setLoading(false)
    }
    check()
  }, [])

  return { isAdmin, loading, user }
}
