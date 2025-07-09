import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useActiveUserCheck } from '../../hooks/useActiveUserCheck';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  
  // Verificar continuamente si el usuario está activo
  useActiveUserCheck();

  if (loading) {
    return <div>Loading...</div>; // O un spinner de carga
  }

  if (!session) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
