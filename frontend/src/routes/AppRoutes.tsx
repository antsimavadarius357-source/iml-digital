import { Loader2 } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../features/auth/AuthContext';
import ChangePasswordPage from '../features/auth/ChangePasswordPage';
import LoginPage from '../features/auth/LoginPage';
import PublicLayout from '../components/layout/PublicLayout';
import DashboardPage from '../features/dashboard/DashboardPage';
import LandingPage from '../features/public/LandingPage';
import OffresPage from '../features/public/OffresPage';
import TarifsPage from '../features/public/TarifsPage';
import OutilsGratuitsPage from '../features/public/OutilsGratuitsPage';
import ComparatifsPage from '../features/public/ComparatifsPage';
import GuidesPage from '../features/public/GuidesPage';
import ModelesPage from '../features/public/ModelesPage';
import WebinairesPage from '../features/public/WebinairesPage';
import SolutionsDetailPage from '../features/public/SolutionsDetailPage';
import ContactPage from '../features/public/ContactPage';
import PublicApplicationPage from '../features/public/PublicApplicationPage';
import BeneficiariesPage from '../features/beneficiaries/BeneficiariesPage';
import GroupsPage from '../features/groups/GroupsPage';
import ContactsPage from '../features/contacts/ContactsPage';
import BeneficiaryFormPage from '../features/beneficiaries/BeneficiaryFormPage';
import BeneficiaryDetailPage from '../features/beneficiaries/BeneficiaryDetailPage';
import BeneficiaryEditPage from '../features/beneficiaries/BeneficiaryEditPage';
import ApplicationsPage from '../features/applications/ApplicationsPage';
import ApplicationDetailPage from '../features/applications/ApplicationDetailPage';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import PathwaysPage from '../features/pathways/PathwaysPage';
import PathwayDetailPage from '../features/pathways/PathwayDetailPage';
import DocumentsPage from '../features/documents/DocumentsPage';
import UsersPage from '../features/users/UsersPage';
import CoachDetailPage from '../features/coaches/CoachDetailPage';
import AuditPage from '../features/audit/AuditPage';
import SettingsPage from '../features/settings/SettingsPage';
import CoachMessagesPage from '../features/messages/CoachMessagesPage';

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

/** Garde stricte : Le rôle COACH ne consulte que sa session personnelle et ses messages */
function RestrictCoach({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'COACH') {
    return <Navigate to="/tableau-de-bord" replace />;
  }
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/candidater" element={<PublicApplicationPage />} />
        <Route path="/offres" element={<OffresPage />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        <Route path="/ressources/outils" element={<OutilsGratuitsPage />} />
        <Route path="/ressources/comparatifs" element={<ComparatifsPage />} />
        <Route path="/ressources/guides" element={<GuidesPage />} />
        <Route path="/ressources/modeles" element={<ModelesPage />} />
        <Route path="/ressources/webinaires" element={<WebinairesPage />} />
        <Route path="/solutions/:slug" element={<SolutionsDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/connexion" element={<LoginPage />} />
      
      <Route element={<Protected />}>
        {/* Espaces accessibles au Coach */}
        <Route path="tableau-de-bord" element={<DashboardPage />} />
        <Route path="tableau-de-bord/:roleParam" element={<DashboardPage />} />
        <Route path="messages" element={<CoachMessagesPage />} />

        {/* Modules d'administration et de gestion : inaccessibles au Coach */}
        <Route path="equipe" element={<RestrictCoach><UsersPage /></RestrictCoach>} />
        <Route path="equipe/:id" element={<RestrictCoach><CoachDetailPage /></RestrictCoach>} />
        <Route path="coachs" element={<RestrictCoach><UsersPage /></RestrictCoach>} />
        <Route path="coachs/:id" element={<RestrictCoach><CoachDetailPage /></RestrictCoach>} />
        
        <Route path="beneficiaires">
          <Route index element={<RestrictCoach><RequirePermission permission="beneficiaries:read"><BeneficiariesPage /></RequirePermission></RestrictCoach>} />
          <Route path="nouveau" element={<RestrictCoach><RequirePermission permission="beneficiaries:write"><BeneficiaryFormPage /></RequirePermission></RestrictCoach>} />
          <Route path=":id" element={<RestrictCoach><RequirePermission permission="beneficiaries:read"><BeneficiaryDetailPage /></RequirePermission></RestrictCoach>} />
          <Route path=":id/modifier" element={<RestrictCoach><RequirePermission permission="beneficiaries:write"><BeneficiaryEditPage /></RequirePermission></RestrictCoach>} />
        </Route>

        <Route path="groupes" element={<RestrictCoach><RequirePermission permission="beneficiaries:read"><GroupsPage /></RequirePermission></RestrictCoach>} />
        <Route path="contacts" element={<RestrictCoach><RequirePermission permission="beneficiaries:read"><ContactsPage /></RequirePermission></RestrictCoach>} />
        
        <Route path="candidatures">
          <Route index element={<RestrictCoach><RequirePermission permission="applications:review"><ApplicationsPage /></RequirePermission></RestrictCoach>} />
          <Route path=":id" element={<RestrictCoach><RequirePermission permission="applications:review"><ApplicationDetailPage /></RequirePermission></RestrictCoach>} />
        </Route>

        <Route path="agendas">
          <Route index element={<RestrictCoach><RequirePermission permission="appointments:manage"><AppointmentsPage /></RequirePermission></RestrictCoach>} />
        </Route>

        <Route path="parcours">
          <Route index element={<RestrictCoach><RequirePermission permission="pathways:manage"><PathwaysPage /></RequirePermission></RestrictCoach>} />
          <Route path=":id" element={<RestrictCoach><RequirePermission permission="pathways:manage"><PathwayDetailPage /></RequirePermission></RestrictCoach>} />
        </Route>

        <Route path="documents" element={<RestrictCoach><DocumentsPage /></RestrictCoach>} />
        <Route path="audit" element={<RestrictCoach><RequirePermission permission="audit:read"><AuditPage /></RequirePermission></RestrictCoach>} />
        <Route path="parametres" element={<RestrictCoach><RequirePermission permission="settings:manage"><SettingsPage /></RequirePermission></RestrictCoach>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
