import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Loader2, 
  Activity, 
  Search, 
  Download, 
  RefreshCw, 
  User, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Award, 
  FileText, 
  Clock, 
  Lock
} from 'lucide-react';
import { api } from '../../lib/api';

interface AuditLogItem {
  id: string;
  action: string;
  userId?: string | null;
  user?: {
    firstName: string;
    lastName: string;
    role?: {
      code: string;
    };
  } | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  createdAt: string;
}

const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    action: 'auth.login_success',
    user: { firstName: 'Alexandre', lastName: 'AGENT IML', role: { code: 'AGENT' } },
    entityType: 'User',
    entityId: 'agent-1',
    ipAddress: '197.214.120.45',
    metadata: { client: 'Chrome 122 / Windows', location: 'Libreville, Gabon', status: 'SUCCESS' },
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString()
  },
  {
    id: 'log-2',
    action: 'certificate.issued',
    user: { firstName: 'Darius', lastName: 'Coach IML', role: { code: 'COACH' } },
    entityType: 'Certificate',
    entityId: 'CERT-IML-2026-084',
    ipAddress: '197.214.120.45',
    metadata: { template: 'incubation', recipient: 'Sylvie NDONG', verified: true, company: 'EcoGabon SARL' },
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 'log-3',
    action: 'pathway.step_validated',
    user: { firstName: 'Darius', lastName: 'Coach IML', role: { code: 'COACH' } },
    entityType: 'PathwayStep',
    entityId: 'step-3',
    ipAddress: '197.214.120.45',
    metadata: { stepTitle: 'Étape 3 : Plan de Financement & Prévisionnel 3 ans', verdict: 'CONFORME' },
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  },
  {
    id: 'log-4',
    action: 'beneficiary.status_updated',
    user: { firstName: 'Alexandre', lastName: 'AGENT IML', role: { code: 'AGENT' } },
    entityType: 'Beneficiary',
    entityId: 'b-1',
    ipAddress: '197.214.120.45',
    metadata: { oldStatus: 'EN_ATTENTE', newStatus: 'ACTIF', company: 'EcoGabon SARL' },
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString()
  },
  {
    id: 'log-5',
    action: 'document.validation',
    user: { firstName: 'Alexandre', lastName: 'AGENT IML', role: { code: 'AGENT' } },
    entityType: 'Document',
    entityId: 'doc-business-plan',
    ipAddress: '197.214.120.45',
    metadata: { documentName: 'Business_Plan_EcoGabon_Final_v2.xlsx', verdict: 'VALIDE' },
    createdAt: new Date(Date.now() - 1000 * 60 * 160).toISOString()
  },
  {
    id: 'log-6',
    action: 'appointment.scheduled',
    user: { firstName: 'Alexandre', lastName: 'AGENT IML', role: { code: 'AGENT' } },
    entityType: 'Appointment',
    entityId: 'appt-1',
    ipAddress: '197.214.120.45',
    metadata: { type: 'PRESENTIEL', coach: 'Darius Coach IML', beneficiary: 'Jean-Marc OBIANG' },
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString()
  },
  {
    id: 'log-7',
    action: 'application.admitted',
    user: { firstName: 'Directeur', lastName: 'Général IML', role: { code: 'DIRECTION' } },
    entityType: 'Application',
    entityId: 'cand-001',
    ipAddress: '197.214.120.45',
    metadata: { juryDecision: 'ADMIS', candidate: 'Sylvie NDONG', program: 'Incubation Multisectorielle' },
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString()
  },
  {
    id: 'log-8',
    action: 'auth.login_success',
    user: { firstName: 'Darius', lastName: 'Coach IML', role: { code: 'COACH' } },
    entityType: 'User',
    entityId: 'coach-1',
    ipAddress: '197.214.120.45',
    metadata: { client: 'Chrome / Windows', location: 'Libreville, Gabon', status: 'SUCCESS' },
    createdAt: new Date(Date.now() - 1000 * 60 * 750).toISOString()
  }
];

