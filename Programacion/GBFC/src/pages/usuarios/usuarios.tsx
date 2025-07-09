import { useEffect, useState } from "react"
import { supabase } from "../../libs/supabase"
import { useAdminGuard } from "../../hooks/useAdminGuard"
import { useIsAdmin } from "../../hooks/useIsAdmin"
import { LoadingSpinner } from "../../components/animations/loading-spinner"
import { NuevoUsuarioModal } from "../../components/modals/nuevo_usuario"
import { EditarUsuarioModal } from "../../components/modals/editar_usuario"

// Definimos un tipo para el usuario que coincida con los datos que pedimos
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

export function UsuariosPage() {
  // 1. Proteger la ruta: solo administradores pueden acceder.
  const { loading: adminLoading, isAdmin } = useAdminGuard()
  const { user: currentUser } = useIsAdmin() // Para obtener el usuario actual

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 2. Efecto para cargar los usuarios una vez que se confirma que es admin.
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  async function fetchUsers() {
    setLoading(true)
    // 3. Hacemos la consulta a Supabase, uniendo la tabla 'rol' para obtener el nombre.
    const { data, error } = await supabase
      .from("usuario")
      .select(`
        id_usuario,
        rut,
        d_verificador,
        nom_usuario,
        ape_usuario,
        email,
        activo,
        farmacia_id_farmacia,
        rol_id_rol,
        rol (
          rol
        ),
        farmacia:farmacia_id_farmacia (
          nom_farma
        )
      `)

    if (error) {
      console.error("Error fetching users:", error)
      setError("No se pudo cargar la lista de usuarios.")
    } else if (data) {
      // Corregimos el tipo de 'data' para que coincida con la interfaz User
      setUsers(data as unknown as User[])
    }
    setLoading(false)
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedUser(null)
    fetchUsers() // Recargar la lista de usuarios
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  // Mientras se verifica el rol o se cargan los datos, mostramos un spinner.
  if (adminLoading || (isAdmin && loading)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // Si el hook de guardia determina que no es admin, no se renderiza nada.
  // El hook ya se encarga de redirigir.
  if (!isAdmin) {
    return null
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen animate-fade-in">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors duration-300"
        >
          Registrar Nuevo Usuario
        </button>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  RUT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Nombre Completo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Farmacia
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id_usuario} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.rut.toLocaleString('es-CL')}-{user.d_verificador}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.nom_usuario} {user.ape_usuario}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.rol?.rol?.toLowerCase() === 'administrador' ? 'bg-blue-100 text-blue-800' : ''}
                      ${user.rol?.rol?.toLowerCase() === 'farmaceutico' ? 'bg-green-100 text-green-800' : ''}
                      ${user.rol?.rol?.toLowerCase() === 'bodeguero' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                      {user.rol?.rol || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {user.farmacia?.nom_farma || 'No asignada'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* No mostrar botón editar si es el propio usuario administrador */}
                    {currentUser?.email !== user.email && (
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold mr-4"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NuevoUsuarioModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
      
      <EditarUsuarioModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleSuccess}
        user={selectedUser}
      />
    </div>
  )
}
