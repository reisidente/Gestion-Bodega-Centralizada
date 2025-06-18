import { useEffect, useState } from "react"
import { supabase } from "../libs/supabase"

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('usuario')
        .select('rol_id_rol')
        .eq('uid', user.id)
        .single()
      setIsAdmin(!error && data && data.rol_id_rol === 1)
      setLoading(false)
    }
    check()
  }, [])

  return { isAdmin, loading }
}
