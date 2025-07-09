import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../libs/supabase"

/**
 * Hook que verifica si el usuario actual está activo.
 * Si el usuario está inactivo, lo desloguea automáticamente.
 */
export function useActiveUserCheck() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Obtener el usuario actual autenticado
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          // No hay usuario autenticado, no hacer nada
          return
        }

        // Verificar si el usuario está activo en la base de datos
        const { data: usuario, error } = await supabase
          .from('usuario')
          .select('activo')
          .eq('uid', authUser.id)
          .maybeSingle()

        if (error) {
          console.error("Error al verificar estado del usuario:", error)
          return
        }

        // Si el usuario no existe en la BD o está inactivo, desloguearlo
        if (!usuario || !usuario.activo) {
          console.log("Usuario inactivo detectado, cerrando sesión...")
          await supabase.auth.signOut()
          navigate("/", { replace: true })
          
          // Mostrar mensaje informativo
          alert("Su cuenta ha sido desactivada. Por favor contacte al administrador.")
        }
      } catch (error) {
        console.error("Error en verificación de usuario activo:", error)
      }
    }

    // Ejecutar la verificación inmediatamente
    checkUserStatus()

    // Configurar un intervalo para verificar cada 30 segundos
    const intervalId = setInterval(checkUserStatus, 30000)

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId)
  }, [navigate])
}
