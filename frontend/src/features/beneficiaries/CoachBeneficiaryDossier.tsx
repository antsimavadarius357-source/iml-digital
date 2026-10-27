import { useState, useMemo } from 'react';
import { 
  Building2, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Download, 
  Plus, 
  Award, 
  CheckCircle2, 
  Clock, 
  FileText, 
  BookOpen, 
  Target, 
  Sparkles, 
  AlertCircle,
  Eye,
  CheckCircle,
  Briefcase,
  Trash2,
  Loader2,
  Video,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BeneficiaryDetail } from './types';
import AddDocumentWizardModal from '../documents/AddDocumentWizardModal';

interface CoachBeneficiaryDossierProps {
  beneficiary: BeneficiaryDetail;
  appointments: any[];
  showToast: (msg: string) => void;
}

export default function CoachBeneficiaryDossier({
  beneficiary: b,
  appointments = [],
  showToast
}: CoachBeneficiaryDossierProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'projet' | 'cadrage' | 'agenda' | 'documents' | 'notes'>('projet');
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  // État de validation de l'étape 3 (Mentorat & Livrables)
  const [isStep3Validated, setIsStep3Validated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`iml_dossier_step3_completed_${b.id}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleStep3 = () => {
    const nextVal = !isStep3Validated;
    setIsStep3Validated(nextVal);
    try {
      localStorage.setItem(`iml_dossier_step3_completed_${b.id}`, String(nextVal));
    } catch (e) {
      console.error(e);
    }
    if (nextVal) {
      showToast('✓ Étape 3 validée : Travaux et livrables de mentorat certifiés par le coach');
    }
  };
  
  const p = b.projects?.[0];
  const appData = b.application?.applicantData || {};
  const projData = b.application?.projectData || {};

  const agentName = b.assignedAgent 
    ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` 
    : 'Chargé de planification IML';

  // 1. Charger les documents réels depuis le backend
  const { 
    data: docsRes, 
    isLoading: loadingDocs,
    refetch: refetchDocs 
  } = useQuery({
    queryKey: ['beneficiary-documents', b.id],
    queryFn: () => api<{ items: any[] }>(`/documents?ownerId=${b.id}`),
    enabled: !!b.id
  });
  const realDocs = docsRes?.items || [];

  // 2. Charger les comptes-rendus de mentorat réels depuis la base de données
  const { 
    data: notesRes, 
    isLoading: loadingNotes
  } = useQuery({
    queryKey: ['beneficiary-notes', b.id],
    queryFn: () => api<{ items: any[] }>(`/beneficiaries/${b.id}/notes`),
    enabled: !!b.id
  });
  const notes = notesRes?.items || [];

  // 3. Charger les séances et créneaux fixés avec l'entrepreneur
  const { 
    data: apptsRes 
  } = useQuery({
    queryKey: ['beneficiary-appointments', b.id],
    queryFn: () => api<{ items: any[] }>(`/appointments?beneficiaryId=${b.id}`).catch(() => ({ items: [] })),
    enabled: !!b.id,
    initialData: { items: appointments }
  });
  const allAppointments = apptsRes?.items?.length ? apptsRes.items : (appointments || []);

  const upcomingAppointments = useMemo(() => {
    return [...allAppointments]
      .filter((a: any) => a.status === 'PLANIFIE')
      .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [allAppointments]);

  const nextAppointment = upcomingAppointments[0];

  const isNextVisio = useMemo(() => {
    if (!nextAppointment) return false;
    const loc = (nextAppointment.location || '').toLowerCase();
    return loc.includes('visio') || loc.includes('meet') || loc.includes('zoom') || loc.includes('teams') || (nextAppointment.location || '').includes('http');
  }, [nextAppointment]);

  const nextVideoUrl = useMemo(() => {
    if (!nextAppointment) return null;
    const match = (nextAppointment.location || '').match(/https?:\/\/[^\s\]]+/);
    const cleanId = nextAppointment.id ? nextAppointment.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8) : 'seance';
    return match ? match[0] : `https://meet.jit.si/imldigit-seance-${cleanId}`;
  }, [nextAppointment]);

  // Mutation pour activer la prise en charge
  const activateMut = useMutation({
    mutationFn: () => api(`/beneficiaries/${b.id}`, {
      method: 'PATCH',
      body: { 
        status: 'ACTIF',
        startDate: new Date().toISOString()
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary', b.id] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      showToast('✓ Prise en charge validée : accompagnement désormais Actif');
    },
    onError: (err: any) => {
      showToast(`Erreur : ${err?.message || 'Impossible d\'activer le dossier'}`);
    }
  });

  // Mutation pour valider directement un jalon de parcours (ex: Diagnostic, BMC, etc.)
  const updatePathwayStepMut = useMutation({
    mutationFn: ({ stepId, status }: { stepId: string; status: 'TERMINE' | 'A_FAIRE' }) =>
      api(`/pathways/steps/${stepId}`, {
        method: 'PATCH',
        body: { status }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary', b.id] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      showToast('✓ Jalon de parcours mis à jour');
    },
    onError: (err: any) => {
      showToast(`Erreur : ${err?.message || 'Impossible de mettre à jour le jalon'}`);
    }
  });

  // Mutation pour valider le statut d'un document
  const validateDocMut = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: 'VALIDE' | 'EN_ATTENTE' }) => 
      api(`/documents/${docId}/status`, {
        method: 'PATCH',
        body: { status }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-documents', b.id] });
      showToast('✓ Statut du document mis à jour');
    }
  });

  // Formulaire d'ajout de note
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [noteTopic, setNoteTopic] = useState('Stratégie & Gouvernance');
  const [noteContent, setNoteContent] = useState('');
  const [noteNextSteps, setNoteNextSteps] = useState('');
  const [notePriority, setNotePriority] = useState<'HAUTE' | 'NORMALE' | 'BASSE'>('NORMALE');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);

  // Mutation pour enregistrer un compte-rendu
  const addNoteMut = useMutation({
    mutationFn: (data: any) => api(`/beneficiaries/${b.id}/notes`, {
      method: 'POST',
      body: data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-notes', b.id] });
      queryClient.invalidateQueries({ queryKey: ['beneficiary', b.id] });
      setIsAddNoteOpen(false);
      setIsCustomTopic(false);
      setNoteTopic('Stratégie & Gouvernance');
      setNoteContent('');
      setNoteNextSteps('');
      showToast('✓ Compte-rendu de mentorat enregistré avec succès');
    },
    onError: (err: any) => {
      showToast(`Erreur : ${err?.message || 'Impossible d\'enregistrer le compte-rendu'}`);
    }
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    addNoteMut.mutate({
      topic: noteTopic,
      content: noteContent.trim(),
      nextSteps: noteNextSteps.trim() || null,
      priority: notePriority,
      sessionDate: noteDate ? new Date(noteDate).toISOString() : new Date().toISOString()
    });
  };

  // Mutation pour supprimer une note
  const deleteNoteMut = useMutation({
    mutationFn: (noteId: string) => api(`/beneficiaries/${b.id}/notes/${noteId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-notes', b.id] });
      showToast('✓ Compte-rendu supprimé');
    }
  });

  const isEnAttente = b.status === 'EN_ATTENTE';
  const isActif = b.status === 'ACTIF';

  return (
    <div className="max-w-[1280px] mx-auto pb-16 space-y-6 font-sans text-slate-800">
      
      {/* =========================================================================
          1. EN-TÊTE VALORISANT : DOSSIER DE L'ENTREPRENEUR (VUE COACH / MENTOR)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#23c3b1] via-teal-500 to-[#101f2e]" />
        
        <div className="p-6 sm:p-7 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            
            {/* Profil dirigeant & Entreprise */}
            <div className="flex items-start gap-4">
              <div className="size-16 sm:size-18 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#178578] font-black text-xl sm:text-2xl shrink-0 shadow-2xs">
                {b.firstName?.[0]}{b.lastName?.[0]}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {b.firstName} {b.lastName}
                  </h1>
                  
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                    {b.type === 'STARTUP' ? 'Start-up' : b.type === 'PORTEUR_IDEE' ? "Porteur d'Idée" : 'Entreprise'}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isActif 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : isEnAttente 
                      ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    ● {b.status === 'ACTIF' ? 'Accompagnement Actif' : b.status === 'EN_ATTENTE' ? 'En attente de prise en charge' : b.status}
                  </span>
                </div>

                {/* Entreprise & Dossier */}
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 flex-wrap">
                  <Building2 className="size-4 text-[#23c3b1] shrink-0" />
                  <span>{p?.name || b.lastName || 'Activité en cours'}</span>
                  <span className="text-slate-400 font-normal">• Dossier n° {b.fileNumber}</span>
                </div>

                {/* Agent de cadrage & Programme */}
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="size-3 text-slate-400" />
                    Agent de planification : <strong className="text-slate-700">{agentName}</strong>
                  </span>
                  {b.program?.name && (
                    <span className="flex items-center gap-1">
                      • Programme : <strong className="text-teal-700">{b.program.name}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides en-tête */}
            {isEnAttente && (
              <div className="flex items-center gap-2.5 self-start lg:self-center">
                <button
                  type="button"
                  onClick={() => activateMut.mutate()}
                  disabled={activateMut.isPending}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {activateMut.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  <span>Démarrer la prise en charge</span>
                </button>
              </div>
            )}
          </div>

          {/* Barrette des coordonnées de contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="size-3.5 text-slate-400" />
              <span className="text-slate-400">Tél :</span>
              <a href={`tel:${b.phone}`} className="font-semibold text-slate-800 hover:text-teal-700">{b.phone || appData.phone || 'Non renseigné'}</a>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="size-3.5 text-slate-400" />
              <span className="text-slate-400">Email :</span>
              <a href={`mailto:${b.email}`} className="font-semibold text-slate-800 truncate hover:text-teal-700">{b.email || 'Non renseigné'}</a>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="size-3.5 text-slate-400" />
              <span className="text-slate-400">Localisation :</span>
              <span className="font-semibold text-slate-800">{b.city || appData.city || 'Libreville'}</span>
            </div>
          </div>

          {/* BANDEAU SÉANCE / VISIOCONFÉRENCE PROGRAMMÉE PAR L'AGENT */}
          {nextAppointment && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all mt-3 ${
              isNextVisio
                ? 'bg-gradient-to-r from-orange-50/95 via-amber-50/70 to-white border-orange-200/90 shadow-2xs ring-1 ring-orange-500/10'
                : 'bg-gradient-to-r from-teal-50/90 via-slate-50/70 to-white border-teal-200/90 shadow-2xs'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isNextVisio ? 'bg-[#f06553] text-white shadow-[#f06553]/20' : 'bg-teal-600 text-white'
                }`}>
                  {isNextVisio ? <Video className="size-5" /> : <Calendar className="size-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isNextVisio 
                        ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                        : 'bg-teal-100 text-teal-800 border border-teal-200'
                    }`}>
                      {isNextVisio ? '● Séancier Visioconférence Active' : '● Séance Présentiel'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(nextAppointment.datetime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(nextAppointment.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({nextAppointment.duration || 60} min)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {nextAppointment.location?.includes('[')
                        ? (nextAppointment.location.match(/\[MISSION:(.*?)\]/)?.[1] || nextAppointment.location)
                        : (nextAppointment.location || (isNextVisio ? 'Lien de visioconférence sécurisé IML Meet' : 'Siège IML Digit'))
                      }
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {isNextVisio && nextVideoUrl && (
                  <a
                    href={nextVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#f06553] hover:bg-[#e04a27] text-white text-xs font-bold shadow-md shadow-[#f06553]/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    title="Lancer ou rejoindre la visioconférence en 1 clic"
                  >
                    <Video className="size-4 animate-pulse" />
                    <span>Rejoindre la visio</span>
                    <ExternalLink className="size-3.5 opacity-80" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Voir le planning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. BANNIÈRE DE CIRCUIT D'ACCOMPAGNEMENT (Prise en charge & Jalons)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">
              Circuit de Prise en Charge & Accompagnement
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">
              Étapes de suivi de l'entrepreneur
            </h2>
          </div>

          {isEnAttente ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>Dossier affecté : Validez la prise en charge pour activer</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Suivi actif : {appointments.length} séance(s) programmée(s) • {notes.length} compte-rendu(s)</span>
            </div>
          )}
        </div>

        {/* Étapes du circuit */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Étape 1 */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <div className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              ✓
            </div>
            <div>
              <div className="font-bold text-slate-900">1. Candidature validée</div>
              <p className="text-[11px] text-emerald-800 mt-0.5">Orientation IML validée</p>
            </div>
          </div>

          {/* Étape 2 */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isEnAttente 
              ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isEnAttente ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isEnAttente ? '2' : '✓'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                <span className="truncate">2. Cadrage & Prise en charge</span>
                {isEnAttente ? (
                  <button
                    type="button"
                    onClick={() => activateMut.mutate()}
                    disabled={activateMut.isPending}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    {activateMut.isPending ? '...' : 'Valider'}
                  </button>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    Validé ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isEnAttente ? 'En attente de validation' : 'Prise en charge active'}
              </p>
            </div>
          </div>

          {/* Étape 3 */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
            isStep3Validated
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : isActif 
              ? 'bg-teal-50/80 border-teal-200 text-teal-900 ring-2 ring-teal-500/10' 
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isStep3Validated 
                ? 'bg-emerald-600 text-white'
                : isActif 
                ? 'bg-teal-600 text-white' 
                : 'bg-slate-200 text-slate-600'
            }`}>
              {isStep3Validated ? '✓' : '3'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-700 flex items-center justify-between gap-1">
                <span className="truncate">3. Mentorat & Livrables</span>
                <button
                  type="button"
                  onClick={handleToggleStep3}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 ${
                    isStep3Validated
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                      : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50 shadow-2xs'
                  }`}
                  title={isStep3Validated ? 'Cliquer pour révoquer' : 'Valider les livrables examinés'}
                >
                  {isStep3Validated ? 'Validé ✓' : 'Valider'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {isStep3Validated ? 'Livrables certifiés par le coach' : `${notes.length} note(s) rédigée(s)`}
              </p>
            </div>
          </div>

          {/* Étape 4 : Bilan & Sortie (Exclusivement géré par l'Agent IML / Direction) */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
            b.status === 'CLOTURE' || b.status === 'TERMINE'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50/90 border-slate-200 text-slate-600'
          }`}>
            <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              b.status === 'CLOTURE' || b.status === 'TERMINE' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-200 text-slate-500 font-semibold'
            }`}>
              {b.status === 'CLOTURE' || b.status === 'TERMINE' ? '✓' : '4'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-700 flex items-center justify-between gap-1">
                <span className="truncate">4. Bilan & Sortie</span>
                {b.status === 'CLOTURE' || b.status === 'TERMINE' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    Clôturé ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 border border-slate-300/80 shrink-0" title="Cette étape de clôture officielle et d'attestation est réservée à l'Agent IML">
                    Réservé Agent IML
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {b.status === 'CLOTURE' || b.status === 'TERMINE' 
                  ? 'Clôture officielle & Attestation délivrée' 
                  : 'Clôture & Attestation par l\'Agent'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. NAVIGATION PAR ONGLETS DU DOSSIER
         ========================================================================= */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('projet')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'projet' 
              ? 'border-[#23c3b1] text-teal-900 bg-teal-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building2 className="size-4 text-teal-600" />
          <span>Fiche Entreprise & Dirigeant</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cadrage')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'cadrage' 
              ? 'border-[#23c3b1] text-teal-900 bg-teal-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Target className="size-4 text-teal-600" />
          <span>Objectifs & Diagnostic Agent</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'agenda' 
              ? 'border-[#23c3b1] text-teal-900 bg-teal-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Calendar className="size-4 text-teal-600" />
          <span>Séances & Planning ({appointments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'documents' 
              ? 'border-[#23c3b1] text-teal-900 bg-teal-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="size-4 text-teal-600" />
          <span>Livrables & Documents ({realDocs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-3 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'notes' 
              ? 'border-[#23c3b1] text-teal-900 bg-teal-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="size-4 text-teal-600" />
          <span>Journal de Mentorat ({notes.length})</span>
        </button>
      </div>

      {/* =========================================================================
          4. CONTENU DE L'ONGLET SÉLECTIONNÉ
         ========================================================================= */}

      {/* -------------------------------------------------------------------------
          ONGLET 1 : FICHE ENTREPRISE & PROFIL DIRIGEANT
         ------------------------------------------------------------------------- */}
      {activeTab === 'projet' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Colonne Principale (Gauche) */}
            <div className="md:col-span-2 space-y-5">
              
              {/* Carte Profil du Dirigeant / Candidat */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="size-4 text-[#23c3b1]" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Profil du Dirigeant / Porteur de Projet
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Nom complet</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{b.firstName} {b.lastName}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Tranche d'âge</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{appData.ageRange || appData.age || 'Non spécifié'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Genre</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{appData.gender || 'Non spécifié'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Niveau d'études</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{appData.educationLevel || 'Enseignement supérieur'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Situation socio-pro</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{appData.situation || 'Entrepreneur à temps plein'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100">
                    <span className="text-teal-700 block font-medium text-[11px]">Préférence d'entretien</span>
                    <span className="font-bold text-teal-900 mt-0.5 block">{appData.preferredFormat || 'Présentiel (Espace PME)'}</span>
                  </div>
                </div>
              </div>

              {/* Carte Description du Projet & Activité */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sparkles className="size-4 text-[#23c3b1]" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Présentation de l'Activité Économique
                  </h2>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {p?.description || projData.description || "Activité commerciale et prestations de services développée dans le cadre de l'accompagnement IML Digit."}
                  </p>
                </div>

                {/* Besoins prioritaires déclarés */}
                {(p?.priorityNeeds || projData.needs) && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Besoins prioritaires déclarés à la candidature :
                    </span>
                    <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>{p?.priorityNeeds || projData.needs}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Spécifications Administratives */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building2 className="size-4 text-[#23c3b1]" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Données Administratives & Chiffres Clés
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Secteur d'activité</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{p?.sector?.name || projData.sector || 'Commerce & Services'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Stade d'avancement</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{p?.stage || projData.stage || 'Croissance'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">N° RCCM</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{projData.rccm || p?.legalStatus || 'En cours'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">N° NIF</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{projData.nif || 'En cours'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Taille effectif</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{p?.companySize || projData.teamSize || 'Micro (1 à 5)'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium text-[11px]">Chiffre d'affaires annuel</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{projData.revenueRange || '< 10 millions FCFA'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Cadrage Rapide */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Award className="size-4 text-[#23c3b1]" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Binôme d'Accompagnement
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100">
                    <span className="text-teal-700 text-[10px] uppercase font-bold tracking-wider block">
                      Agent de planification :
                    </span>
                    <div className="font-bold text-slate-900 mt-0.5">{agentName}</div>
                    <span className="text-[11px] text-slate-500">Coordination et calendrier des séances</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Coach référent / Mentor :
                    </span>
                    <div className="font-bold text-slate-900 mt-0.5">Votre mission de mentorat</div>
                    <span className="text-[11px] text-teal-700 font-medium">Accompagnement et animation des séances</span>
                  </div>
                </div>
              </div>

              {/* Rappel du cadre opérationnel */}
              <div className="bg-teal-50/40 rounded-2xl border border-teal-100 p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <Briefcase className="size-4 text-teal-600" />
                  <span>Règle d'accompagnement IML</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  L'entrepreneur est reçu dans les locaux de l'Espace PME ou contacté directement par WhatsApp/Email pour ses séances. 
                  Consignez chaque compte-rendu dans le <strong>Journal de Mentorat</strong> pour assurer la traçabilité.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          ONGLET 2 : OBJECTIFS & DIAGNOSTIC AGENT
         ------------------------------------------------------------------------- */}
      {activeTab === 'cadrage' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Target className="size-5 text-[#23c3b1]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Objectifs & Cadrage Initial de l'Agent
              </h2>
              <p className="text-xs text-slate-500">
                Lignes directrices formulées par {agentName} pour guider vos séances d'accompagnement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Objectifs initiaux de mission */}
            <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
                <CheckCircle2 className="size-4 text-[#23c3b1]" />
                <span>Objectifs assignés à l'accompagnement</span>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed pt-1 whitespace-pre-line">
                {b.initialObjectives || "1. Validation du modèle économique et proposition de valeur.\n2. Structuration du plan de prospection et stratégie de prix.\n3. Formalisation des prévisions de trésorerie."}
              </p>
            </div>

            {/* Besoins prioritaires identifiés */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <AlertCircle className="size-4 text-amber-600" />
                <span>Points de vigilance & Priorités</span>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed pt-1 whitespace-pre-line">
                {p?.priorityNeeds || projData.needs || "Validation rigoureuse des hypothèses de marge brute et formalisation des premiers contrats clients."}
              </p>
            </div>
          </div>

          {/* Jalons de parcours si présents */}
          {b.pathway?.steps && b.pathway.steps.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Jalons de parcours ({b.pathway.template?.name || 'Parcours PME'})
                </h3>
                <span className="text-xs font-bold text-teal-700">
                  Progression globale : {b.pathway.progress || 0}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {b.pathway.steps.map((st: any) => {
                  const isDone = st.status === 'TERMINE' || st.status === 'VALIDE';
                  return (
                    <div 
                      key={st.id} 
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        isDone ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isDone ? '✓' : st.orderIndex}
                        </span>
                        <span className={`font-semibold ${isDone ? 'text-emerald-950 line-through' : 'text-slate-800'}`}>
                          {st.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={updatePathwayStepMut.isPending}
                        onClick={() => {
                          updatePathwayStepMut.mutate({
                            stepId: st.id,
                            status: isDone ? 'A_FAIRE' : 'TERMINE'
                          });
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer shrink-0 ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                            : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50 shadow-2xs'
                        }`}
                        title={isDone ? 'Cliquer pour repasser à faire' : 'Valider ce jalon de parcours'}
                      >
                        {isDone ? 'Validé ✓' : 'Valider'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------
          ONGLET 3 : SÉANCES & PLANNING (Fixé par l'agent)
         ------------------------------------------------------------------------- */}
      {activeTab === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-150">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Séances & Rendez-vous Programmés par l'Agent
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultez les créneaux fixés avec l'entrepreneur à l'Espace PME ou en visioconférence.
              </p>
            </div>
          </div>

          {allAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Calendar className="size-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-slate-700 text-xs">Aucune séance planifiée actuellement</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                La planification des créneaux est effectuée par l'agent coordinateur. Dès qu'un créneau est fixé, il apparaîtra ici et sur votre cahier de bord.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {allAppointments.map((app: any) => {
                const isRealise = app.status === 'REALISE';
                const locLower = (app.location || '').toLowerCase();
                const isVisio = locLower.includes('visio') || locLower.includes('meet') || locLower.includes('zoom') || locLower.includes('teams') || (app.location || '').includes('http');
                const match = (app.location || '').match(/https?:\/\/[^\s\]]+/);
                const cleanId = app.id ? app.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8) : 'seance';
                const appVideoUrl = match ? match[0] : `https://meet.jit.si/imldigit-seance-${cleanId}`;

                return (
                  <div key={app.id} className="p-4.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isRealise ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isRealise ? 'Réalisée' : 'Planifiée'}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {new Date(app.datetime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {isVisio && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            <Video className="size-3" />
                            <span>Visio</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="size-3 text-teal-600" />
                          {new Date(app.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({app.duration || 60} min)
                        </span>
                        {app.location && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            {isVisio ? <Video className="size-3 text-[#f06553]" /> : <MapPin className="size-3 text-slate-400" />}
                            <span>{app.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isVisio && appVideoUrl && (
                        <a
                          href={appVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#f06553] hover:bg-[#e05341] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          title="Lancer ou rejoindre la visio"
                        >
                          <Video className="size-3.5" />
                          <span>Rejoindre la visio</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('notes');
                          setIsAddNoteOpen(true);
                          setNoteDate(new Date(app.datetime).toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-teal-200"
                      >
                        <Plus className="size-3.5" />
                        <span>Saisir le compte-rendu</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------
          ONGLET 4 : LIVRABLES & DOCUMENTS (Connecté à la GED réelle)
         ------------------------------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-150">
          <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Livrables & Documents du Dossier
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultez, téléchargez et examinez les pièces justificatives rattachées à cet entrepreneur.
              </p>
            </div>

          </div>

          {loadingDocs ? (
            <div className="p-10 text-center text-xs text-slate-400">
              <Loader2 className="size-6 animate-spin mx-auto mb-2 text-teal-600" />
              Chargement des documents...
            </div>
          ) : realDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <FileText className="size-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-slate-700 text-xs">Aucun document déposé pour ce dossier</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Les pièces justificatives (statuts, pièce d'identité, business plan, etc.) transmises par l'agent de planification ou le porteur apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {realDocs.map((doc: any) => {
                const isValidated = doc.status === 'VALIDE';
                return (
                  <div key={doc.id} className="p-4.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="size-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          <FileText className="size-4" />
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-[11px] flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {doc.category}
                        </span>
                        <span>Déposé le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                        {doc.uploadedBy && (
                          <span>Par : {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isValidated ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Validé
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => validateDocMut.mutate({ docId: doc.id, status: 'VALIDE' })}
                          disabled={validateDocMut.isPending}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="size-3" />
                          <span>Valider</span>
                        </button>
                      )}

                      <a
                        href={`/api/v1/documents/${doc.id}/download?inline=1`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
                        title="Aperçu dans le navigateur"
                      >
                        <Eye className="size-3.5" />
                      </a>

                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        download
                        className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors shadow-2xs"
                        title="Télécharger"
                      >
                        <Download className="size-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------
          ONGLET 5 : JOURNAL DE MENTORAT (Enregistré sur le serveur en BDD)
         ------------------------------------------------------------------------- */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Journal de Mentorat & Observations de Séances
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consignez vos remarques d'accompagnement, les points de blocage et les devoirs pour la prochaine séance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddNoteOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="size-4" />
              <span>Rédiger un compte-rendu</span>
            </button>
          </div>

          {/* Formulaire ajout note */}
          {isAddNoteOpen && (
            <form onSubmit={handleAddNote} className="bg-white p-6 rounded-2xl border border-teal-200 shadow-md space-y-4 text-xs animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Nouveau compte-rendu de séance</span>
                <button type="button" onClick={() => setIsAddNoteOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date de la séance *</label>
                  <input
                    type="date"
                    required
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Thématique abordée *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomTopic;
                        setIsCustomTopic(next);
                        if (next) {
                          setNoteTopic('');
                        } else {
                          setNoteTopic('Stratégie & Gouvernance');
                        }
                      }}
                      className="text-[11px] font-semibold text-[#23c3b1] hover:underline cursor-pointer"
                    >
                      {isCustomTopic ? '▾ Choisir dans la liste' : '✏️ Saisie libre'}
                    </button>
                  </div>

                  {isCustomTopic ? (
                    <input
                      type="text"
                      required
                      autoFocus
                      list="topics-datalist"
                      value={noteTopic}
                      onChange={(e) => setNoteTopic(e.target.value)}
                      placeholder="Entrez votre thématique..."
                      className="w-full rounded-xl border-2 border-[#23c3b1] p-2.5 text-xs focus:ring-2 focus:ring-[#23c3b1]/20 outline-none bg-white text-slate-900 font-medium placeholder:text-slate-400"
                    />
                  ) : (
                    <select
                      value={noteTopic}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomTopic(true);
                          setNoteTopic('');
                        } else {
                          setNoteTopic(e.target.value);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-[#23c3b1] outline-none bg-white font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="Stratégie & Gouvernance">Stratégie & Gouvernance</option>
                      <option value="Finance & Trésorerie">Finance & Trésorerie</option>
                      <option value="Commercial & Prospection">Commercial & Prospection</option>
                      <option value="Juridique & Formalisation">Juridique & Formalisation</option>
                      <option value="Organisation & RH">Organisation & RH</option>
                      <option value="Marketing & Communication">Marketing & Communication</option>
                      <option value="Modèle économique & Business Model">Modèle économique & Business Model</option>
                      <option value="Digitalisation & Outils">Digitalisation & Outils</option>
                      <option value="__CUSTOM__">✏️ Autre thématique (Saisie libre)...</option>
                    </select>
                  )}

                  <datalist id="topics-datalist">
                    <option value="Stratégie & Gouvernance" />
                    <option value="Finance & Trésorerie" />
                    <option value="Commercial & Prospection" />
                    <option value="Juridique & Formalisation" />
                    <option value="Organisation & RH" />
                    <option value="Marketing & Communication" />
                    <option value="Modèle économique & Business Model" />
                    <option value="Pitch & Levée de fonds" />
                    <option value="Diagnostic & Cadrage" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priorité</label>
                  <select
                    value={notePriority}
                    onChange={(e) => setNotePriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="HAUTE">Haute (Action urgente requise)</option>
                    <option value="BASSE">Basse (Simple note d'information)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Synthèse des échanges & Observations *</label>
                <textarea
                  required
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Points clés discutés, progression du projet, difficultés rencontrées, recommandations formulées..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Engagements & Devoirs pour la prochaine séance</label>
                <input
                  type="text"
                  value={noteNextSteps}
                  onChange={(e) => setNoteNextSteps(e.target.value)}
                  placeholder="Ex : Finaliser la v2 du prévisionnel et déposer les statuts avant jeudi prochain."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addNoteMut.isPending}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addNoteMut.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>Enregistrer en base</span>
                </button>
              </div>
            </form>
          )}

          {/* Liste des notes réelles */}
          {loadingNotes ? (
            <div className="p-10 text-center text-xs text-slate-400">
              <Loader2 className="size-6 animate-spin mx-auto mb-2 text-teal-600" />
              Chargement des comptes-rendus...
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 space-y-2">
              <BookOpen className="size-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-slate-700 text-xs">Aucun compte-rendu consigné pour le moment</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Après chaque rencontre avec l'entrepreneur, notez les points abordés et les engagements convenus en cliquant sur « Rédiger un compte-rendu ».
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {notes.map((note: any) => (
                <div key={note.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-200">
                        {note.topic}
                      </span>
                      {note.priority === 'HAUTE' && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                          Priorité Haute
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Séance du {new Date(note.sessionDate || note.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Rédigé par : <strong className="text-slate-700">{note.author?.firstName} {note.author?.lastName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Supprimer ce compte-rendu ?')) {
                            deleteNoteMut.mutate(note.id);
                          }
                        }}
                        className="size-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Supprimer la note"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line font-medium">
                    {note.content}
                  </div>

                  {note.nextSteps && (
                    <div className="text-xs flex items-start gap-2.5 bg-teal-50/70 p-3 rounded-xl border border-teal-100 text-teal-950">
                      <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[11px] block text-teal-900">Engagements & Devoirs convenus :</span>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">{note.nextSteps}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modale d'ajout de document direct */}
      <AddDocumentWizardModal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        defaultBeneficiaryId={b.id}
        onSuccess={() => {
          setIsAddDocOpen(false);
          refetchDocs();
          showToast('✓ Document déposé et rattaché avec succès');
        }}
      />
    </div>
  );
}
