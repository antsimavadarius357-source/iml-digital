import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Building2, 
  Video, 
  Calendar, 
  CheckCircle2,
  Copy,
  MapPin,
  MessageSquare,
  Mail,
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  Upload,
  Trash2,
  ShieldCheck,
  Bell,
  Plus,
  FileCheck,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { APP_STATUS_LABELS, APP_STATUS_STYLE } from './ApplicationsPage';
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
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteTopic, setNoteTopic] = useState('Diagnostic & Stratégie');
  const [noteContent, setNoteContent] = useState('');
  const [noteNextSteps, setNoteNextSteps] = useState('');
  const [notePriority, setNotePriority] = useState('NORMALE');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const bId = app?.beneficiaryId || app?.beneficiary?.id;
    if (!bId) {
      alert("Aucun dossier bénéficiaire associé à cette candidature pour lier le compte-rendu.");
      return;
    }
    if (!noteContent.trim()) {
      alert("Veuillez saisir le contenu du compte-rendu.");
      return;
    }
    setIsSubmittingNote(true);
    try {
      await api(`/beneficiaries/${bId}/notes`, {
        method: 'POST',
        body: {
          topic: noteTopic.trim() || "Compte-rendu d'accompagnement",
          content: noteContent.trim(),
          nextSteps: noteNextSteps.trim() || null,
          priority: notePriority,
          sessionDate: new Date(),
        }
      });
      setNoteContent('');
      setNoteNextSteps('');
      setIsAddNoteModalOpen(false);
      await refetch();
      alert('✓ Compte-rendu enregistré avec succès et répertorié sur le dossier !');
    } catch (err: any) {
      alert(err?.message || "Erreur lors de l'enregistrement du compte-rendu.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api<{ application: any }>(`/applications/${id}`),
  });

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
      setIsInitialized(true);
    }
  }, [app, isInitialized]);

  const updateMut = useMutation({
    mutationFn: (data: any) => api(`/applications/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (data: any) => {
      if (data?.application) {
        setStatus(data.application.status || status);
        setNotes(data.application.evaluationNotes || notes);
      }
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err: any) => {
      alert(err?.message || "Erreur lors de la mise à jour du dossier.");
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
  const isDirection = user?.role === 'DIRECTION';
  const isReadOnly = app.status === 'ACCEPTEE' || app.status === 'REFUSEE' || isDirection;
  const structureType = c.structureType || 'PORTEUR_IDEE';

  const handleConvert = () => {
    navigate('/beneficiaires/nouveau', { state: { fromApp: app.seqNumber || app.id, applicant: c, project: p } });
  };

  const appDocsFromPayload: any[] = 
    (Array.isArray(p.documents) && p.documents) || 
    (Array.isArray(c.documents) && c.documents) || 
    (Array.isArray((app as any).documents) && (app as any).documents) || 
    [];

  const beneficiaryDocs = ((app as any)?.beneficiary?.documents || []).map((bd: any) => ({
    fileId: bd.filePath,
    originalName: bd.fileName || bd.title,
    size: bd.sizeBytes,
    category: bd.category,
    status: bd.status,
    id: bd.id,
  }));

  const uploadedDocs: any[] = [
    ...appDocsFromPayload,
    ...beneficiaryDocs.filter((bd: any) => !appDocsFromPayload.some((d: any) => d.fileId === bd.fileId))
  ];

  const followUpNotes: any[] = (app as any)?.beneficiary?.followUpNotes || [];
  const appointmentsWithSession: any[] = ((app as any)?.beneficiary?.appointments || []).filter(
    (a: any) => a.session || a.status === 'REALISE'
  );
  const allReportsCount = followUpNotes.length + appointmentsWithSession.length;

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

          {c.photo && (
            <div className="size-12 rounded-full overflow-hidden border-2 border-[#23c3b1] shadow-xs shrink-0 hidden sm:block">
              <img src={c.photo} alt={`${c.firstName} ${c.lastName}`} className="size-full object-cover" />
            </div>
          )}

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
          ) : user?.role === 'DIRECTION' ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[#137469] text-xs font-bold">
              <ShieldCheck className="size-4 text-[#23c3b1]" />
              <span>Consultation Direction • Lecture seule</span>
            </div>
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
          PARCOURS DE SÉLECTION & D'INTÉGRATION (Relié au Parcours d'Incubation)
         ========================================================================= */}
      {(() => {
        const latestAppt = (app as any)?.beneficiary?.appointments?.[0];
        const hasInterview = Boolean(latestAppt);
        const hasReport = allReportsCount > 0;
        const currentStepNum = app.status === 'ACCEPTEE' ? 4 : (hasReport || hasInterview) ? 3 : app.status === 'EN_COURS_EXAMEN' ? 2 : 1;
        const programName = (app as any)?.beneficiary?.program?.name || 'Idéation & Structuration';
        const beneficiaryId = app.beneficiaryId || (app as any)?.beneficiary?.id;

        return (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                    Parcours de Sélection & d'Intégration
                  </span>
                  {app.status === 'ACCEPTEE' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                      Candidat Admis
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-slate-900 mt-1">
                  Instruction, Entretien expert et Décision d'Admission
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Progression : <strong>{currentStepNum}/4 étapes</strong>
                </span>
                {beneficiaryId && (
                  <Link
                    to={`/beneficiaires/${beneficiaryId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 rounded-lg border border-teal-200 transition-all"
                  >
                    <span>Dossier Bénéficiaire</span>
                    <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Étape 1 : Réception */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                currentStepNum > 1 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-500/10 text-blue-900'
              }`}>
                <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStepNum > 1 ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {currentStepNum > 1 ? '✓' : '1'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">1. Réception</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dossier reçu & vérifié</p>
                  <span className="text-[10px] text-emerald-700 font-medium">Accusé de réception IML</span>
                </div>
              </div>

              {/* Étape 2 : Instruction */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                currentStepNum > 2 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : currentStepNum === 2 
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10 text-amber-950' 
                    : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStepNum > 2 ? 'bg-emerald-600 text-white' : currentStepNum === 2 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStepNum > 2 ? '✓' : '2'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                    <span className="truncate">2. Instruction</span>
                    {currentStepNum === 1 && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatus('EN_COURS_EXAMEN');
                          updateMut.mutate({ status: 'EN_COURS_EXAMEN' });
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-2xs shrink-0"
                        title="Passer en cours d'instruction"
                      >
                        Activer
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {currentStepNum >= 2 ? "Examen par l'agent" : "En attente d'examen"}
                  </p>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Vérification des pièces & profil
                  </span>
                </div>
              </div>

              {/* Étape 3 : Entretien & Compte-rendu expert */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                currentStepNum > 3 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : currentStepNum === 3 
                    ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/10 text-teal-950' 
                    : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentStepNum > 3 ? 'bg-emerald-600 text-white' : currentStepNum === 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {currentStepNum > 3 ? '✓' : '3'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                    <span className="truncate">3. Entretien & Avis</span>
                    {!hasInterview && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setIsAppointmentOpen(true)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white transition-all cursor-pointer shadow-2xs shrink-0"
                      >
                        Planifier
                      </button>
                    )}
                    {hasInterview && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await api.post<{ success: boolean; message: string }>(`/appointments/${latestAppt.id}/reminder`);
                            alert(res?.message || 'Rappel e-mail envoyé avec succès au candidat et au coach !');
                          } catch (err: any) {
                            alert(err?.message || "Erreur lors de l'envoi du rappel");
                          }
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                        title="Envoyer immédiatement un e-mail de rappel au candidat et au coach"
                      >
                        <Bell className="size-2.5" />
                        <span>Rappeler</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {latestAppt 
                      ? `${new Date(latestAppt.datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${new Date(latestAppt.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` 
                      : "Entretien à planifier"}
                  </p>
                  <div className="mt-1">
                    {hasReport ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                        <CheckCircle2 className="size-2.5" />
                        <span>Avis expert déposé ({allReportsCount})</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddNoteModalOpen(true)}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                      >
                        + Déposer le compte-rendu
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Étape 4 : Admission en Incubation */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                app.status === 'ACCEPTEE' 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 ring-2 ring-emerald-500/20' 
                  : app.status === 'REFUSEE'
                    ? 'bg-red-50/70 border-red-200 text-red-900'
                    : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  app.status === 'ACCEPTEE' ? 'bg-emerald-600 text-white' : app.status === 'REFUSEE' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {app.status === 'ACCEPTEE' ? '✓' : app.status === 'REFUSEE' ? '✕' : '4'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                    <span className="truncate">4. Admission</span>
                    {app.status !== 'ACCEPTEE' && !isReadOnly && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Confirmer l'admission officielle de ce candidat à l'incubateur ? Un e-mail d'admission officiel lui sera automatiquement envoyé.")) {
                              setStatus('ACCEPTEE');
                              updateMut.mutate({ status: 'ACCEPTEE' });
                            }
                          }}
                          disabled={updateMut.isPending}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                          title="Valider l'Admission officielle dans le parcours d'incubation"
                        >
                          <CheckCircle2 className="size-3" />
                          <span>Valider l'admission</span>
                        </button>
                        {app.status !== 'REFUSEE' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Confirmer le refus de ce dossier de candidature ?")) {
                                setStatus('REFUSEE');
                                updateMut.mutate({ status: 'REFUSEE' });
                              }
                            }}
                            disabled={updateMut.isPending}
                            className="text-[10px] font-medium px-1.5 py-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Classer comme non retenue"
                          >
                            <span>Refuser</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {app.status === 'ACCEPTEE' ? "Admission validée ✓" : app.status === 'REFUSEE' ? "Candidature non retenue" : "Comité & Direction"}
                  </p>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {app.status === 'ACCEPTEE' ? `Intégré : ${programName}` : app.status === 'REFUSEE' ? "Dossier non retenu" : "Décision finale sur avis expert"}
                  </span>
                </div>
              </div>
            </div>

            {/* BANDEAU PASSERELLE VERS LE PARCOURS D'INCUBATION SI ADMIS */}
            {app.status === 'ACCEPTEE' && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in-50">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>Candidature Admise · Prise en charge active</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Étapes d'accompagnement : <strong>Cadrage & Diagnostic</strong> → <strong>Mentorat & Livrables</strong> → <strong>Bilan & Attestation</strong>
                    </p>
                  </div>
                </div>

                {beneficiaryId ? (
                  <Link
                    to={`/beneficiaires/${beneficiaryId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    <span>Ouvrir le Suivi d'Accompagnement</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                ) : can('beneficiaries:write') ? (
                  <button
                    type="button"
                    onClick={handleConvert}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Créer le Dossier Bénéficiaire</span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        );
      })()}

      {/* =========================================================================
          2. CORPS DU DOSSIER : Vue Pleine Largeur (Fiches d'informations)
         ========================================================================= */}
      <div className="space-y-6">
          
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

                {c.photo ? (
                  <div className="size-11 rounded-full overflow-hidden border-2 border-[#23c3b1] shadow-xs shrink-0">
                    <img src={c.photo} alt={`${c.firstName} ${c.lastName}`} className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="size-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                    {c.firstName?.[0] || 'C'}{c.lastName?.[0] || 'D'}
                  </div>
                )}
              </div>

              {/* Grille de données du candidat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Nom & Mandat */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {c.position ? "Représentant légal" : "Nom complet"}
                  </span>
                  <div className="font-bold text-slate-800 text-sm">
                    {c.firstName} {c.lastName}
                  </div>
                  {(c.position || c.role) && (
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {c.position || (c.role === 'PORTEUR_UNIQUE' ? 'Porteur de projet unique' : c.role === 'CO_FONDATEUR' ? 'Co-fondateur et Associé' : c.role === 'LEADER_PROJET' ? "Chef d'équipe et Leader" : c.role)}
                      {c.age ? ` • ${c.age} ans` : c.ageRange ? ` • ${c.ageRange === '25_35' ? '25-35 ans' : c.ageRange === 'MOINS_25' ? '< 25 ans' : '> 35 ans'}` : ''}
                    </span>
                  )}
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

                {/* 3. Téléphone principal */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Téléphone WhatsApp & Contact
                  </span>
                  <div className="font-bold text-slate-800 text-sm">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="hover:text-[#23c3b1] transition-colors">
                        {c.phone}
                      </a>
                    ) : '—'}
                  </div>
                  {c.businessPhone && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Bureau / Siège : {c.businessPhone}
                    </span>
                  )}
                </div>

                {/* 4. Localisation & Quartier */}
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Localisation & Siège
                  </span>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#f06553] shrink-0" />
                    <span>
                      {c.city || 'Libreville'}
                      {c.arrondissement ? ` (${c.arrondissement})` : ''}
                    </span>
                  </div>
                  {c.quartier && (
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      Quartier : {c.quartier}
                    </span>
                  )}
                  {c.headquartersAddress && !c.quartier && (
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      Zone : {c.headquartersAddress}
                    </span>
                  )}
                </div>

              </div>

              {/* Modalité d'entretien souhaitée par le candidat */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    Préférence d'entretien :
                  </span>
                  {c.interviewPreference === 'VIDEO' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#f06553] border border-orange-200/80">
                      <Video className="size-3.5" />
                      Visioconférence {c.hasVideoEquipment ? '(Équipement validé)' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <Building2 className="size-3.5" />
                      Présentiel (Siège IML Digit - B2)
                    </span>
                  )}
                </div>

                {c.timeSlotPreference && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Créneau : {c.timeSlotPreference === 'MATIN' ? 'Matinée (09h-12h)' : c.timeSlotPreference === 'APRES_MIDI' ? 'Après-midi (14h-17h)' : 'Indifférent'}
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

              {/* Attributs spécifiques PME si existants */}
              {structureType === 'PME' && (c.rccm || c.nif || c.companySize || c.annualRevenue || c.creationYear || c.targetClientele || c.hasBankAccount) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
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
                  {c.targetClientele && (
                    <div>
                      <span className="text-slate-400 block font-medium">Clientèle ciblée</span>
                      <span className="font-bold text-slate-800">{c.targetClientele}</span>
                    </div>
                  )}
                  {c.hasBankAccount && (
                    <div>
                      <span className="text-slate-400 block font-medium">Compte bancaire pro</span>
                      <span className="font-bold text-slate-800">{c.hasBankAccount === 'OUI' ? 'Oui (Actif)' : 'Non / En cours'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Attributs spécifiques Startup / Porteur d'idée */}
              {(structureType === 'STARTUP' || structureType === 'PORTEUR_IDEE') && (p.showcaseUrl || p.marketTest || p.targetMarket || p.oapiProtection) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 text-xs">
                  {p.showcaseUrl && (
                    <div className="sm:col-span-3 flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-medium">Lien vitrine / Réseaux sociaux :</span>
                      <a 
                        href={p.showcaseUrl.startsWith('http') ? p.showcaseUrl : `https://${p.showcaseUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-bold text-[#f06553] hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        <span className="truncate">{p.showcaseUrl}</span>
                      </a>
                    </div>
                  )}
                  {p.marketTest && (
                    <div>
                      <span className="text-slate-400 block font-medium">Test marché</span>
                      <span className="font-bold text-slate-800">
                        {p.marketTest === 'OUI' ? 'Ventes démarrées' : p.marketTest === 'EN_COURS' ? 'En test / Échantillons' : 'Non testé'}
                      </span>
                    </div>
                  )}
                  {p.targetMarket && (
                    <div>
                      <span className="text-slate-400 block font-medium">Marché visé</span>
                      <span className="font-bold text-slate-800">
                        {p.targetMarket === 'LOCAL' ? 'National (Gabon)' : p.targetMarket === 'CEMAC' ? 'Zone CEMAC' : 'International'}
                      </span>
                    </div>
                  )}
                  {p.oapiProtection && (
                    <div>
                      <span className="text-slate-400 block font-medium">Protection OAPI</span>
                      <span className="font-bold text-slate-800">
                        {p.oapiProtection === 'OUI' ? 'Enregistré OAPI' : p.oapiProtection === 'EN_COURS' ? 'Dépôt en cours' : 'Non protégé'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Attributs spécifiques Organisation / Coopérative */}
              {structureType === 'ORGANISATION' && (c.filiere || c.membersCount || c.womenPercentage || c.productionProvince || c.hasOfficialRegistration) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                  {c.filiere && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block font-medium">Filière / Production</span>
                      <span className="font-bold text-slate-800">{c.filiere}</span>
                    </div>
                  )}
                  {c.productionProvince && (
                    <div>
                      <span className="text-slate-400 block font-medium">Province / Bassin</span>
                      <span className="font-bold text-slate-800">{c.productionProvince}</span>
                    </div>
                  )}
                  {c.membersCount && (
                    <div>
                      <span className="text-slate-400 block font-medium">Membres actifs</span>
                      <span className="font-bold text-slate-800">
                        {c.membersCount === 'MOINS_20' ? '< 20 membres' : c.membersCount === '20_50' ? '20 à 50' : '> 50 membres'}
                      </span>
                    </div>
                  )}
                  {c.womenPercentage && (
                    <div>
                      <span className="text-slate-400 block font-medium">Part de femmes</span>
                      <span className="font-bold text-emerald-700">{c.womenPercentage}</span>
                    </div>
                  )}
                  {c.hasOfficialRegistration && (
                    <div>
                      <span className="text-slate-400 block font-medium">Agrément / Récépissé</span>
                      <span className="font-bold text-slate-800">
                        {c.hasOfficialRegistration === 'OUI' ? 'Récépissé obtenu' : c.hasOfficialRegistration === 'EN_COURS' ? 'En cours' : 'Non immatriculé'}
                      </span>
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
              TABLEAU / FICHE : Comptes-Rendus d'Experts & Suivi
             ===================================================================== */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500" />
            <div className="p-5 sm:p-6 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
                    <FileCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Comptes-Rendus d'Experts & Suivi</span>
                      {allReportsCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                          {allReportsCount} disponible{allReportsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Évaluations, synthèses d'entretiens et retours des coachs référents
                    </p>
                  </div>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsAddNoteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="size-3.5" />
                    <span>Rédiger un compte-rendu</span>
                  </button>
                )}
              </div>

              {/* Contenu : liste des comptes-rendus ou état vide */}
              {allReportsCount === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
                  <FileText className="size-9 mx-auto text-slate-300 stroke-[1.25] mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Aucun compte-rendu enregistré pour le moment</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    Dès qu'un coach ou expert réalise une séance ou consigne un avis sur ce projet, son rapport s'affiche automatiquement ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Notes de suivi / mentorat rédigées */}
                  {followUpNotes.map((note: any) => {
                    const authorName = note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Coach Référent IML';
                    const dateStr = new Intl.DateTimeFormat('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    }).format(new Date(note.createdAt || note.sessionDate || Date.now()));

                    return (
                      <div 
                        key={note.id}
                        className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 hover:border-amber-300 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {note.topic || "Compte-rendu de séance"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              Expertise & Suivi
                            </span>
                            {note.priority && note.priority !== 'NORMALE' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                {note.priority}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">{authorName}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-slate-100">
                          {note.content}
                        </div>

                        {note.nextSteps && (
                          <div className="text-xs p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                            <span className="font-bold shrink-0">🎯 Prochaines étapes :</span>
                            <span className="whitespace-pre-wrap">{note.nextSteps}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Sessions d'entretien formelles */}
                  {appointmentsWithSession.map((appt: any) => {
                    const coachName = appt.user ? `${appt.user.firstName} ${appt.user.lastName}` : 'Coach Référent IML';
                    const dateStr = new Intl.DateTimeFormat('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    }).format(new Date(appt.datetime));

                    return (
                      <div 
                        key={appt.id}
                        className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-teal-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              Entretien d'évaluation ({appt.duration} min)
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                              Séance Réalisée ✓
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">{coachName}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {appt.session?.summary && (
                          <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-slate-100">
                            {appt.session.summary}
                          </div>
                        )}

                        {appt.session?.nextActions && (
                          <div className="text-xs p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                            <span className="font-bold shrink-0">🎯 Plan d'action :</span>
                            <span className="whitespace-pre-wrap">{appt.session.nextActions}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

                {/* Bouton d'ajout direct d'un document au dossier (masqué pour la Direction) */}
                {user?.role !== 'DIRECTION' && (
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
                )}
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

                          {!isDirection && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(idx)}
                              title="Retirer ce document"
                              className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
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

      {/* Modale d'ajout rapide d'un compte-rendu / note de suivi */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                  <FileCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Rédiger un Compte-Rendu d'Expertise</h3>
                  <p className="text-[11px] text-slate-500">Attaché au dossier {c.companyName || p.title || `${c.firstName} ${c.lastName}`}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddNoteModalOpen(false)}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thématique ou Objet de la séance *
                </label>
                <select
                  value={noteTopic}
                  onChange={(e) => setNoteTopic(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white"
                >
                  <option value="Diagnostic & Stratégie">Diagnostic & Stratégie</option>
                  <option value="Entretien de sélection & Cadrage">Entretien de sélection & Cadrage</option>
                  <option value="Stratégie & Gouvernance">Stratégie & Gouvernance</option>
                  <option value="Modèle Économique & Business Plan">Modèle Économique & Business Plan</option>
                  <option value="Marketing, Ventes & Prospection">Marketing, Ventes & Prospection</option>
                  <option value="Comptabilité, Finances & Trésorerie">Comptabilité, Finances & Trésorerie</option>
                  <option value="Juridique, Fiscalité & Contrats">Juridique, Fiscalité & Contrats</option>
                  <option value="Technologie, Produit & Digital">Technologie, Produit & Digital</option>
                  <option value="Autre échange / Point de situation">Autre échange / Point de situation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Compte-rendu & Observations du coach *
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Points abordés, niveau de maturité, forces constatées, points d'attention..."
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-y leading-relaxed text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🎯 Prochaines étapes & Recommandations (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={noteNextSteps}
                  onChange={(e) => setNoteNextSteps(e.target.value)}
                  placeholder="Actions à mener par le candidat d'ici le prochain point..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-y text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Priorité :</span>
                  <select
                    value={notePriority}
                    onChange={(e) => setNotePriority(e.target.value)}
                    className="text-[11px] font-semibold rounded-lg border border-slate-200 px-2 py-1 bg-slate-50 text-slate-700"
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="HAUTE">Haute</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="BASSE">Basse</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddNoteModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingNote ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

