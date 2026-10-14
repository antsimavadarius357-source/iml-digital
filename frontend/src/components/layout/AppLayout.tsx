import { useState, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Bell, 
  Calendar, 
  FileText, 
  Home, 
  LogOut, 
  Menu, 
  Network, 
  HeartHandshake, 
  Target, 
  Search, 
  Settings, 
  Flag, 
  User as UserIcon,
  Users,
  Contact,
  UserCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Sous-menus disponibles selon l'icône sélectionnée ou survolée
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [hoveredBottomItem, setHoveredBottomItem] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleItemMouseEnter = (id: string, hasSubmenu: boolean) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (hasSubmenu) {
      setHoveredMenu(id);
    } else {
      setHoveredMenu(null);
    }
  };

  const handleItemMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 250);
  };

  const handleFlyoutMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 250);
  };

  const submenus: Record<string, { title: string; subtitle?: string; items: { label: string; to: string; icon: any }[] }> = {
    organisation: {
      title: 'Organisation',
      subtitle: 'Bénéficiaires & acteurs',
      items: [
        { label: 'Bénéficiaires', to: '/beneficiaires', icon: UserIcon },
        { label: 'Groupes', to: '/beneficiaires?vue=groupes', icon: Users },
        { label: 'Contacts', to: '/beneficiaires?vue=contacts', icon: Contact },
        { label: 'Coachs & Équipe', to: '/equipe', icon: UserCheck },
        { label: 'Organisations', to: '/beneficiaires?vue=organisations', icon: Building2 },
      ]
    },
    accompagnement: {
      title: 'Accompagnement',
      subtitle: 'Suivi opérationnel',
      items: [
        { label: 'Rendez-vous & Agenda', to: '/agendas', icon: Calendar },
        { label: 'Prestations réalisées', to: '/tableau-de-bord', icon: HeartHandshake },
        { label: 'Documents & Livrables', to: '/documents', icon: FileText },
        { label: 'Notes de suivi', to: '/tableau-de-bord', icon: FileText },
      ]
    },
    parcours: {
      title: 'Candidatures & Parcours',
      subtitle: 'Étapes et progression',
      items: [
        { label: 'Candidatures reçues', to: '/candidatures', icon: Target },
        { label: 'Parcours types', to: '/parcours', icon: Network },
        { label: 'Étapes à valider', to: '/parcours', icon: Target },
      ]
    },
    parametres: {
      title: 'Paramètres',
      subtitle: 'Configuration & équipe',
      items: [
        { label: 'Profil & Organisation', to: '/parametres', icon: Settings },
        { label: 'Gestion de l\'équipe', to: '/equipe', icon: Users },
        { label: 'Journal d\'audit', to: '/audit', icon: FileText },
      ]
    }
  };

  const navLinks = [
    { id: 'accueil', to: '/tableau-de-bord', label: 'Accueil', icon: Home, hasSubmenu: false },
    { id: 'organisation', to: '/beneficiaires', label: 'Organisation', icon: Network, hasSubmenu: true },
    { id: 'accompagnement', to: '/agendas', label: 'Accompagnement', icon: HeartHandshake, hasSubmenu: true },
    { id: 'parcours', to: '/candidatures', label: 'Candidatures & Parcours', icon: Target, hasSubmenu: true },
    { id: 'parametres', to: '/parametres', label: 'Paramètres', icon: Settings, hasSubmenu: true },
  ];

  const activeSubmenu = hoveredMenu || openSubmenu;

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex font-sans selection:bg-[#f06553] selection:text-white">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Backdrop pour fermer le sous-menu en cliquant sur le contenu (mode épinglé) */}
      {openSubmenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] transition-opacity"
          onClick={() => setOpenSubmenu(null)}
        />
      )}

      {/* =========================================================================
          SIDEBAR GAUCHE COMPACTE 60px
         ========================================================================= */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-[60px] flex flex-col shrink-0 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Case supérieure blanche 60x60 avec le symbole infini noir */}
        <div className="h-16 w-full bg-white border-b border-r border-slate-200/80 flex items-center justify-center shrink-0">
          <Link 
            to="/" 
            className="text-2xl font-black text-slate-800 hover:text-[#f06553] transition-colors"
            title="Accueil iml digit"
          >
            ∞
          </Link>
        </div>

        {/* Colonne bleu ardoise sombre sous le logo */}
        <div className="flex-1 bg-[#1a3348] text-white flex flex-col items-center justify-between py-4 w-full relative">
          {/* Navigation Verticale */}
          <nav className="flex flex-col items-center gap-3.5 w-full">
            {navLinks.map(({ id, to, label, icon: Icon, hasSubmenu }) => {
              const isCurrentRoute = location.pathname === to || (to !== '/tableau-de-bord' && location.pathname.startsWith(to));
              const isSubmenuOpen = hasSubmenu && activeSubmenu === id;
              const isTurquoiseActive = isSubmenuOpen || (isCurrentRoute && !activeSubmenu);

              return (
                <div 
                  key={id}
                  className="relative flex items-center justify-center w-full"
                  onMouseEnter={() => handleItemMouseEnter(id, hasSubmenu)}
                  onMouseLeave={handleItemMouseLeave}
                >
                  <button
                    type="button"
                    title={label}
                    onClick={() => {
                      if (hasSubmenu) {
                        setOpenSubmenu(openSubmenu === id ? null : id);
                      } else {
                        setOpenSubmenu(null);
                        setHoveredMenu(null);
                        setMobileOpen(false);
                        navigate(to);
                      }
                    }}
                    className={`relative size-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer group ${
                      isTurquoiseActive
                        ? 'bg-[#23c3b1] text-white shadow-lg shadow-[#23c3b1]/40 scale-105'
                        : 'text-slate-300 hover:text-white hover:bg-white/15 hover:scale-110'
                    }`}
                  >
                    <Icon className="size-4.5 stroke-[1.75] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
                  </button>

                  {/* Petit triangle indicateur si le sous-menu de cette icône est ouvert */}
                  {isSubmenuOpen && (
                    <div className="hidden lg:block absolute -right-[1px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-[#23c3b1] z-50 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bas : Drapeau turquoise & Déconnexion avec tooltips au survol */}
          <div className="flex flex-col items-center gap-3 w-full">
            
            {/* 1. Support & Signalement */}
            <div 
              className="relative flex items-center justify-center"
              onMouseEnter={() => setHoveredBottomItem('support')}
              onMouseLeave={() => setHoveredBottomItem(null)}
            >
              <button 
                type="button" 
                title="Support & Signalement"
                className="size-10 rounded-full bg-[#23c3b1] text-white flex items-center justify-center shadow-md shadow-[#23c3b1]/40 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-[#23c3b1]/50 cursor-pointer"
              >
                <Flag className="size-4.5 stroke-[1.75] transition-transform duration-200 hover:rotate-6" />
              </button>

              {/* Tooltip au survol */}
              {hoveredBottomItem === 'support' && (
                <div className="hidden lg:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#1a3348] border border-slate-700/80 text-white text-xs font-medium shadow-xl whitespace-nowrap z-50 items-center gap-1.5 animate-in fade-in slide-in-from-left-1 pointer-events-none">
                  <span className="size-1.5 rounded-full bg-[#23c3b1]" />
                  Support & Signalement
                </div>
              )}
            </div>
            
            {/* 2. Déconnexion */}
            <div 
              className="relative flex items-center justify-center"
              onMouseEnter={() => setHoveredBottomItem('logout')}
              onMouseLeave={() => setHoveredBottomItem(null)}
            >
              <button 
                onClick={() => void logout()} 
                title="Se déconnecter"
                className="size-9 rounded-full text-slate-400 hover:text-[#f06553] hover:bg-red-500/10 hover:scale-110 flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <LogOut className="size-3.5 transition-transform duration-200 hover:-translate-x-0.5" />
              </button>

              {/* Tooltip au survol */}
              {hoveredBottomItem === 'logout' && (
                <div className="hidden lg:flex absolute left-[52px] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#1a3348] border border-slate-700/80 text-rose-300 text-xs font-medium shadow-xl whitespace-nowrap z-50 items-center gap-1.5 animate-in fade-in slide-in-from-left-1 pointer-events-none">
                  <span className="size-1.5 rounded-full bg-rose-400" />
                  Se déconnecter
                </div>
              )}
            </div>

          </div>
        </div>

        {/* =======================================================================
            SOUS-MENU DYNAMIQUE TRANSLUCIDE (S'OUVRE AU SURVOL DE LA SOURIS)
           ======================================================================= */}
        {activeSubmenu && submenus[activeSubmenu] && (
          <div 
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
            className="fixed left-[60px] top-0 bottom-0 w-[240px] bg-[#1a3348]/20 backdrop-blur-md text-white border-r border-white/15 shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {/* En-tête du sous-menu */}
            <div className="h-16 flex flex-col justify-center px-5 border-b border-white/15 bg-[#1a3348]/40 shrink-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#23c3b1] animate-pulse" />
                <h2 className="text-[14px] font-bold text-white tracking-wide truncate drop-shadow-sm">
                  {submenus[activeSubmenu].title}
                </h2>
              </div>
              {submenus[activeSubmenu].subtitle && (
                <p className="text-[11px] text-slate-200 mt-0.5 truncate pl-4 drop-shadow-sm">
                  {submenus[activeSubmenu].subtitle}
                </p>
              )}
            </div>

            {/* Liste des options interactives du sous-menu */}
            <div className="flex-1 py-3 px-2 overflow-y-auto space-y-1.5">
              {submenus[activeSubmenu].items.map((item) => {
                const ItemIcon = item.icon;
                const isItemActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => {
                      setHoveredMenu(null);
                      setOpenSubmenu(null);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 group cursor-pointer ${
                      isItemActive
                        ? 'bg-[#23c3b1] text-white font-medium shadow-md shadow-[#23c3b1]/40'
                        : 'bg-[#1a3348]/50 hover:bg-[#1a3348]/85 text-white hover:translate-x-1 shadow-xs border border-white/10'
                    }`}
                  >
                    <div className={`size-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isItemActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 text-slate-200 group-hover:bg-[#23c3b1] group-hover:text-white'
                    }`}>
                      <ItemIcon className="size-3.5 stroke-[1.75]" />
                    </div>
                    <span className="font-medium truncate drop-shadow-xs">{item.label}</span>
                    <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#23c3b1] ml-auto shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Pied du volet latéral */}
            <div className="p-3.5 border-t border-white/15 bg-[#1a3348]/40 text-[11px] text-slate-300 flex items-center justify-between">
              <span>IML Digital</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-slate-200 font-mono">v2.0</span>
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          ZONE PRINCIPALE + TOPBAR BLANCHE ÉPURÉE
         ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar blanche conforme à l'image */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
          
          {/* Gauche : Bouton menu mobile */}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" 
              onClick={() => setMobileOpen(true)}
              title="Menu"
            >
              <Menu className="size-5" />
            </button>
          </div>

          {/* Centre : Barre de recherche blanche "Rechercher un bénéficiaire" */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher un bénéficiaire"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#2dd4bf] transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Droite : Calendrier, Cloche & Profil DARUS */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/agendas" 
              className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors"
              title="Mon calendrier"
            >
              <Calendar className="size-4" />
            </Link>

            <button 
              className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors relative"
              title="Notifications"
            >
              <Bell className="size-4" />
            </button>

            {/* Profil utilisateur connecté avec déconnexion */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="size-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <UserIcon className="size-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 tracking-wide">
                {user ? `${user.firstName} ${user.lastName}`.trim() : 'Agent IML'}
              </span>
              <button 
                onClick={() => void logout()}
                title="Se déconnecter"
                aria-label="Se déconnecter"
                className="p-1 ml-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content avec fond blanc cassé et forme incurvée rose/pêche à droite comme sur la capture */}
        <main className="flex-1 p-4 sm:p-6 lg:p-6 relative overflow-x-hidden bg-[#f7f8f9]">
          {/* Forme incurvée rose/pêche caractéristique en arrière-plan à droite */}
          <div 
            className="absolute -right-20 top-0 w-[520px] h-[720px] bg-[#fce9e6]/50 rounded-bl-[260px] pointer-events-none -z-0" 
            aria-hidden="true"
          />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
