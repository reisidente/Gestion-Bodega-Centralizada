import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // O un spinner de carga
  }

  if (!session) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
