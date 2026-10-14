import React, { createContext, useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  User as UserIcon, 
  Calendar, 
  FileText, 
  Target, 
  Network, 
  Settings, 
  Contact,
  MessageSquare
} from 'lucide-react';

export interface BreadcrumbCrumb {
  label: string;
  to?: string;
  icon?: any;
}

interface BreadcrumbContextType {
  customCrumbs: BreadcrumbCrumb[] | null;
  setCustomCrumbs: (crumbs: BreadcrumbCrumb[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  customCrumbs: null,
  setCustomCrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [customCrumbs, setCustomCrumbs] = useState<BreadcrumbCrumb[] | null>(null);
  const location = useLocation();

  // Réinitialiser les miettes personnalisées lors du changement de route
  useEffect(() => {
    setCustomCrumbs(null);
  }, [location.pathname]);

  return (
    <BreadcrumbContext.Provider value={{ customCrumbs, setCustomCrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useSetBreadcrumbs(crumbs: BreadcrumbCrumb[]) {
  const { setCustomCrumbs } = useContext(BreadcrumbContext);
  useEffect(() => {
    setCustomCrumbs(crumbs);
    return () => setCustomCrumbs(null);
  }, [JSON.stringify(crumbs)]);
}

export default function AppBreadcrumb() {
  const { customCrumbs } = useContext(BreadcrumbContext);
  const location = useLocation();
  const path = location.pathname;

  // Si on est sur la page d'accueil pure (/tableau-de-bord), on ne l'affiche pas ou on affiche juste Accueil
  if (path === '/tableau-de-bord' || path === '/') {
    return null;
  }

  // Si un sous-menu ou une page a défini ses propres miettes spécifiques (ex: nom du coach ou du bénéficiaire)
  let crumbs: BreadcrumbCrumb[] = [];

  if (customCrumbs && customCrumbs.length > 0) {
    crumbs = customCrumbs;
  } else {
    // Résolution automatique par défaut selon la route active
    if (path.startsWith('/beneficiaires')) {
      if (path === '/beneficiaires/nouveau') {
        crumbs = [
          { label: 'Bénéficiaires', to: '/beneficiaires', icon: UserIcon },
          { label: 'Nouveau dossier' }
        ];
      } else if (path.includes('/modifier')) {
        crumbs = [
          { label: 'Bénéficiaires', to: '/beneficiaires', icon: UserIcon },
          { label: 'Modifier le dossier' }
        ];
      } else if (path !== '/beneficiaires') {
        crumbs = [
          { label: 'Bénéficiaires', to: '/beneficiaires', icon: UserIcon },
          { label: 'Marine LOUPE', icon: UserIcon }
        ];
      } else {
        crumbs = [
          { label: 'Bénéficiaires', icon: UserIcon }
        ];
      }
    } else if (path.startsWith('/groupes')) {
      crumbs = [
        { label: 'Groupes', icon: Users }
      ];
    } else if (path.startsWith('/contacts')) {
      crumbs = [
        { label: 'Contacts', icon: Contact }
      ];
    } else if (path.startsWith('/equipe') || path.startsWith('/coachs')) {
      if (path === '/equipe' || path === '/coachs') {
        crumbs = [
          { label: 'Coachs', icon: Users }
        ];
      } else {
        crumbs = [
          { label: 'Coachs', to: '/equipe', icon: Users },
          { label: 'ALEXANDRE AGENT IML', icon: UserIcon }
        ];
      }
    } else if (path.startsWith('/agendas')) {
      crumbs = [
        { label: 'Rendez-vous & Agenda', icon: Calendar }
      ];
    } else if (path.startsWith('/documents')) {
      crumbs = [
        { label: 'Documents & Livrables', icon: FileText }
      ];
    } else if (path.startsWith('/candidatures')) {
      if (path !== '/candidatures') {
        crumbs = [
          { label: 'Candidatures reçues', to: '/candidatures', icon: Target },
          { label: 'Détail candidature' }
        ];
      } else {
        crumbs = [
          { label: 'Candidatures reçues', icon: Target }
        ];
      }
    } else if (path.startsWith('/parcours')) {
      if (path !== '/parcours') {
        crumbs = [
          { label: 'Parcours types', to: '/parcours', icon: Network },
          { label: 'Détail du parcours' }
        ];
      } else {
        crumbs = [
          { label: 'Parcours types', icon: Network }
        ];
      }
    } else if (path.startsWith('/parametres')) {
      crumbs = [
        { label: 'Paramètres', icon: Settings }
      ];
    } else if (path.startsWith('/audit')) {
      crumbs = [
        { label: "Journal d'audit", icon: FileText }
      ];
    } else if (path.startsWith('/messages')) {
      crumbs = [
        { label: 'Messages reçus', icon: MessageSquare }
      ];
    } else {
      // Fallback générique
      const segments = path.split('/').filter(Boolean);
      crumbs = segments.map((seg, idx) => ({
        label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
        to: idx < segments.length - 1 ? '/' + segments.slice(0, idx + 1).join('/') : undefined
      }));
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 py-1 mb-2 select-none" aria-label="Fil d'Ariane">
      {/* 1. Racine : Accueil avec icône Maison */}
      <Link 
        to="/tableau-de-bord" 
        className="flex items-center gap-1 hover:text-[#f06553] transition-colors"
      >
        <Home className="size-3.5 text-slate-400" />
        <span>Accueil</span>
      </Link>

      {/* 2. Miettes suivantes */}
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        const CrumbIcon = crumb.icon;

        return (
          <React.Fragment key={idx}>
            <span className="text-slate-300 font-light">&gt;</span>

            {isLast || !crumb.to ? (
              <div className="flex items-center gap-1 font-medium text-slate-800">
                {CrumbIcon && <CrumbIcon className="size-3.5 text-slate-500" />}
                <span>{crumb.label}</span>
              </div>
            ) : (
              <Link 
                to={crumb.to} 
                className="flex items-center gap-1 hover:text-[#f06553] transition-colors"
              >
                {CrumbIcon && <CrumbIcon className="size-3.5 text-slate-400" />}
                <span>{crumb.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
