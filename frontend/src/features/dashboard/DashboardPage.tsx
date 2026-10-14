import { useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import CoachDashboardView from './CoachDashboardView';
import AgentDashboardView from './AgentDashboardView';
import DirectionDashboardView from './DirectionDashboardView';

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { roleParam } = useParams<{ roleParam?: string }>();

  const isCoach = user?.role === 'COACH';

  // Déterminer le rôle par défaut selon l'utilisateur connecté
  const userDefaultRole: 'coach' | 'agent' | 'direction' = (() => {
    if (isCoach) return 'coach';
    if (user?.role === 'AGENT') return 'agent';
    return 'direction';
  })();

  // Paramètre dans l'URL (?vue=... ou ?role=...)
  const urlRole = (searchParams.get('vue') || searchParams.get('role') || roleParam)?.toLowerCase();

  const activeRole: 'coach' | 'agent' | 'direction' = (() => {
    if (isCoach) return 'coach'; // Le coach ne peut JAMAIS basculer sur une autre vue
    if (urlRole === 'coach') return 'coach';
    if (urlRole === 'agent') return 'agent';
    if (urlRole === 'direction' || urlRole === 'admin') return 'direction';
    return userDefaultRole;
  })();

  const handleSwitchRole = (role: 'coach' | 'agent' | 'direction') => {
    if (isCoach) return;
    setSearchParams({ vue: role });
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      
      {/* =========================================================================
          BARRE D'EN-TÊTE : EXCLUSIVE POUR COACH OU ONGLETS POUR DIRECTION/ADMIN
         ========================================================================= */}
      {isCoach ? (
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#23c3b1] animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Espace Coach • Session personnelle de suivi
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Connecté en tant que : <strong>{user?.firstName} {user?.lastName}</strong> (Coach d'accompagnement)</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-2">
              Tableau de bord :
            </span>

          {/* Onglet 1 : Coach */}
          <button
            type="button"
            onClick={() => handleSwitchRole('coach')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeRole === 'coach'
                ? 'bg-[#23c3b1] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Coach
          </button>

          {/* Onglet 2 : Agent IML */}
          <button
            type="button"
            onClick={() => handleSwitchRole('agent')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeRole === 'agent'
                ? 'bg-[#38d9a9] text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Agent IML
          </button>

          {/* Onglet 3 : Direction */}
          <button
            type="button"
            onClick={() => handleSwitchRole('direction')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeRole === 'direction'
                ? 'bg-[#1e3347] text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Direction
          </button>
        </div>

        {/* Indicateur contextuel du compte connecté */}
        <div className="text-[11px] text-slate-500 px-2 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Connecté en tant que : <strong>{user?.firstName} {user?.lastName}</strong> ({user?.roleLabel || user?.role})</span>
        </div>
      </div>
      )}

      {/* =========================================================================
          CONTENU DU DASHBOARD RESPECTIF
         ========================================================================= */}
      {activeRole === 'coach' && <CoachDashboardView />}
      {activeRole === 'agent' && <AgentDashboardView />}
      {activeRole === 'direction' && <DirectionDashboardView />}

    </div>
  );
}
