import { Outlet } from 'react-router-dom';
import { NavSidebar } from './NavSidebar';

/** Khung dung chung cho moi trang: nav ben trai (thu gon thanh thanh ngang tren mobile) + vung noi dung. */
export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden font-body md:flex-row" style={{ background: 'var(--color-void)' }}>
      <NavSidebar />
      <main className="relative flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
