import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context.js';

export function ProtectedRoute() {
  const { configured, loading, session } = useAuth();
  const location = useLocation();

  if (loading) return <main className="center-page">로그인 정보를 확인하는 중입니다.</main>;
  if (!configured) return <Outlet />;
  if (!session) return <Navigate to="/" state={{ from: location }} replace />;
  return <Outlet />;
}
