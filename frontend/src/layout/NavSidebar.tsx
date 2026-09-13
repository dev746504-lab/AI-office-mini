import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🛰️', end: true },
  { to: '/configs', label: 'Cấu hình AI', icon: '🤖' },
  { to: '/history', label: 'Lịch sử Báo cáo', icon: '🗂️', roles: ['admin'] },
];

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  ai_manager: 'Quản lý AI',
};

export function NavSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '··';

  return (
    <nav className="glass-panel relative z-20 flex shrink-0 flex-row items-center gap-2 border-b border-white/8 px-3 py-2 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-4 md:py-5">
      <div className="flex shrink-0 items-center gap-2 md:mb-8 md:px-1">
        <span className="text-xl">🤖</span>
        <div className="hidden md:block">
          <p className="font-display text-xs font-bold tracking-wider" style={{ color: 'var(--color-ink)' }}>
            AI OFFICE
          </p>
          <p className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--color-mono-dim)' }}>
            COMMAND CENTER
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-row gap-1 overflow-x-auto md:flex-col md:gap-1.5 md:overflow-visible">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="shrink-0 rounded-xl px-3 py-2.5 font-mono text-xs font-medium tracking-wide transition-colors hover:bg-white/5"
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'rgba(0,217,245,0.12)',
                    color: 'var(--color-cyan)',
                    border: '1px solid rgba(0,217,245,0.3)',
                  }
                : { color: 'var(--color-dim)', border: '1px solid transparent' }
            }
          >
            <span className="flex items-center gap-2.5">
              <span>{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
          </NavLink>
        ))}
      </div>

      <div className="hidden shrink-0 flex-col gap-3 md:flex">
        {isAdmin && (
          <NavLink
            to="/settings"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-mono text-xs transition-colors hover:bg-white/5"
            style={({ isActive }) => ({ color: isActive ? 'var(--color-cyan)' : 'var(--color-dim)' })}
          >
            <span>⚙️</span> Cài đặt hệ thống
          </NavLink>
        )}
        <div className="glass-panel flex items-center gap-2.5 rounded-xl p-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold"
            style={{ background: 'rgba(0,217,245,0.15)', color: 'var(--color-cyan)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" style={{ color: 'var(--color-ink)' }}>
              {user ? ROLE_LABEL[user.role] : '—'}
            </p>
            <p className="truncate font-mono text-[10px]" style={{ color: 'var(--color-mono-dim)' }}>
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="shrink-0 text-sm transition-colors hover:text-red-400"
            style={{ color: 'var(--color-dim)' }}
          >
            ⏻
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        title="Đăng xuất"
        className="shrink-0 rounded-xl p-2 text-base transition-colors hover:text-red-400 md:hidden"
        style={{ color: 'var(--color-dim)' }}
      >
        ⏻
      </button>
    </nav>
  );
}
