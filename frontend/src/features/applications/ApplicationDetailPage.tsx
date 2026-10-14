import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  User, 
  Building2, 
  Video, 
  Target, 
  Calendar, 
  CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { APP_STATUS_LABELS, APP_STATUS_STYLE } from './ApplicationsPage';
import type { Options } from '../beneficiaries/types';
import MaturityDiagnosticModal from './MaturityDiagnosticModal';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';

const STRUCTURE_LABELS: Record<string, { label: string; style: string }> = {
  PORTEUR_IDEE: { label: "Porteur d'idée / Créateur", style: "bg-blue-50 text-blue-700 border-blue-200" },
  STARTUP: { label: "Startup innovante", style: "bg-purple-50 text-purple-700 border-purple-200" },
  PME: { label: "TPE / PME existante", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ORGANISATION: { label: "Organisation / Coopérative", style: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);

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
  const structureType = c.structureType || 'PORTEUR_IDEE';

  const handleSave = () => {
    updateMut.mutate({ status, evaluationNotes: notes, assignedAgentId: agentId || null });
  };

  const handleConvert = () => {
    navigate('/beneficiaires/nouveau', { state: { fromApp: app.seqNumber || app.id, applicant: c, project: p } });
  };

  const handleDiagnosticSave = (summaryText: string, _score: number) => {
    const updatedNotes = notes ? `${notes}\n\n${summaryText}` : summaryText;
    setNotes(updatedNotes);
    const newStatus = status === 'SOUMISE' ? 'EN_COURS_EXAMEN' : status;
    setStatus(newStatus);
    updateMut.mutate({ status: newStatus, evaluationNotes: updatedNotes, assignedAgentId: agentId || null });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      
      {/* Barre de navigation et actions rapides */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/candidatures')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="size-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">
                Candidature #{app.seqNumber}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_STYLE[app.status]}`}>
                {APP_STATUS_LABELS[app.status]}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STRUCTURE_LABELS[structureType]?.style || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {STRUCTURE_LABELS[structureType]?.label || "Structure"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Soumise le {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
              {c.companyName && <span> • <strong>{c.companyName}</strong></span>}
            </p>
          </div>
        </div>

        {/* Boutons d'action opérationnels */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Target className="size-3.5 text-[#23c3b1]" />
            <span>Diagnostic Flash (Radar 5 axes)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAppointmentOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="size-3.5" />
            <span>Planifier l'entretien</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          
          {/* Informations Dirigeant / Représentant */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <User className="size-5 text-iml-600" />
              <h2 className="text-lg font-semibold text-slate-800">Dirigeant / Représentant</h2>
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
                <div className="font-medium text-slate-800">{c.city || 'Libreville'}</div>
              </div>
            </div>

            {/* Modalité d'entretien souhaitée par le candidat */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Préférence d'entretien déclarée :</span>
              {c.interviewPreference === 'VIDEO' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#f06553] border border-orange-200/80">
                  <Video className="size-3.5" /> Visioconférence {c.hasVideoEquipment ? '(Équipement validé)' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <Building2 className="size-3.5" /> Présentiel (Espace PME, Quartier B2)
                </span>
              )}
            </div>
          </section>

          {/* Informations Structure / Entreprise / Projet */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-iml-600" />
                <h2 className="text-lg font-semibold text-slate-800">
                  {structureType === 'PME' ? "Entreprise (PME)" : structureType === 'STARTUP' ? "Startup" : "Projet d'Entreprise"}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">
                {c.legalStatus || 'Statut non spécifié'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500">Dénomination / Nom</div>
                <div className="font-bold text-slate-900 text-lg">{c.companyName || p.title || p.name || '—'}</div>
              </div>

              {/* Attributs spécifiques PME / Entreprise si existants */}
              {(c.rccm || c.nif || c.companySize || c.annualRevenue || c.creationYear) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  {c.rccm && (
                    <div>
                      <span className="text-slate-400 block font-medium">N° RCCM</span>
                      <span className="font-bold text-slate-800">{c.rccm}</span>
                    </div>
                  )}
                  {c.nif && (
                    <div>
                      <span className="text-slate-400 block font-medium">NIF</span>
                      <span className="font-bold text-slate-800">{c.nif}</span>
                    </div>
                  )}
                  {c.companySize && (
                    <div>
                      <span className="text-slate-400 block font-medium">Taille de l'effectif</span>
                      <span className="font-bold text-slate-800">{c.companySize}</span>
                    </div>
                  )}
                  {c.annualRevenue && (
                    <div>
                      <span className="text-slate-400 block font-medium">Tranche de CA</span>
                      <span className="font-bold text-slate-800">{c.annualRevenue}</span>
                    </div>
                  )}
                  {c.creationYear && (
                    <div>
                      <span className="text-slate-400 block font-medium">Année de création</span>
                      <span className="font-bold text-slate-800">{c.creationYear}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="text-xs text-slate-500">Description des activités & proposition de valeur</div>
                <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3.5 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                  {p.description || 'Aucune description fournie.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Secteur d'activité</div>
                  <div className="font-medium text-slate-800">{p.sector || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Stade actuel</div>
                  <div className="font-medium text-slate-800">{p.stage || '—'}</div>
                </div>
              </div>

              {/* Besoins déclarés */}
              {p.needs && p.needs.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs text-slate-500 mb-2">Besoins prioritaires déclarés :</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.needs.map((need: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#f06553] text-xs font-semibold border border-orange-100">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Panneau latéral : Évaluation & Décision */}
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              Instruction du Dossier
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Agent / Conseiller assigné</label>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes internes & Diagnostic</label>
                <textarea 
                  rows={8}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-xs px-3 py-2 border disabled:bg-slate-100 font-mono"
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
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 text-xs font-bold"
                >
                  {updateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Enregistrer l'évaluation
                </button>
              )}

              {app.status === 'ACCEPTEE' && can('beneficiaries:write') && !app.beneficiaryId && (
                <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg leading-relaxed">
                    Candidature admise ! Vous pouvez maintenant créer le dossier bénéficiaire officiel avec tous les champs pré-remplis.
                  </div>
                  <button 
                    onClick={handleConvert}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-bold shadow-sm"
                  >
                    <CheckCircle2 className="size-4" />
                    Convertir en Bénéficiaire Officiel
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modale de Diagnostic Flash de Maturité (Radar 5 axes) */}
      <MaturityDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        candidateName={`${c.firstName} ${c.lastName}`}
        structureName={c.companyName || p.title || 'Structure'}
        structureType={structureType}
        onSaveDiagnostic={handleDiagnosticSave}
      />

      {/* Modale de Planification de RDV pré-remplie */}
      <CreateAppointmentWizardModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        defaultCandidate={{
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.companyName || 'Candidat',
          email: c.email,
          phone: c.phone,
          mode: c.interviewPreference === 'VIDEO' ? 'video' : 'in_person'
        }}
        onSuccess={() => {
          setIsAppointmentOpen(false);
          setStatus('EN_COURS_EXAMEN');
          updateMut.mutate({ status: 'EN_COURS_EXAMEN', evaluationNotes: notes ? `${notes}\n[RDV Planifié avec le candidat]` : '[RDV Planifié avec le candidat]' });
        }}
      />

    </div>
  );
}
