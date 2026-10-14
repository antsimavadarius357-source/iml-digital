import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { api } from '../../lib/api';

export const APP_STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE: 'Nouvelle',
  EN_COURS_EXAMEN: 'En cours d\'examen',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
};

export const APP_STATUS_STYLE: Record<string, string> = {
  BROUILLON: 'bg-slate-100 text-slate-600',
  SOUMISE: 'bg-blue-50 text-blue-700',
  EN_COURS_EXAMEN: 'bg-amber-50 text-amber-700',
  ACCEPTEE: 'bg-emerald-50 text-emerald-700',
  REFUSEE: 'bg-red-50 text-red-700',
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

interface Page { items: ApplicationRow[]; total: number; page: number; pageSize: number }

const sel = 'rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-iml-400';

export default function ApplicationsPage() {
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

  const data = list.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Rechercher une candidature" placeholder="Nom du candidat ou projet…" value={f.search}
            onChange={(e) => set('search', e.target.value)} className={`${sel} w-full pl-9`} />
        </div>
        <select aria-label="Statut" className={sel} value={f.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(APP_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {list.isError && <p role="alert" className="rounded-lg bg-red-50 text-red-700 text-sm p-3">Impossible de charger la liste. <button className="underline" onClick={() => void list.refetch()}>Réessayer</button></p>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">N°</th>
              <th className="p-3">Candidat</th>
              <th className="p-3">Projet / Entreprise</th>
              <th className="p-3 hidden md:table-cell">Soumis le</th>
              <th className="p-3 hidden lg:table-cell">Agent assigné</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && <tr><td colSpan={6} className="p-6 text-center text-slate-500"><Loader2 className="size-4 animate-spin inline" /> Chargement…</td></tr>}
            {data?.items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune candidature ne correspond à votre recherche.</td></tr>}
            {data?.items.map((app) => {
              const name = `${app.applicantData?.firstName || ''} ${app.applicantData?.lastName || 'Inconnu'}`.trim();
              const projectName = app.projectData?.name || 'Projet sans nom';
              return (
                <tr key={app.id} className="border-t border-slate-100 hover:bg-iml-50/60">
                  <td className="p-3 whitespace-nowrap"><Link className="font-medium text-iml-700 hover:underline" to={`/candidatures/${app.id}`}>#{app.seqNumber}</Link></td>
                  <td className="p-3 font-medium text-slate-800">{name}</td>
                  <td className="p-3 text-slate-600">{projectName}</td>
                  <td className="p-3 hidden md:table-cell text-slate-500">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="p-3 hidden lg:table-cell">{app.assignedAgent ? `${app.assignedAgent.firstName} ${app.assignedAgent.lastName}` : '—'}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${APP_STATUS_STYLE[app.status]}`}>{APP_STATUS_LABELS[app.status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{data?.total ?? 0} candidature(s)</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-md border border-slate-300 disabled:opacity-40">Précédent</button>
          <span>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-md border border-slate-300 disabled:opacity-40">Suivant</button>
        </div>
      </div>
    </div>
  );
}
