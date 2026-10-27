import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  User, 
  Building2, 
  Video, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Copy,
  MapPin,
  MessageSquare,
  Mail,
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  Upload,
  Trash2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { APP_STATUS_LABELS, APP_STATUS_STYLE } from './ApplicationsPage';
import type { Options } from '../beneficiaries/types';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';

const STRUCTURE_LABELS: Record<string, { label: string; style: string }> = {
  PORTEUR_IDEE: { label: "Porteur d'idée / Créateur", style: "bg-blue-50 text-blue-700 border-blue-200" },
  STARTUP: { label: "Startup innovante", style: "bg-purple-50 text-purple-700 border-purple-200" },
  PME: { label: "TPE / PME existante", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ORGANISATION: { label: "Organisation / Coopérative", style: "bg-amber-50 text-amber-700 border-amber-200" },
};

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 Ko';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can, user } = useAuth();
  
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api<{ application: any }>(`/applications/${id}`),
  });

  const options = useQuery({ queryKey: ['beneficiary-options'], queryFn: () => api<Options>('/beneficiaries/options'), staleTime: 300_000 });

  const app = res?.application;

  useEffect(() => {
    if (id) {
      try {
        const raw = localStorage.getItem('iml_read_application_alerts') || '[]';
        const list: string[] = JSON.parse(raw);
        if (!list.includes(id)) {
          list.push(id);
          localStorage.setItem('iml_read_application_alerts', JSON.stringify(list));
        }
      } catch {}
    }
  }, [id]);

  // Initialiser les valeurs du formulaire une seule fois au chargement
  useEffect(() => {
    if (app && !isInitialized) {
      setStatus(app.status || 'SOUMISE');
      setNotes(app.evaluationNotes || '');
      setAgentId(app.assignedAgentId || '');
      setIsInitialized(true);
    }
  }, [app, isInitialized]);

  const updateMut = useMutation({
    mutationFn: (data: any) => api(`/applications/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (data: any) => {
      setSaveSuccess(true);
      setSaveError('');
      // Mettre à jour l'état local avec les données enregistrées
      if (data?.application) {
        setStatus(data.application.status || status);
        setNotes(data.application.evaluationNotes || notes);
      }
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err: any) => {
      setSaveSuccess(false);
      setSaveError(err?.message || "Erreur lors de l'enregistrement de l'évaluation.");
      setTimeout(() => setSaveError(''), 6000);
    }
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

  const uploadedDocs: any[] = 
    (Array.isArray(p.documents) && p.documents) || 
    (Array.isArray(c.documents) && c.documents) || 
    (Array.isArray((app as any).documents) && (app as any).documents) || 
    [];

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingDoc(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/v1/applications/public/attachments', {
        method: 'POST',
        headers: { 'X-Requested-With': 'iml-digital' },
        body: formData,
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => null);
        throw new Error(errData?.error?.message || 'Échec du téléversement');
      }
      const data = await uploadRes.json();
      if (data?.attachment) {
        const lower = file.name.toLowerCase();
        let cat = 'AUTRE';
        if (lower.includes('business') || lower.includes('plan') || lower.includes('bp')) cat = 'BUSINESS_PLAN';
        else if (lower.includes('pitch') || lower.includes('deck') || lower.includes('presentation')) cat = 'PITCH_DECK';
        else if (lower.includes('rccm') || lower.includes('statut') || lower.includes('kbis') || lower.includes('nif')) cat = 'JURIDIQUE';
        else if (lower.includes('cni') || lower.includes('passeport') || lower.includes('identite')) cat = 'IDENTITE';
        else if (lower.includes('devis') || lower.includes('financier') || lower.includes('bilan')) cat = 'FINANCIER';

        const newDoc = {
          fileId: data.attachment.fileId,
          originalName: data.attachment.originalName,
          size: data.attachment.size,
          mimeType: data.attachment.mimeType,
          category: cat,
        };
        const currentDocs = Array.isArray(p.documents) ? [...p.documents] : [];
        currentDocs.push(newDoc);
        const updatedProjectData = { ...p, documents: currentDocs };
        await updateMut.mutateAsync({ projectData: updatedProjectData });
      }
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du téléversement du document.');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (indexToDelete: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce document du dossier ?')) return;
    const currentDocs = Array.isArray(p.documents) ? [...p.documents] : [];
    const updatedDocs = currentDocs.filter((_, i) => i !== indexToDelete);
    const updatedProjectData = { ...p, documents: updatedDocs };
    await updateMut.mutateAsync({ projectData: updatedProjectData });
  };


  const handleCopyEmail = (emailText: string) => {
    if (!emailText) return;
    navigator.clipboard?.writeText(emailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-2 sm:px-4 space-y-6">
      
      {/* =========================================================================
          1. EN-TÊTE PRINCIPAL : Navigation & Actions rapides
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/candidatures')} 
            className="size-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all cursor-pointer shrink-0 hover:scale-105"
            title="Retour à la liste des candidatures"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                #{String(app.seqNumber).padStart(4, '0')}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Candidature de {c.firstName} {c.lastName}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${APP_STATUS_STYLE[app.status]}`}>
                ● {APP_STATUS_LABELS[app.status]}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STRUCTURE_LABELS[structureType]?.style || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {STRUCTURE_LABELS[structureType]?.label || "Structure"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <span>Soumise le <strong>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue'}</strong></span>
              {(c.companyName || p.title) && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Building2 className="size-3.5 text-[#23c3b1]" />
                    {c.companyName || p.title}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Boutons d'action opérationnels haut de page */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {user?.role === 'COACH' ? (
            <>
              {c.phone && (
                <a
                  href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
                  title="Contacter directement sur WhatsApp"
                >
                  <MessageSquare className="size-4" />
                  <span>Contacter sur WhatsApp</span>
                </a>
              )}
              {c.email && (
                <a
                  href={`mailto:${c.email}`}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Mail className="size-4 text-slate-500" />
                  <span>Envoyer un e-mail</span>
                </a>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsAppointmentOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#23c3b1] to-[#1cb0a0] hover:from-[#1fb3a2] hover:to-[#179c8d] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
            >
              <Calendar className="size-4" />
              <span>Planifier l'entretien</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. CORPS DU DOSSIER : Colonne Gauche (Fiches) + Colonne Droite (Instruction)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Principale (Gauche) */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* =====================================================================
              TABLEAU / FICHE 1 : Dirigeant / Représentant
             ===================================================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#23c3b1] to-teal-400" />
            <div className="p-5 sm:p-6">
              
              <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#178578]">
                    <User className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Dirigeant & Coordonnées</h2>
                    <p className="text-[11px] text-slate-500">Profil du candidat porteur du projet</p>
                  </div>
                </div>

                <div className="size-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                  {c.firstName?.[0] || 'C'}{c.lastName?.[0] || 'D'}
                </div>
              </div>

              {/* Grille de données du candidat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Nom */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Nom complet
                  </span>
                  <div className="font-bold text-slate-800 text-sm">
                    {c.firstName} {c.lastName}
                  </div>
                </div>

                {/* 2. E-mail */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Adresse e-mail
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <a 
                      href={`mailto:${c.email}`} 
                      className="font-medium text-slate-800 text-sm hover:text-[#23c3b1] transition-colors truncate"
                      title={c.email}
                    >
                      {c.email || '—'}
                    </a>
                    {c.email && (
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(c.email)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                        title="Copier l'adresse email"
                      >
                        {copiedEmail ? <CheckCircle2 className="size-3.5 text-teal-600" /> : <Copy className="size-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Téléphone */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Téléphone
                  </span>
                  <div className="font-bold text-slate-800 text-sm">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="hover:text-[#23c3b1] transition-colors">
                        {c.phone}
                      </a>
                    ) : '—'}
                  </div>
                </div>

                {/* 4. Localisation */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Ville / Localisation
                  </span>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#f06553] shrink-0" />
                    <span>{c.city || 'Libreville, Gabon'}</span>
                  </div>
                </div>

              </div>

              {/* Modalité d'entretien souhaitée par le candidat */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-600">
                  Préférence d'entretien déclarée :
                </span>
                {c.interviewPreference === 'VIDEO' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#f06553] border border-orange-200/80">
                    <Video className="size-3.5" />
                    Visioconférence {c.hasVideoEquipment ? '(Équipement validé)' : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <Building2 className="size-3.5" />
                    Présentiel (Espace PME, Quartier B2)
                  </span>
                )}
              </div>

            </div>
          </section>

          {/* =====================================================================
              TABLEAU / FICHE 2 : Structure & Projet d'Entreprise
             ===================================================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-[#23c3b1]" />
            <div className="p-5 sm:p-6 space-y-5">
              
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {structureType === 'PME' ? "Entreprise (PME existante)" : structureType === 'STARTUP' ? "Startup innovante" : "Projet d'Entreprise"}
                    </h2>
                    <p className="text-[11px] text-slate-500">Détails de l'activité économique</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 uppercase tracking-wider">
                  {c.legalStatus || 'Statut non spécifié'}
                </span>
              </div>

              {/* Dénomination du projet */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Dénomination / Nom de l'activité
                </span>
                <div className="text-lg font-black text-slate-900">
                  {c.companyName || p.title || p.name || 'Projet sans nom'}
                </div>
              </div>

              {/* Description avec mise en valeur (bordure gauche turquoise) */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Description des activités & proposition de valeur
                </span>
                <div className="p-4 rounded-xl rounded-l-none bg-slate-50 border border-slate-200/70 border-l-4 border-l-[#23c3b1] text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-2xs">
                  {p.description || 'Aucune description fournie.'}
                </div>
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
                      <span className="text-slate-400 block font-medium">Taille effectif</span>
                      <span className="font-bold text-slate-800">{c.companySize}</span>
                    </div>
                  )}
                  {c.annualRevenue && (
                    <div>
                      <span className="text-slate-400 block font-medium">Chiffre d'affaires</span>
                      <span className="font-bold text-slate-800">{c.annualRevenue}</span>
                    </div>
                  )}
                  {c.creationYear && (
                    <div>
                      <span className="text-slate-400 block font-medium">Année création</span>
                      <span className="font-bold text-slate-800">{c.creationYear}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Secteur & Stade en tuiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Secteur d'activité
                  </span>
                  <div className="font-bold text-slate-800 text-sm">
                    {p.sector || 'Transition écologique & Divers'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Stade actuel de maturité
                  </span>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#23c3b1]" />
                    <span>{p.stage || 'IDÉE'}</span>
                  </div>
                </div>
              </div>

              {/* Besoins prioritaires déclarés sous forme de tags corail */}
              {p.needs && p.needs.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Besoins prioritaires déclarés :
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {p.needs.map((need: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-orange-50 text-[#f06553] text-xs font-bold border border-orange-200/80 shadow-2xs">
                        🏷 {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* =====================================================================
              TABLEAU / FICHE 3 : Documents & Pièces Jointes Déposés
             ===================================================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#23c3b1] to-emerald-400" />
            <div className="p-5 sm:p-6 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#23c3b1]">
                    <Paperclip className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Documents & Pièces jointes</span>
                      {uploadedDocs.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#23c3b1]/15 text-[#178578] border border-[#23c3b1]/30">
                          {uploadedDocs.length} joint{uploadedDocs.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Business Plan, Statuts, RCCM, CNI et pièces justificatives du candidat
                    </p>
                  </div>
                </div>

                {/* Bouton d'ajout direct d'un document au dossier */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs self-start sm:self-auto">
                  <Upload className="size-3.5 text-slate-500" />
                  <span>{isUploadingDoc ? 'Téléversement...' : 'Ajouter un document'}</span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploadingDoc}
                    onChange={handleDirectFileUpload}
                  />
                </label>
              </div>

              {/* Contenu : liste des documents ou état vide explicite */}
              {uploadedDocs.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
                  <FileText className="size-9 mx-auto text-slate-300 stroke-[1.25] mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Aucun document téléversé par le candidat</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Le candidat n'a pas encore joint de pièce justificative (Business Plan, Statuts/RCCM, CNI). Vous pouvez ajouter un document reçu par email ou lors de l'entretien grâce au bouton ci-dessus.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {uploadedDocs.map((doc: any, idx: number) => {
                    const downloadUrl = `/api/v1/applications/attachments/${doc.fileId}?filename=${encodeURIComponent(doc.originalName || 'document')}`;
                    const previewUrl = `/api/v1/applications/attachments/${doc.fileId}?inline=true&filename=${encodeURIComponent(doc.originalName || 'document')}`;
                    return (
                      <div 
                        key={doc.fileId || idx}
                        className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 hover:border-[#23c3b1]/60 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs text-[#23c3b1] group-hover:scale-105 transition-transform">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate" title={doc.originalName}>
                              {doc.originalName || 'Document sans titre'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60 uppercase">
                                {doc.category || 'DOCUMENT'}
                              </span>
                              {doc.size && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {formatFileSize(doc.size)}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(idx)}
                            title="Retirer ce document"
                            className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs transition-colors"
                          >
                            <ExternalLink className="size-3 text-slate-500" />
                            <span>Aperçu</span>
                          </a>
                          <a
                            href={downloadUrl}
                            download={doc.originalName || 'document'}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            <Download className="size-3" />
                            <span>Télécharger</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </section>

        </div>

        {/* =======================================================================
            COLONNE DROITE : Panneau d'Instruction & Décision du Dossier
           ======================================================================= */}
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5 sticky top-20">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="size-2 rounded-full bg-[#f06553] animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Instruction du Dossier
              </h2>
            </div>
            
            <div className="space-y-4">
              
              {/* Choix du Conseiller Référent (réservé coordination / agent) */}
              {user?.role !== 'COACH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Conseiller référent (Coach / Agent / Direction)
                  </label>
                  <select 
                    className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-[#23c3b1] focus:ring-2 focus:ring-[#23c3b1]/20 text-xs text-slate-800 p-2.5 bg-white disabled:bg-slate-100 cursor-pointer"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    disabled={isReadOnly && !can('applications:review')}
                  >
                    <option value="">Non assigné (Attribution ultérieure)</option>
                    {options.data?.agents?.filter(a => a.role?.code === 'COACH').length ? (
                      <optgroup label="🎯 Coachs & Mentors">
                        {options.data.agents.filter(a => a.role?.code === 'COACH').map(a => (
                          <option key={a.id} value={a.id}>Coach : {a.firstName} {a.lastName}</option>
                        ))}
                      </optgroup>
                    ) : null}
                    {options.data?.agents?.filter(a => a.role?.code === 'AGENT' || !a.role?.code).length ? (
                      <optgroup label="📋 Agents IML (Coordination)">
                        {options.data.agents.filter(a => a.role?.code === 'AGENT' || !a.role?.code).map(a => (
                          <option key={a.id} value={a.id}>Agent : {a.firstName} {a.lastName}</option>
                        ))}
                      </optgroup>
                    ) : null}
                    {options.data?.agents?.filter(a => a.role?.code === 'ADMIN' || a.role?.code === 'DIRECTION').length ? (
                      <optgroup label="👑 Direction du Programme">
                        {options.data.agents.filter(a => a.role?.code === 'ADMIN' || a.role?.code === 'DIRECTION').map(a => (
                          <option key={a.id} value={a.id}>Direction : {a.firstName} {a.lastName}</option>
                        ))}
                      </optgroup>
                    ) : null}
                  </select>
                </div>
              )}

              {/* Choix du Statut */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Statut de la candidature
                </label>
                <select 
                  className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-[#23c3b1] focus:ring-2 focus:ring-[#23c3b1]/20 text-xs font-bold text-slate-800 p-2.5 bg-white disabled:bg-slate-100 cursor-pointer"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isReadOnly || user?.role === 'COACH'}
                >
                  {Object.entries(APP_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>

              {/* Notes Internes & Diagnostic */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes internes & Rapport d'évaluation
                </label>
                <textarea 
                  rows={7}
                  className="w-full rounded-xl border border-slate-300 shadow-2xs focus:border-[#23c3b1] focus:ring-2 focus:ring-[#23c3b1]/20 text-xs p-3 font-mono text-slate-800 disabled:bg-slate-100 leading-relaxed resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Évaluation du profil, motivation, solidité du projet..."
                  disabled={isReadOnly && !can('applications:review')}
                />
              </div>

              {/* Notification visuelle de succès ou d'erreur */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>✓ Notes d'évaluation et statut enregistrés avec succès !</span>
                </div>
              )}
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="size-4 text-red-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Bouton Enregistrer l'évaluation */}
              {can('applications:review') && (
                <button 
                  type="button"
                  onClick={handleSave} 
                  disabled={updateMut.isPending}
                  className={`w-full flex justify-center items-center gap-2 px-5 py-3 text-white rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 text-xs font-bold cursor-pointer ${
                    saveSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-[#152335] hover:bg-[#0d1724]'
                  }`}
                >
                  {updateMut.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="size-4 text-white" />
                      <span>Évaluation enregistrée avec succès ✓</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4 text-[#23c3b1]" />
                      <span>Enregistrer l'évaluation</span>
                    </>
                  )}
                </button>
              )}

              {/* Alerte & Bouton Conversion en Bénéficiaire */}
              {app.status === 'ACCEPTEE' && can('beneficiaries:write') && !app.beneficiaryId && (
                <div className="pt-4 border-t border-slate-200 mt-4 space-y-3">
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl border border-emerald-200 leading-relaxed font-medium">
                    🎉 Candidature admise ! Vous pouvez maintenant créer le dossier bénéficiaire officiel.
                  </div>
                  <button 
                    type="button"
                    onClick={handleConvert}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Convertir en Bénéficiaire Officiel</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

      </div>

      {/* =========================================================================
          3. MODALES COMPLÉMENTAIRES
         ========================================================================= */}

      {/* Modale de Planification de RDV pré-remplie */}
      <CreateAppointmentWizardModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        defaultBeneficiaryId={app?.beneficiaryId || undefined}
        defaultApplicationId={app?.id}
        defaultCandidate={{
          applicationId: app?.id,
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