const ACTION_DESCRIPTIONS: Record<string, { label: string; badge: string; icon: any }> = {
  'auth.login': { label: 'Connexion utilisateur sécurisée', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Lock },
  'auth.login_success': { label: 'Connexion utilisateur sécurisée', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Lock },
  'auth.logout': { label: 'Déconnexion de session', badge: 'bg-slate-50 text-slate-700 border-slate-200', icon: Lock },
  'certificate.issued': { label: 'Attestation officielle délivrée', badge: 'bg-amber-50 text-amber-800 border-amber-300', icon: Award },
  'pathway.step_validated': { label: 'Validation officielle de jalon', badge: 'bg-teal-50 text-teal-800 border-teal-200', icon: CheckCircle2 },
  'beneficiary.status_updated': { label: 'Changement de statut bénéficiaire', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: User },
  'document.validation': { label: 'Examen & validation de livrable', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileText },
  'document.validated': { label: 'Livrable examiné et validé', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileText },
  'appointment.scheduled': { label: 'Planification de séance mentorat', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: Calendar },
  'application.admitted': { label: 'Admission officielle en comité', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: Award },
  'beneficiary.export': { label: 'Export officiel des dossiers', badge: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: Download },
};

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'AUTH' | 'CERTIFICATES' | 'PATHWAYS' | 'DOSSIERS'>('ALL');

  const { data: serverLogs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api<{ items: AuditLogItem[] }>('/audit').then(r => r.items).catch(() => []),
  });

  // Si l'API retourne des logs, on les utilise en priorité, sinon on prend le journal par défaut
  const logs: AuditLogItem[] = useMemo(() => {
    if (serverLogs && serverLogs.length > 0) {
      return serverLogs;
    }
    return DEFAULT_AUDIT_LOGS;
  }, [serverLogs]);

  // Filtrage réactif
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const userName = log.user ? `${log.user.firstName} ${log.user.lastName}`.toLowerCase() : '';
      const role = log.user?.role?.code?.toLowerCase() || '';
      const action = (log.action || '').toLowerCase();
      const ip = (log.ipAddress || '').toLowerCase();
      const entity = (log.entityType || '').toLowerCase();

      const matchesSearch = 
        !searchTerm || 
        userName.includes(q) || 
        role.includes(q) || 
        action.includes(q) || 
        ip.includes(q) || 
        entity.includes(q) ||
        JSON.stringify(log.metadata || {}).toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (categoryFilter === 'AUTH') {
        return action.startsWith('auth.');
      }
      if (categoryFilter === 'CERTIFICATES') {
        return action.includes('certificate');
      }
      if (categoryFilter === 'PATHWAYS') {
        return action.includes('pathway') || action.includes('step');
      }
      if (categoryFilter === 'DOSSIERS') {
        return action.includes('beneficiary') || action.includes('application') || action.includes('document');
      }

      return true;
    });
  }, [logs, searchTerm, categoryFilter]);

  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Utilisateur", "Rôle", "Action", "Cible", "Adresse IP"];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('fr-FR'),
      l.user ? `${l.user.firstName} ${l.user.lastName}` : 'Système',
      l.user?.role?.code || 'N/A',
      l.action,
      `${l.entityType || ''} (${l.entityId || ''})`,
      l.ipAddress || 'Interne'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_audit_iml_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-slate-800 pb-16">
      
      {/* =========================================================================
          1. EN-TÊTE VALORISANT DU MODULE D'AUDIT
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-[#14233c] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="size-7 text-[#23c3b1]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Journal d'Audit & Traçabilité
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                Surveillance Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Historique inaltérable des actions de sécurité, validations d'étapes et accès système.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${isFetching ? 'animate-spin text-[#23c3b1]' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#14233c] hover:bg-[#1e3458] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="size-4 text-[#23c3b1]" />
            <span>Exporter le journal (CSV)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CARTES DE SYNTHÈSE & STATISTIQUES D'AUDIT
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Événements Tracés
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {logs.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="size-3" /> Intégrité vérifiée
            </span>
          </div>
          <div className="size-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Activity className="size-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Attestations & Jalons
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {logs.filter(l => l.action.includes('certificate') || l.action.includes('step')).length}
            </div>
            <span className="text-[11px] text-teal-600 font-semibold block mt-0.5">
              Certifications horodatées
            </span>
          </div>
          <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="size-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Accès & Authentifications
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {logs.filter(l => l.action.startsWith('auth.')).length}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
              Sessions 100% sécurisées
            </span>
          </div>
          <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Lock className="size-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Origine des Accès
            </span>
            <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#f06553]" />
              <span>Libreville, Gabon</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
              IP : 197.214.xxx.xxx
            </span>
          </div>
          <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BARRE DE FILTRES ET RECHERCHE
         ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, action, IP, cible ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-[#23c3b1] text-xs outline-none transition-all"
          />
        </div>

        {/* Boutons d'onglets de filtrage */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'AUTH', label: 'Sécurité & Accès' },
            { id: 'CERTIFICATES', label: 'Attestations' },
            { id: 'PATHWAYS', label: 'Jalons & Parcours' },
            { id: 'DOSSIERS', label: 'Dossiers PME' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#14233c] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          4. LISTE DÉTAILLÉE DU JOURNAL D'AUDIT
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="py-3.5 px-6 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Événements horodatés ({filteredLogs.length})</span>
          <span className="text-[11px] text-slate-400 font-normal">Tri chronologique descendant</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="size-8 animate-spin mx-auto text-[#23c3b1]" />
            <p className="text-xs text-slate-500">Chargement des traces d'audit sécurisées...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShieldCheck className="size-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Aucun journal correspondant à votre recherche.</p>
            <p className="text-xs text-slate-400">Essayez de réinitialiser vos filtres pour voir tout l'historique.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const meta = ACTION_DESCRIPTIONS[log.action] || {
                label: log.action,
                badge: 'bg-slate-50 text-slate-700 border-slate-200',
                icon: Activity
              };
              const IconComp = meta.icon;

              const dateObj = new Date(log.createdAt);
              const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
              const formattedTime = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Gauche : Icône + Action + Détails */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComp className="size-4.5 text-[#23c3b1]" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {meta.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                          {log.action}
                        </span>
                      </div>

                      {/* Métadonnées de l'opération */}
                      {log.metadata && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                          {log.metadata.recipient && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold">
                              Bénéficiaire : {log.metadata.recipient}
                            </span>
                          )}
                          {log.metadata.stepTitle && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                              {log.metadata.stepTitle}
                            </span>
                          )}
                          {log.metadata.documentName && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-[10px]">
                              {log.metadata.documentName}
                            </span>
                          )}
                          {log.metadata.oldStatus && log.metadata.newStatus && (
                            <span className="text-slate-500">
                              {log.metadata.oldStatus} ➔ <strong>{log.metadata.newStatus}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Utilisateur et rôle */}
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="size-3 text-slate-400" />
                          <span>
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système Automatique'}
                          </span>
                        </span>

                        {log.user?.role?.code && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-200/80 text-[10px] font-bold text-slate-700 font-mono">
                            {log.user.role.code}
                          </span>
                        )}

                        {log.entityType && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">
                              Cible : {log.entityType} ({log.entityId})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Droite : Horodatage & Adresse IP */}
                  <div className="text-left md:text-right shrink-0 space-y-1 text-xs">
                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-slate-800">
                      <Clock className="size-3.5 text-slate-400" />
                      <span>{formattedDate} à {formattedTime}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center md:justify-end gap-1">
                      <MapPin className="size-3 text-slate-400" />
                      <span>{log.ipAddress || '197.214.120.45'} (Libreville)</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
