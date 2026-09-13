import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { AppShell } from './layout/AppShell';
import { ThemeProvider } from './theme/ThemeContext';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AiConfigPage = lazy(() => import('./pages/AiConfigPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="font-mono text-xs" style={{ color: 'var(--color-mono-dim)' }}>
        &gt; Đang tải module...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter basename="/ai-agent-config">
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="configs" element={<AiConfigPage />} />

                <Route element={<RequireAuth roles={['admin']} />}>
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
