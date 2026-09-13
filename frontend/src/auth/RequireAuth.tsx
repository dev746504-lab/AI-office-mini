import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { UserRole } from '../types';

interface RequireAuthProps {
  /** Neu co, chi cac role nay moi duoc di tiep - sai role se bi day ve trang chu. */
  roles?: UserRole[];
}

export function RequireAuth({ roles }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-void)' }}>
        <p className="font-mono text-xs" style={{ color: 'var(--color-mono-dim)' }}>
          &gt; Đang xác thực phiên đăng nhập...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
