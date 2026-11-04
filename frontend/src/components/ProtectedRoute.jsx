import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RouteLoader } from './layout/StoreLayout';

/** Sends signed-out visitors to /login and brings them back afterwards. */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
