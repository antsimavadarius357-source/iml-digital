import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Search, 
  X, 
  Calendar, 
  Mail, 
  Building2, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

export const APP_STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Nouvelle',
  EN_COURS_EXAMEN: 'En cours d\'instruction',
  ACCEPTEE: 'Admise (Comité)',
  REFUSEE: 'Refusée',
};

export const APP_STATUS_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  BROUILLON: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  SOUMISE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  EN_COURS_EXAMEN: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  ACCEPTEE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  REFUSEE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

const STRUCTURE_LABELS: Record<string, { label: string; style: string }> = {
  PORTEUR_IDEE: { label: "Porteur d'idée", style: "bg-blue-50 text-blue-700 border-blue-200" },
  STARTUP: { label: "Startup", style: "bg-purple-50 text-purple-700 border-purple-200" },
  PME: { label: "PME", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ORGANISATION: { label: "Organisation", style: "bg-amber-50 text-amber-700 border-amber-200" },
};

interface ApplicationRow {
  id: string;
  seqNumber: number;
  status: string;
  applicantData: any;
  projectData: any;
  submittedAt: string | null;
  createdAt: string;
  assignedAgent: { id: string; firstName: string; lastName: string } | null;
}

interface Page { 
  items: ApplicationRow[]; 
  total: number; 
  page: number; 
  pageSize: number 
}

function formatRelativeDate(dateString?: string | null) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Aujourd'hui, ${timeStr}`;
    if (isYesterday) return `Hier, ${timeStr}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [f, setF] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const set = (k: keyof typeof f, v: string) => { setF((s) => ({ ...s, [k]: v })); setPage(1); };

  const params = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
  const qs = params.toString();

  const list = useQuery({
    queryKey: ['applications', qs, page],
    queryFn: () => api<Page>(`/applications?${qs}&page=${page}`),
    placeholderData: (p) => p,
  });

  // Query to get general stats
  const allList = useQuery({
    queryKey: ['applications-all-stats'],
    queryFn: () => api<Page>(`/applications?pageSize=100`),
    staleTime: 60_000,
  });

  const data = list.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // Compute status counts for KPI tabs
  const stats = useMemo(() => {
    const items = allList.data?.items || [];
    return {
      total: allList.data?.total ?? 0,
      soumise: items.filter(a => a.status === 'SOUMISE').length,
      examen: items.filter(a => a.status === 'EN_COURS_EXAMEN').length,
      acceptee: items.filter(a => a.status === 'ACCEPTEE').length,
      refusee: items.filter(a => a.status === 'REFUSEE').length,
    };
  }, [allList.data]);

  return (
    <div className="space-y-6 max-w-7xl pb-32 pr-1 sm:pr-8">
      
      {/* =========================================================================
          1. EN-TÊTE DE SECTION & STATISTIQUES RAPIDES (KPIs)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Candidatures reçues
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#23c3b1]/15 text-[#137469] border border-[#23c3b1]/30">
              {data?.total ?? 0} dossiers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {user?.role === 'COACH'
              ? 'Consultez les dossiers de candidatures et prenez connaissance des projets soumis.'
              : 'Examen, évaluation et sélection des projets pour intégration aux parcours d\'incubation.'}
          </p>
        </div>

        {/* Bouton d'action ou lien rapide (réservé agent / coordination) */}
        {user?.role !== 'COACH' && (
          <div className="flex items-center gap-2">
            <Link
              to="/candidatures/nouvelle"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="size-3.5 text-[#23c3b1]" />
              <span>Formulaire candidat</span>
            </Link>
          </div>
        )}
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total */}
        <div 
          onClick={() => set('status', '')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${f.status === '' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={f.status === '' ? 'text-slate-300' : 'text-slate-500'}>Toutes</span>
            <Layers className={`size-3.5 ${f.status === '' ? 'text-[#23c3b1]' : 'text-slate-400'}`} />
          </div>
          <div className="text-xl font-black">{stats.total}</div>
        </div>

        {/* Nouvelles */}
        <div 
          onClick={() => set('status', 'SOUMISE')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${f.status === 'SOUMISE' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-800 border-slate-200/80 hover:border-blue-200'}`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={f.status === 'SOUMISE' ? 'text-blue-100' : 'text-slate-500'}>Nouvelles</span>
            <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400" style={{ color: f.status === 'SOUMISE' ? '#ffffff' : undefined }}>
            {stats.soumise}
          </div>
        </div>

        {/* En examen */}
        <div 
          onClick={() => set('status', 'EN_COURS_EXAMEN')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${f.status === 'EN_COURS_EXAMEN' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-800 border-slate-200/80 hover:border-amber-200'}`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={f.status === 'EN_COURS_EXAMEN' ? 'text-amber-100' : 'text-slate-500'}>En examen</span>
            <Clock className={`size-3.5 ${f.status === 'EN_COURS_EXAMEN' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <div className="text-xl font-black text-amber-600" style={{ color: f.status === 'EN_COURS_EXAMEN' ? '#ffffff' : undefined }}>
            {stats.examen}
          </div>
        </div>

        {/* Acceptées */}
        <div 
          onClick={() => set('status', 'ACCEPTEE')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${f.status === 'ACCEPTEE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-800 border-slate-200/80 hover:border-emerald-200'}`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={f.status === 'ACCEPTEE' ? 'text-emerald-100' : 'text-slate-500'}>Admises (Comité)</span>
            <CheckCircle className={`size-3.5 ${f.status === 'ACCEPTEE' ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <div className="text-xl font-black text-emerald-600" style={{ color: f.status === 'ACCEPTEE' ? '#ffffff' : undefined }}>
            {stats.acceptee}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BARRE D'OUTILS : Recherche & Filtres rapides
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Champ de recherche */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            aria-label="Rechercher une candidature" 
            placeholder="Rechercher un candidat, un projet ou un e-mail..." 
            value={f.search}
            onChange={(e) => set('search', e.target.value)} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white pl-10 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#23c3b1]/30 focus:border-[#23c3b1] transition-all" 
          />
          {f.search && (
            <button 
              type="button"
              onClick={() => set('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filtre par statut & Réinitialisation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => set('status', '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                f.status === '' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            {Object.entries(APP_STATUS_LABELS).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => set('status', k)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hidden md:inline-block ${
                  f.status === k 
                    ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {(f.search || f.status) && (
            <button
              type="button"
              onClick={() => { setF({ search: '', status: '' }); setPage(1); }}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="size-3" />
              <span>Effacer</span>
            </button>
          )}
        </div>

      </div>

      {/* Message d'erreur s'il y a lieu */}
      {list.isError && (
        <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 flex items-center justify-between">
          <span>Impossible de charger la liste des candidatures.</span>
          <button className="underline font-bold hover:text-rose-900 cursor-pointer" onClick={() => void list.refetch()}>
            Réessayer
          </button>
        </div>
      )}

      {/* =========================================================================
          3. TABLEAU REDESSINÉ : CANDIDATURES
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* En-tête du tableau */}
            <thead>
              <tr className="border-b border-slate-200/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-2.5 px-3 w-16 text-center">N° Dossier</th>
                <th className="py-2.5 px-3">Candidat</th>
                <th className="py-2.5 px-3">Projet & Structure</th>
                <th className="py-2.5 px-3 hidden md:table-cell">Soumis le</th>
                <th className="py-2.5 px-3 hidden xl:table-cell">Conseiller assigné</th>
                <th className="py-2.5 px-2 text-center">Statut</th>
                <th className="py-2.5 px-3 text-right sticky right-0 bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10">Action</th>
              </tr>
            </thead>

            {/* Corps du tableau */}
            <tbody className="divide-y divide-slate-100 text-xs">
              
              {/* État de chargement */}
              {list.isLoading && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-[#23c3b1]" />
                      <span className="font-medium">Chargement des candidatures...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* État vide */}
              {!list.isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <FileText className="size-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Aucune candidature trouvée</span>
                      <p className="text-xs text-slate-400">
                        {f.search || f.status 
                          ? "Aucun résultat ne correspond à vos filtres de recherche."
                          : "Aucune candidature n'a encore été soumise."}
                      </p>
                      {(f.search || f.status) && (
                        <button
                          type="button"
                          onClick={() => { setF({ search: '', status: '' }); setPage(1); }}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Lignes du tableau */}
              {!list.isLoading && data?.items.map((app) => {
                const c = app.applicantData || {};
                const p = app.projectData || {};
                const name = `${c.firstName || ''} ${c.lastName || 'Candidat inconnu'}`.trim();
                const projectName = c.companyName || p.title || p.name || 'Projet sans nom';
                const structureType = c.structureType || 'PORTEUR_IDEE';
                const statusStyle = APP_STATUS_STYLE[app.status] || APP_STATUS_STYLE.BROUILLON;

                return (
                  <tr 
                    key={app.id} 
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  >
                    
                    {/* N° Dossier */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <Link 
                        to={`/candidatures/${app.id}`}
                        className="inline-block font-mono text-xs font-bold text-slate-700 bg-slate-100/90 group-hover:bg-[#23c3b1]/15 group-hover:text-[#116d63] px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                      >
                        #{String(app.seqNumber).padStart(4, '0')}
                      </Link>
                    </td>

                    {/* Candidat (Avatar + Nom + Contact) */}
                    <td className="py-2.5 px-3">
                      <Link to={`/candidatures/${app.id}`} className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs group-hover:from-[#23c3b1] group-hover:to-[#178578] transition-colors">
                          {c.firstName?.[0] || 'C'}{c.lastName?.[0] || 'D'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-[#116d63] transition-colors truncate max-w-[150px]">
                            {name}
                          </div>
                          {c.email && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="size-2.5 shrink-0" />
                              <span className="truncate max-w-[130px]">{c.email}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>

                    {/* Projet & Structure */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{projectName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full border ${STRUCTURE_LABELS[structureType]?.style || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {STRUCTURE_LABELS[structureType]?.label || "Structure"}
                        </span>
                        {p.sector && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                            • {p.sector}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Soumis le */}
                    <td className="py-2.5 px-3 hidden md:table-cell text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                        <Calendar className="size-3 text-slate-400" />
                        <span>{formatRelativeDate(app.submittedAt || app.createdAt)}</span>
                      </div>
                    </td>

                    {/* Agent assigné */}
                    <td className="py-2.5 px-3 hidden xl:table-cell whitespace-nowrap">
                      {app.assignedAgent ? (
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                          <UserCheck className="size-3 text-emerald-600" />
                          <span className="font-medium truncate max-w-[140px]">{app.assignedAgent.firstName} {app.assignedAgent.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Non assigné</span>
                      )}
                    </td>

                    {/* Statut avec pillule moderne */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border shadow-2xs ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                        {APP_STATUS_LABELS[app.status]}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2 px-3 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] z-10">
                      <Link
                        to={`/candidatures/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#23c3b1] hover:bg-[#1fa99a] text-white font-bold text-xs transition-all shadow-xs hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <span>Examiner</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </td>

                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>

        {/* =======================================================================
            4. PIED DE TABLEAU : Pagination moderne
           ======================================================================= */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Affichage de <span className="font-bold text-slate-800">{data?.items.length ?? 0}</span> sur <span className="font-bold text-slate-800">{data?.total ?? 0}</span> candidature(s)
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              Précédent
            </button>
            
            <span className="px-3 py-1 font-bold text-slate-700 bg-white rounded-lg border border-slate-200 shadow-2xs">
              Page {page} / {pages}
            </span>

            <button 
              disabled={page >= pages} 
              onClick={() => setPage((p) => p + 1)} 
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
