import { useEffect, useState } from "react"
import { supabase } from "../libs/supabase"

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [rol, setRol] = useState<any>(null)

  useEffect(() => {
    const check = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setIsAdmin(false)
        setUser(null)
        setRol(null)
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          rol_id_rol, 
          nom_usuario, 
          ape_usuario, 
          email,
          rol:rol_id_rol (
            rol
          )
        `)
        .eq('uid', authUser.id)
        .single()
      
      if (!error && data) {
        setIsAdmin(data.rol_id_rol === 1)
        setUser(data)
        setRol(data.rol)
      } else {
        setIsAdmin(false)
        setUser(null)
        setRol(null)
      }
      setLoading(false)
    }
    check()
  }, [])

  return { isAdmin, loading, user, rol }
}
