import { Loader2 } from 'lucide-react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
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
import SuiviCandidaturePage from '../features/public/SuiviCandidaturePage';
import BeneficiariesPage from '../features/beneficiaries/BeneficiariesPage';
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
import CoachesPage from '../features/coaches/CoachesPage';
import CoachDetailPage from '../features/coaches/CoachDetailPage';
import GroupsPage from '../features/groups/GroupsPage';
import ContactsPage from '../features/contacts/ContactsPage';
import CoachMessagesPage from '../features/messages/CoachMessagesPage';
import AuditPage from '../features/audit/AuditPage';
import SettingsPage from '../features/settings/SettingsPage';

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
  if (!can(permission)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-lg mx-auto text-center my-12 shadow-sm">
        <div className="size-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 font-bold text-lg">!</div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Accès réservé</h2>
        <p className="text-sm text-slate-600 mb-4">Votre rôle actuel n'a pas la permission requise ({permission}) pour consulter ce module.</p>
        <Link to="/tableau-de-bord" className="px-4 py-2 rounded-lg bg-[#23c3b1] text-white text-xs font-semibold hover:bg-[#1fb3a2] transition-colors inline-block">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/candidater" element={<PublicApplicationPage />} />
        <Route path="/suivi-candidature" element={<SuiviCandidaturePage />} />
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
        <Route path="tableau-de-bord" element={<DashboardPage />} />
        
        {/* Organisation */}
        <Route path="beneficiaires">
          <Route index element={<RequirePermission permission="beneficiaries:read"><BeneficiariesPage /></RequirePermission>} />
          <Route path="nouveau" element={<RequirePermission permission="beneficiaries:write"><BeneficiaryFormPage /></RequirePermission>} />
          <Route path=":id" element={<RequirePermission permission="beneficiaries:read"><BeneficiaryDetailPage /></RequirePermission>} />
          <Route path=":id/modifier" element={<RequirePermission permission="beneficiaries:write"><BeneficiaryEditPage /></RequirePermission>} />
        </Route>
        <Route path="groupes" element={<RequirePermission permission="beneficiaries:read"><GroupsPage /></RequirePermission>} />
        <Route path="contacts" element={<RequirePermission permission="beneficiaries:read"><ContactsPage /></RequirePermission>} />
        <Route path="equipe" element={<UsersPage />} />
        <Route path="equipe/:id" element={<CoachDetailPage />} />
        <Route path="coachs" element={<CoachesPage />} />
        <Route path="coachs/:id" element={<CoachDetailPage />} />
        <Route path="messages" element={<CoachMessagesPage />} />

        {/* Candidatures */}
        <Route path="candidatures">
          <Route index element={<RequirePermission permission="applications:review"><ApplicationsPage /></RequirePermission>} />
          <Route path=":id" element={<RequirePermission permission="applications:review"><ApplicationDetailPage /></RequirePermission>} />
        </Route>

        {/* Accompagnement & Rendez-vous */}
        <Route path="agendas" element={<RequirePermission permission="appointments:manage"><AppointmentsPage /></RequirePermission>} />
        <Route path="rendez-vous" element={<RequirePermission permission="appointments:manage"><AppointmentsPage /></RequirePermission>} />

        {/* Parcours */}
        <Route path="parcours">
          <Route index element={<RequirePermission permission="pathways:manage"><PathwaysPage /></RequirePermission>} />
          <Route path=":id" element={<RequirePermission permission="pathways:manage"><PathwayDetailPage /></RequirePermission>} />
        </Route>

        {/* Documents */}
        <Route path="documents" element={<DocumentsPage />} />

        {/* Paramètres & Audit */}
        <Route path="audit" element={<AuditPage />} />
        <Route path="parametres" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
