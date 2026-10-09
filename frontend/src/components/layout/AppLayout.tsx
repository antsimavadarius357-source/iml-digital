import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell, BookOpen, Briefcase, Calendar, ChartColumn, FileText, FolderKanban, GraduationCap, LayoutDashboard,
  LogOut, Menu, Route, Search, Settings, ShieldCheck, Users, UsersRound, X, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: string;
  /** false tant que le module n'est pas développé : l'entrée n'est alors pas affichée. */
  ready: boolean;
}

// Le menu ne liste que les modules réellement disponibles ; les autres s'ajoutent en phase 4.
const NAV: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, permission: 'dashboard:read', ready: true },
  { to: '/beneficiaires', label: 'Bénéficiaires', icon: Users, permission: 'beneficiaries:read', ready: false },
  { to: '/candidatures', label: 'Candidatures', icon: FolderKanban, permission: 'applications:review', ready: false },
  { to: '/parcours', label: "Parcours d'accompagnement", icon: Route, permission: 'pathways:manage', ready: false },
  { to: '/programmes', label: 'Programmes et groupes', icon: Briefcase, permission: 'settings:manage', ready: false },
  { to: '/rendez-vous', label: 'Activités et rendez-vous', icon: Calendar, permission: 'appointments:manage', ready: false },
  { to: '/formations', label: 'Formations et ressources', icon: GraduationCap, permission: 'training:manage', ready: false },
  { to: '/documents', label: 'Documents', icon: FileText, permission: 'documents:read', ready: false },
  { to: '/contacts', label: 'Contacts et partenaires', icon: BookOpen, permission: 'contacts:read', ready: false },
  { to: '/equipe', label: 'Équipe et utilisateurs', icon: UsersRound, permission: 'users:manage', ready: false },
  { to: '/rapports', label: 'Indicateurs et rapports', icon: ChartColumn, permission: 'reports:read', ready: false },
  { to: '/audit', label: "Journal d'audit", icon: ShieldCheck, permission: 'audit:read', ready: false },
  { to: '/parametres', label: 'Paramètres', icon: Settings, permission: 'settings:manage', ready: false },
];

export default function AppLayout() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const items = NAV.filter((i) => i.ready && can(i.permission));
  const title = items.find((i) => i.to === pathname)?.label ?? 'IML DIGITAL';

  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-iml-900 text-white flex flex-col transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <span className="text-lg font-bold">IML <span className="text-iml-400">DIGITAL</span></span>
          <button className="lg:hidden" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigation principale">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-iml-500 text-white' : 'text-white/75 hover:bg-white/10'
                }`
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 sticky top-0 z-20">
          <button className="lg:hidden" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <h1 className="font-semibold text-iml-900 truncate">{title}</h1>
          <div className="ml-auto flex items-center gap-1 sm:gap-3 text-slate-500">
            <button disabled title="Recherche globale : disponible avec les modules métier" aria-label="Recherche" className="p-2 opacity-40 cursor-not-allowed"><Search className="size-5" /></button>
            <button disabled title="Calendrier : disponible avec le module rendez-vous" aria-label="Calendrier" className="p-2 opacity-40 cursor-not-allowed"><Calendar className="size-5" /></button>
            <button disabled title="Notifications : disponibles avec le module notifications" aria-label="Notifications" className="p-2 opacity-40 cursor-not-allowed"><Bell className="size-5" /></button>
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-medium text-slate-800">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs">{user?.roleLabel}</div>
            </div>
            <button onClick={() => void logout()} aria-label="Se déconnecter" title="Se déconnecter" className="p-2 hover:text-red-600">
              <LogOut className="size-5" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
