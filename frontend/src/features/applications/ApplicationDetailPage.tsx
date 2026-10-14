import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, User, Building2, Video } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { APP_STATUS_LABELS, APP_STATUS_STYLE } from './ApplicationsPage';
import type { Options } from '../beneficiaries/types';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [agentId, setAgentId] = useState('');

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api<{ application: any }>(`/applications/${id}`),
  });

  const options = useQuery({ queryKey: ['beneficiary-options'], queryFn: () => api<Options>('/beneficiaries/options'), staleTime: 300_000 });

  const app = res?.application;

  // Initialize state once data is loaded
  if (app && status === '' && notes === '') {
    setStatus(app.status);
    setNotes(app.evaluationNotes || '');
    setAgentId(app.assignedAgentId || '');
  }

  const updateMut = useMutation({
    mutationFn: (data: any) => api(`/applications/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      // Show success toast here in real app
    },
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-iml-500" /></div>;
  }

  if (isError || !app) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
        <p className="mb-4">Impossible de charger la candidature.</p>
        <button onClick={() => void refetch()} className="font-medium underline hover:text-red-900">Réessayer</button>
      </div>
    );
  }

  const c = app.applicantData || {};
  const p = app.projectData || {};
  const isReadOnly = app.status === 'ACCEPTEE' || app.status === 'REFUSEE';

  const handleSave = () => {
    updateMut.mutate({ status, evaluationNotes: notes, assignedAgentId: agentId || null });
  };

  const handleConvert = () => {
    // Dans une version complète, ceci ouvrirait le formulaire de création de bénéficiaire pré-rempli
    navigate('/beneficiaires/nouveau', { state: { fromApp: app.id, applicant: c, project: p } });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/candidatures')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="size-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Candidature #{app.seqNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_STYLE[app.status]}`}>
                {APP_STATUS_LABELS[app.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Soumise le {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          {/* Informations Candidat */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <User className="size-5 text-iml-600" />
              <h2 className="text-lg font-semibold text-slate-800">Candidat</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">Nom complet</div>
                <div className="font-medium text-slate-800">{c.firstName} {c.lastName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">E-mail</div>
                <div className="font-medium text-slate-800">{c.email}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Téléphone</div>
                <div className="font-medium text-slate-800">{c.phone || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Ville / Localisation</div>
                <div className="font-medium text-slate-800">{c.city || '—'}</div>
              </div>
            </div>

            {/* Modalité d'entretien souhaitée par le candidat */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Préférence d'entretien :</span>
              {c.interviewPreference === 'VIDEO' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#f06553] border border-orange-200/80">
                  <Video className="size-3.5" /> Visioconférence {c.hasVideoEquipment ? '(Équipement validé)' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <Building2 className="size-3.5" /> Présentiel (Siège IML Digit)
                </span>
              )}
            </div>
          </section>

          {/* Informations Projet */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Building2 className="size-5 text-iml-600" />
              <h2 className="text-lg font-semibold text-slate-800">Projet / Entreprise</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500">Nom du projet</div>
                <div className="font-medium text-slate-800 text-lg">{p.name || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Description</div>
                <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                  {p.description || 'Aucune description fournie.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Secteur d'activité souhaité</div>
                  <div className="font-medium text-slate-800">{p.sector || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Stade actuel</div>
                  <div className="font-medium text-slate-800">{p.stage || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Attentes de l'incubation</div>
                  <div className="font-medium text-slate-800">{p.expectations || '—'}</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Panneau latéral : Évaluation & Décision */}
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              Évaluation
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Agent assigné à l'évaluation</label>
                <select 
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-sm px-3 py-2 border disabled:bg-slate-100"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  disabled={isReadOnly && !can('applications:review')}
                >
                  <option value="">Non assigné</option>
                  {options.data?.agents.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Statut du dossier</label>
                <select 
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-sm px-3 py-2 border disabled:bg-slate-100"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isReadOnly}
                >
                  {Object.entries(APP_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes internes (visibles uniquement par l'équipe)</label>
                <textarea 
                  rows={6}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-sm px-3 py-2 border disabled:bg-slate-100"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Évaluation du profil, motivation, solidité du projet..."
                  disabled={isReadOnly && !can('applications:review')}
                />
              </div>

              {can('applications:review') && (
                <button 
                  onClick={handleSave} 
                  disabled={updateMut.isPending}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-iml-700 text-white rounded-lg hover:bg-iml-900 transition-colors disabled:opacity-50"
                >
                  {updateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Enregistrer l'évaluation
                </button>
              )}

              {app.status === 'ACCEPTEE' && can('beneficiaries:write') && !app.beneficiaryId && (
                <div className="pt-4 border-t border-slate-200 mt-4">
                  <div className="bg-emerald-50 text-emerald-800 text-sm p-3 rounded-lg mb-3">
                    Candidature acceptée ! Vous pouvez maintenant créer le dossier bénéficiaire officiel.
                  </div>
                  <button 
                    onClick={handleConvert}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Convertir en Bénéficiaire
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
