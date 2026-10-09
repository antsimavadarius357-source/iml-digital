import { Loader2 } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../features/auth/AuthContext';
import ChangePasswordPage from '../features/auth/ChangePasswordPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import UsersPage from '../features/settings/UsersPage';

function Protected() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-iml-500" /></div>;
  }
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.mustChangePassword) return <ChangePasswordPage />;
  return <AppLayout />;
}

/** Garde d'interface uniquement : la sécurité réelle est appliquée par le backend. */
function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />
      <Route element={<Protected />}>
        <Route index element={<DashboardPage />} />
        <Route path="equipe" element={<RequirePermission permission="users:manage"><UsersPage /></RequirePermission>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
