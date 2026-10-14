import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  FileText, 
  Loader2, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Clock, 
  MessageSquare, 
  X, 
  Play, 
  Pencil, 
  Video, 
  Key, 
  MoreHorizontal, 
  ArrowRightToLine, 
  Award, 
  CheckCircle2, 
  UploadCloud, 
  FileCheck, 
  CheckSquare, 
  FolderOpen 
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { TYPE_LABELS, STATUS_LABELS, STATUS_STYLE, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type BeneficiaryDetail } from './types';
import { useSetBreadcrumbs } from '../../components/layout/AppBreadcrumb';
import RecordServiceModal from '../services/RecordServiceModal';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';

interface PrestationItem {
  id: string;
  date: string;
  beneficiaryName: string;
  duration: string;
  project: string;
  pathway: string;
  company: string;
  description: string;
}

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation Niveau 1 : Suivi | Prestations | Notes | Documents | Évaluations | Historique | Présentation
  const rawTab = searchParams.get('tab');
  const mainTab: 'suivi' | 'prestations' | 'notes' | 'documents' | 'evaluations' | 'historique' | 'presentation' = 
    rawTab === 'prestations' || rawTab === 'temps' || rawTab === 'time'
      ? 'prestations'
      : rawTab === 'notes'
      ? 'notes'
      : rawTab === 'documents'
      ? 'documents'
      : rawTab === 'evaluations'
      ? 'evaluations'
      : rawTab === 'historique'
      ? 'historique'
      : rawTab === 'presentation'
      ? 'presentation'
      : 'suivi';

  // Navigation Niveau 2 (sous Suivi) : Rendez-vous | Accompagnements | Parcours | Archivés
  const rawSubTab = searchParams.get('subtab');
  const suiviSubTab: 'rdv' | 'accompagnements' | 'parcours' | 'archives' = 
    rawSubTab === 'accompagnements'
      ? 'accompagnements'
      : rawSubTab === 'parcours'
      ? 'parcours'
      : rawSubTab === 'archives'
      ? 'archives'
      : 'rdv';

  const handleMainTabChange = (tab: 'suivi' | 'prestations' | 'notes' | 'documents' | 'evaluations' | 'historique' | 'presentation') => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  const handleSuiviSubTabChange = (subtab: 'rdv' | 'accompagnements' | 'parcours' | 'archives') => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', 'suivi');
      p.set('subtab', subtab);
      return p;
    });
  };

  // Modales
  const [isRecordServiceModalOpen, setIsRecordServiceModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [isHourCounterModalOpen, setIsHourCounterModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // État de prise de rendez-vous par le bénéficiaire
  const [bookingEnabled, setBookingEnabled] = useState(false);

  // Compteur d'heures (quota alloué)
  const [hourCounter, setHourCounter] = useState<{ totalHours: number; name: string } | null>(() => {
    if (typeof window !== 'undefined' && id) {
      const saved = localStorage.getItem(`iml_hour_counter_${id}`);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return null;
  });
  const [counterHoursInput, setCounterHoursInput] = useState('20');
  const [counterNameInput, setCounterNameInput] = useState("Accompagnement Création d'Entreprise");

  // Notes rapides locales
  const [quickNote, setQuickNote] = useState<string>('');

  // Toast temporaire
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtres date onglet Historique / Prestations
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [localPrestations, setLocalPrestations] = useState<PrestationItem[]>([]);

  // 1. Récupération des données du bénéficiaire
  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => api<{ beneficiary: BeneficiaryDetail }>(`/beneficiaries/${id}`),
  });

  const b = res?.beneficiary;

  // Initialisation note locale
  useEffect(() => {
    if (id) {
      const savedNote = localStorage.getItem(`iml_beneficiary_note_${id}`);
      if (savedNote) setQuickNote(savedNote);
    }
  }, [id]);

  const handleSaveQuickNote = () => {
    if (id) {
      localStorage.setItem(`iml_beneficiary_note_${id}`, quickNote);
      showToast('✓ Note enregistrée pour ce dossier');
      setIsQuickNoteModalOpen(false);
    }
  };

  const handleSaveHourCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const counter = {
      totalHours: Number(counterHoursInput) || 20,
      name: counterNameInput.trim() || 'Accompagnement IML'
    };
    setHourCounter(counter);
    if (id) {
      localStorage.setItem(`iml_hour_counter_${id}`, JSON.stringify(counter));
    }
    showToast(`✓ Compteur créé : ${counter.totalHours}h allouées (${counter.name})`);
    setIsHourCounterModalOpen(false);
  };

  // 2. Récupération des rendez-vous et prestations du bénéficiaire
  const { data: appointmentsRes, refetch: refetchAppointments } = useQuery({
    queryKey: ['beneficiary-appointments', id],
    queryFn: () => api<{ items: any[] }>(`/appointments?beneficiaryId=${id}`).catch(() => ({ items: [] })),
    enabled: !!id,
  });

  // Construction de la liste des prestations
  const allPrestations = useMemo<PrestationItem[]>(() => {
    const apiItems: PrestationItem[] = (appointmentsRes?.items || [])
      .filter((appt: any) => appt.session || appt.status === 'REALISE')
      .map((appt: any) => {
        const d = new Date(appt.datetime);
        const hours = Math.floor(appt.duration / 60);
        const mins = appt.duration % 60;
        const durationStr = `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : hours === 0 ? '0m' : ''}`.trim();
        return {
          id: appt.id,
          date: d.toLocaleDateString('fr-FR'),
          beneficiaryName: b ? `${b.firstName} ${b.lastName}` : 'Marine LOUPE',
          duration: durationStr || '1h 00m',
          project: b?.projects?.[0]?.name || 'Projet emploi',
          pathway: appt.session?.nextActions?.replace('Parcours: ', '') || b?.program?.name || "Création d'entreprise",
          company: b?.type === 'ENTREPRISE' ? (b?.projects?.[0]?.name || 'IML Digit') : 'IML Digit',
          description: appt.session?.summary || appt.location || "Session d'accompagnement"
        };
      });
    return [...localPrestations, ...apiItems];
  }, [appointmentsRes, localPrestations, b]);

  // Filtrage des prestations
  const filteredPrestations = useMemo(() => {
    return allPrestations.filter(p => {
      if (historyStartDate.trim() && !p.date.includes(historyStartDate.trim())) return false;
      if (historyEndDate.trim() && !p.date.includes(historyEndDate.trim())) return false;
      return true;
    });
  }, [allPrestations, historyStartDate, historyEndDate]);

  // Séparation des rendez-vous : à venir vs à planifier
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return (appointmentsRes?.items || []).filter((appt: any) => {
      return appt.status === 'PLANIFIE' && new Date(appt.datetime) >= now;
    });
  }, [appointmentsRes]);

  const toPlanAppointments = useMemo(() => {
    return (appointmentsRes?.items || []).filter((appt: any) => {
      return appt.status === 'NON_ASSIGNE';
    });
  }, [appointmentsRes]);

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = "Date;Bénéficiaire;Durée;Projet emploi;Parcours;Société;Description\n";
    const rows = filteredPrestations.map(p => 
      `"${p.date}";"${p.beneficiaryName}";"${p.duration}";"${p.project}";"${p.pathway}";"${p.company}";"${p.description}"`
    ).join('\n');
    
    const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `feuille_prestations_${b?.firstName || 'beneficiaire'}_${b?.lastName || ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Export des prestations téléchargé (format CSV)');
  };

  const handleDeletePrestation = (pId: string) => {
    setLocalPrestations(prev => prev.filter(p => p.id !== pId));
    showToast('✓ Prestation supprimée de la liste');
  };

  useSetBreadcrumbs(
    b ? [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: `${b.firstName} ${b.lastName}`, icon: User }
    ] : [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: 'Dossier bénéficiaire', icon: User }
    ]
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-iml-500" />
      </div>
    );
  }

  if (isError || !b) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
        <p className="mb-4">Impossible de charger les détails du dossier.</p>
        <button onClick={() => void refetch()} className="font-medium underline hover:text-red-900">Réessayer</button>
      </div>
    );
  }

  const p = b.projects[0];
  const coachName = b.assignedAgent 
    ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` 
    : 'DARUS ANTSIMAVA';

  return (
    <div className="max-w-[1400px] mx-auto pb-16 space-y-4 font-sans">


      {/* =========================================================================
          2. CARTE EN-TÊTE DU DOSSIER BÉNÉFICIAIRE (Conforme exactement à la capture)
         ========================================================================= */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch">
          
          {/* Bloc Gauche : Drapeau, 5 boutons corail d'action, Avatar & Nom */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 min-w-[280px]">
            {/* Rangée des 5 boutons corail */}
            <div className="flex items-center gap-1.5 mb-4">
              {/* 1. Bouton Crayon (Modifier) */}
              <button
                type="button"
                onClick={() => navigate(`/beneficiaires/${id}/modifier`)}
                title="Modifier le dossier"
                className="size-6 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <Pencil className="size-3" />
              </button>

              {/* 2. Bouton Caméra (Visio) */}
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                title="Démarrer un entretien vidéo"
                className="size-6 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <Video className="size-3" />
              </button>

              {/* 3. Bouton Clé (Accès portail) */}
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(true)}
                title="Gestion des identifiants et accès portail"
                className="size-6 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <Key className="size-3" />
              </button>

              {/* 4. Bouton Trois points (...) */}
              <button
                type="button"
                onClick={() => handleMainTabChange('presentation')}
                title="Voir la fiche complète de présentation"
                className="size-6 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <MoreHorizontal className="size-3" />
              </button>

              {/* 5. Bouton Flèche de transfert (->|) */}
              <button
                type="button"
                onClick={() => showToast('✓ Options de transfert et réassignation du dossier')}
                title="Transférer ou réassigner le bénéficiaire"
                className="size-6 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowRightToLine className="size-3" />
              </button>
            </div>

            {/* Avatar circulaire silhouette + Nom complet */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="size-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                <User className="size-9 stroke-[1.5]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">
                  {b.firstName} {b.lastName}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Dossier n° {b.fileNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Bloc Milieu : Grille 2x2 des informations de suivi & statut */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            
            {/* Colonne 1 : Coach en haut / Groupe en bas */}
            <div className="flex flex-col justify-between divide-y divide-slate-200">
              {/* Case Coach */}
              <div className="p-4 space-y-1.5 flex-1">
                <span className="text-slate-500 text-xs">Coach :</span>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Award className="size-3.5 text-slate-700" />
                  </div>
                  <span className="font-semibold text-slate-800 text-xs tracking-wide">
                    {coachName}
                  </span>
                </div>
              </div>

              {/* Case Groupe */}
              <div className="p-4 flex-1 flex items-center">
                <span className="text-slate-600 text-xs">
                  {b.program?.name ? `Groupe : ${b.program.name}` : "Ce bénéficiaire n'est pas dans un groupe"}
                </span>
              </div>
            </div>

            {/* Colonne 2 : Prise de rendez-vous en haut / Portail en bas */}
            <div className="flex flex-col justify-between divide-y divide-slate-200">
              {/* Case Prise de rendez-vous + Bouton Activer */}
              <div className="p-4 flex items-center justify-between gap-3 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Calendar className="size-4 text-slate-600" />
                    <span className={`size-2 rounded-full absolute -top-0.5 -right-0.5 ${bookingEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  </div>
                  <span className="text-slate-700 text-xs">
                    Prise de rendez-vous {bookingEnabled ? 'activée' : 'désactivée'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !bookingEnabled;
                    setBookingEnabled(next);
                    showToast(`✓ Prise de rendez-vous ${next ? 'activée' : 'désactivée'}`);
                  }}
                  className="px-2.5 py-1 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-medium shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  {bookingEnabled ? 'Désactiver' : 'Activer'}
                </button>
              </div>

              {/* Case Portail bénéficiaire activé */}
              <div className="p-4 flex items-center gap-2.5 flex-1">
                <div className="size-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <User className="size-3.5" />
                </div>
                <span className="size-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-700 text-xs">Portail bénéficiaire activé</span>
              </div>
            </div>

          </div>

          {/* Bloc Droite : Compteur d'heures + Bouton "Créer un compteur" */}
          <div className="p-5 flex flex-col justify-center items-start gap-2.5 border-t lg:border-t-0 lg:border-l border-slate-200 min-w-[200px] bg-slate-50/40">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">Compteur d'heures</h3>
              {hourCounter ? (
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {hourCounter.totalHours}h allouées ({hourCounter.name})
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">Aucun compteur configuré</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsHourCounterModalOpen(true)}
              className="px-3.5 py-1.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              {hourCounter ? 'Modifier le compteur' : 'Créer un compteur'}
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          3. SYSTÈME DU DOUBLE BARREAU D'ONGLETS BLEU ARDOISE FONCÉ (#1e3347)
         ========================================================================= */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
        
        {/* NIVEAU 1 : Barre d'onglets principale foncé (#1e3347) */}
        <div className="bg-[#1e3347] flex flex-wrap items-center border-b border-[#182a3a]">
          
          {/* Suivi */}
          <button
            type="button"
            onClick={() => handleMainTabChange('suivi')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              mainTab === 'suivi'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Suivi
          </button>

          {/* Prestations */}
          <button
            type="button"
            onClick={() => handleMainTabChange('prestations')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              mainTab === 'prestations'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Prestations
          </button>

          {/* Notes */}
          <button
            type="button"
            onClick={() => handleMainTabChange('notes')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              mainTab === 'notes'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Notes
          </button>

          {/* Documents */}
          <button
            type="button"
            onClick={() => handleMainTabChange('documents')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              mainTab === 'documents'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Documents
          </button>

          {/* Évaluations */}
          <button
            type="button"
            onClick={() => handleMainTabChange('evaluations')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              mainTab === 'evaluations'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Évaluations
          </button>

          {/* Historique */}
          <button
            type="button"
            onClick={() => handleMainTabChange('historique')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              mainTab === 'historique'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Historique
          </button>

        </div>

        {/* NIVEAU 2 : Sous-barre (affichée lorsque l'onglet actif est "Suivi") */}
        {mainTab === 'suivi' && (
          <div className="bg-[#2d4763] flex flex-wrap items-center border-b border-[#23384f] text-xs text-slate-200">
            <button
              type="button"
              onClick={() => handleSuiviSubTabChange('rdv')}
              className={`px-6 py-2.5 transition-colors cursor-pointer ${
                suiviSubTab === 'rdv'
                  ? 'bg-[#1e3347] text-white font-medium shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Rendez-vous
            </button>
            <button
              type="button"
              onClick={() => handleSuiviSubTabChange('accompagnements')}
              className={`px-6 py-2.5 transition-colors cursor-pointer ${
                suiviSubTab === 'accompagnements'
                  ? 'bg-[#1e3347] text-white font-medium shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Accompagnements
            </button>
            <button
              type="button"
              onClick={() => handleSuiviSubTabChange('parcours')}
              className={`px-6 py-2.5 transition-colors cursor-pointer ${
                suiviSubTab === 'parcours'
                  ? 'bg-[#1e3347] text-white font-medium shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Parcours
            </button>
            <button
              type="button"
              onClick={() => handleSuiviSubTabChange('archives')}
              className={`px-6 py-2.5 transition-colors cursor-pointer ${
                suiviSubTab === 'archives'
                  ? 'bg-[#1e3347] text-white font-medium shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Archivés
            </button>
          </div>
        )}

        {/* =======================================================================
            CONTENU DE L'ONGLET : SUIVI -> RENDEZ-VOUS (Capture exacte de l'utilisateur)
           ======================================================================= */}
        {mainTab === 'suivi' && suiviSubTab === 'rdv' && (
          <div className="p-4 sm:p-6 space-y-5">
            
            {/* 2 Boutons corail sous les onglets : Activer la prise de RDV | Planifier des RDV */}
            <div className="flex flex-wrap items-center justify-end gap-3 pb-1">
              <button
                type="button"
                onClick={() => {
                  const next = !bookingEnabled;
                  setBookingEnabled(next);
                  showToast(`✓ Prise de rendez-vous ${next ? 'activée' : 'désactivée'}`);
                }}
                className="px-3.5 py-1.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Calendar className="size-3.5" />
                <span>Activer la prise de rendez-vous par le bénéficiaire</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAppointmentModalOpen(true)}
                className="px-3.5 py-1.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Calendar className="size-3.5" />
                <span>Planifier des rendez-vous</span>
              </button>
            </div>

            {/* Section 1 : Rendez-vous à venir */}
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-normal text-slate-800">
                Rendez-vous à venir
              </h3>

              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700">
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Date</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Parcours</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Étape ou titre</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Coach</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Type</th>
                      <th className="py-2.5 px-3 font-normal">Lieu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="size-11 rounded-full bg-[#23c3b1] text-white flex items-center justify-center mx-auto mb-3 shadow-2xs">
                            <Calendar className="size-5" />
                          </div>
                          <p className="text-xs text-slate-500 font-normal">
                            Il n'y a pas de rendez-vous
                          </p>
                        </td>
                      </tr>
                    ) : (
                      upcomingAppointments.map((appt: any) => {
                        const d = new Date(appt.datetime);
                        return (
                          <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">
                              {d.toLocaleDateString('fr-FR')} {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                              {b.program?.name || 'Parcours IML'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">
                              {appt.location || "Session d'accompagnement"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                              {coachName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                              Individuel
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {appt.location || 'En ligne / Visio'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2 : Rendez-vous à planifier (max 10) */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs sm:text-sm font-normal text-slate-800">
                Rendez-vous à planifier (max 10)
              </h3>

              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700">
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Date</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Parcours</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Étape ou titre</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Coach</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Type</th>
                      <th className="py-2.5 px-3 font-normal">Lieu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toPlanAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="size-11 rounded-full bg-[#23c3b1] text-white flex items-center justify-center mx-auto mb-3 shadow-2xs">
                            <Calendar className="size-5" />
                          </div>
                          <p className="text-xs text-slate-500 font-normal">
                            Il n'y a pas de rendez-vous
                          </p>
                        </td>
                      </tr>
                    ) : (
                      toPlanAppointments.map((appt: any) => (
                        <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">À définir</td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">{b.program?.name || 'Parcours IML'}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">{appt.location || "Séance à programmer"}</td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">{coachName}</td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">Individuel</td>
                          <td className="py-2.5 px-3 text-slate-600">—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================================
            SOUS-ONGLET : ACCOMPAGNEMENTS
           ======================================================================= */}
        {mainTab === 'suivi' && suiviSubTab === 'accompagnements' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Séances & Suivi d'accompagnement</h3>
              <button
                type="button"
                onClick={() => setIsRecordServiceModalOpen(true)}
                className="px-3.5 py-1.5 rounded bg-[#f06553] text-white font-medium hover:bg-[#e05341] flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Nouvelle séance</span>
              </button>
            </div>
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded border border-slate-200">
              <User className="size-8 mx-auto text-slate-400 mb-2" />
              <p className="font-medium text-slate-700">Aucun suivi direct enregistré pour le moment.</p>
              <p className="text-slate-400 text-[11px] mt-1">Les rendez-vous et sessions de coaching s'afficheront ici au fil du parcours.</p>
            </div>
          </div>
        )}

        {/* =======================================================================
            SOUS-ONGLET : PARCOURS
           ======================================================================= */}
        {mainTab === 'suivi' && suiviSubTab === 'parcours' && (
          <div className="p-6 space-y-4 text-xs">
            <h3 className="font-semibold text-slate-800 text-sm pb-2 border-b border-slate-100">
              Jalons & Progression du Parcours
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Diagnostic initial & Besoins', status: 'Terminé', date: new Date(b.createdAt).toLocaleDateString('fr-FR') },
                { title: 'Cadrage du modèle économique / Activité', status: 'En cours', date: 'En cours' },
                { title: 'Validation juridique & Formalités', status: 'À venir', date: 'Prochaine étape' },
                { title: 'Bilan d\'étape & Accompagnement de sortie', status: 'À venir', date: 'À planifier' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-[#23c3b1] text-white font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{step.title}</p>
                      <p className="text-[11px] text-slate-500">Échéance : {step.date}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                    step.status === 'Terminé' ? 'bg-emerald-100 text-emerald-800' :
                    step.status === 'En cours' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =======================================================================
            SOUS-ONGLET : ARCHIVÉS
           ======================================================================= */}
        {mainTab === 'suivi' && suiviSubTab === 'archives' && (
          <div className="p-12 text-center text-slate-400 text-xs">
            <FolderOpen className="size-10 mx-auto text-slate-300 mb-2" />
            <p>Aucun élément archivé pour ce bénéficiaire.</p>
          </div>
        )}

        {/* =======================================================================
            ONGLET PRINCIPAL : PRESTATIONS / HISTORIQUE (Image 1)
           ======================================================================= */}
        {(mainTab === 'prestations' || mainTab === 'historique') && (
          <div className="space-y-0">
            
            {/* Zone de commandes & filtres dates */}
            <div className="bg-[#f8fafc] p-4 sm:p-5 border-b border-slate-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                
                {/* Gauche : Filtres dates Du / Au / Filtrer */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-500" />
                    <span className="text-slate-600 font-medium">Du</span>
                    <input
                      type="text"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      placeholder="Ex : 00/00/..."
                      className="w-28 h-7 px-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f06553] shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-500" />
                    <span className="text-slate-600 font-medium">Au</span>
                    <input
                      type="text"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      placeholder="Ex : 00/00/..."
                      className="w-28 h-7 px-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f06553] shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`✓ Filtre appliqué : ${filteredPrestations.length} prestation(s)`)}
                    className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Filter className="size-3 fill-white" />
                    <span>Filtrer</span>
                  </button>
                </div>

                {/* Droite : 3 Boutons Corail */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTimesheetModalOpen(true)}
                      className="h-7 px-3 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="size-3.5" />
                      <span>Feuille de prestations</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="h-7 px-3 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Exporter</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRecordServiceModalOpen(true)}
                    className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5 stroke-[2.5]" />
                    <span>Ajouter une prestation</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Zone inférieure : Légende + Tableau des temps */}
            <div className="p-4 sm:p-5 space-y-3 bg-white">
              
              <div className="flex justify-end">
                <div className="border border-slate-200 rounded px-2.5 py-1 bg-white text-[11px] text-slate-500 shadow-2xs">
                  Légende: <span className="text-slate-700">h</span> = heures, <span className="text-slate-700">m</span> = minutes
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-xs text-left border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700 font-normal">
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[90px]">Date</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[140px]">Bénéficiaire</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[70px]">Dur...</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[120px]">Projet empl</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[120px]">Parcours</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[80px]">Soc...</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[180px]">Description</th>
                      <th className="py-2.5 px-3 font-normal text-center min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrestations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 font-normal">
                          Aucun temps enregistré pour ce bénéficiaire actuellement
                        </td>
                      </tr>
                    ) : (
                      filteredPrestations.map((pr) => (
                        <tr key={pr.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap border-r border-slate-100">{pr.beneficiaryName}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.duration}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.project}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.pathway}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.company}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate border-r border-slate-100" title={pr.description}>{pr.description}</td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeletePrestation(pr.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Supprimer cette prestation"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* =======================================================================
            ONGLET PRINCIPAL : NOTES
           ======================================================================= */}
        {mainTab === 'notes' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Notes d'accompagnement & Mémos</h3>
              <button
                type="button"
                onClick={() => setIsQuickNoteModalOpen(true)}
                className="px-3.5 py-1.5 rounded bg-[#f06553] text-white font-medium hover:bg-[#e05341] flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Ajouter une note</span>
              </button>
            </div>
            {quickNote ? (
              <div className="p-4 bg-amber-50/60 rounded-lg border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900 text-xs">Mémo de dossier</span>
                  <button onClick={() => setIsQuickNoteModalOpen(true)} className="text-amber-800 underline hover:text-amber-950">
                    Modifier
                  </button>
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{quickNote}</p>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 bg-slate-50 rounded border border-slate-200">
                <FileText className="size-8 mx-auto text-slate-300 mb-2" />
                <p>Aucune note enregistrée pour le moment.</p>
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            ONGLET PRINCIPAL : DOCUMENTS
           ======================================================================= */}
        {mainTab === 'documents' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Pièces jointes & Documents du bénéficiaire</h3>
              <button
                type="button"
                onClick={() => showToast('✓ Sélectionner un document à téléverser')}
                className="px-3.5 py-1.5 rounded bg-[#f06553] text-white font-medium hover:bg-[#e05341] flex items-center gap-1.5"
              >
                <UploadCloud className="size-3.5" />
                <span>Déposer un document</span>
              </button>
            </div>
            <div className="p-10 text-center text-slate-400 bg-slate-50 rounded border border-slate-200">
              <FileCheck className="size-8 mx-auto text-slate-300 mb-2" />
              <p>Aucun document attaché à ce dossier actuellement.</p>
            </div>
          </div>
        )}

        {/* =======================================================================
            ONGLET PRINCIPAL : ÉVALUATIONS
           ======================================================================= */}
        {mainTab === 'evaluations' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Grilles de diagnostic & Évaluations</h3>
              <button
                type="button"
                onClick={() => showToast('✓ Nouveau questionnaire ou évaluation')}
                className="px-3.5 py-1.5 rounded bg-[#f06553] text-white font-medium hover:bg-[#e05341] flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Nouvelle évaluation</span>
              </button>
            </div>
            <div className="p-10 text-center text-slate-400 bg-slate-50 rounded border border-slate-200">
              <CheckSquare className="size-8 mx-auto text-slate-300 mb-2" />
              <p>Aucune évaluation passée pour ce dossier.</p>
            </div>
          </div>
        )}

        {/* =======================================================================
            ONGLET PRINCIPAL : PRÉSENTATION & DOSSIER COMPLET
           ======================================================================= */}
        {mainTab === 'presentation' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : Contact & Suivi */}
              <div className="space-y-6 lg:col-span-1">
                <section className="bg-slate-50/70 rounded-lg border border-slate-200 p-5">
                  <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Informations Contact
                  </h2>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <User className="size-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-slate-700">{TYPE_LABELS[b.type]}</div>
                        <div className="text-[11px] text-slate-500">Type de profil</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="size-4 text-slate-400 mt-0.5" />
                      <div>
                        <a href={`mailto:${b.email}`} className="font-medium text-[#23c3b1] hover:underline">{b.email}</a>
                        <div className="text-[11px] text-slate-500">E-mail</div>
                      </div>
                    </div>
                    {b.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="size-4 text-slate-400 mt-0.5" />
                        <div>
                          <a href={`tel:${b.phone}`} className="font-medium text-slate-700 hover:underline">{b.phone}</a>
                          <div className="text-[11px] text-slate-500">Téléphone</div>
                        </div>
                      </div>
                    )}
                    {b.city && (
                      <div className="flex items-start gap-3">
                        <MapPin className="size-4 text-slate-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-700">{b.city}</div>
                          <div className="text-[11px] text-slate-500">Localisation</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-slate-50/70 rounded-lg border border-slate-200 p-5">
                  <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Suivi & Accompagnement
                  </h2>
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Statut actuel</div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Coach responsable</div>
                      <div className="font-medium text-slate-800">{coachName}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Programme d'incubation</div>
                      <div className="font-medium text-slate-800">
                        {b.program?.name || <span className="text-slate-400 italic">Aucun programme</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Niveau de priorité</div>
                      <div className="font-medium text-slate-800">{PRIORITY_LABELS[b.priority]}</div>
                    </div>
                    {b.startDate && (
                      <div>
                        <div className="text-[11px] text-slate-500 mb-0.5">Date de début d'accompagnement</div>
                        <div className="font-medium text-slate-800">{new Date(b.startDate).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Colonne droite : Projet & Besoins */}
              <div className="space-y-6 lg:col-span-2">
                {p ? (
                  <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 p-5">
                      <div className="flex items-center gap-3 mb-1.5">
                        <Building2 className="size-5 text-[#23c3b1]" />
                        <h2 className="text-lg font-bold text-slate-800">{p.name}</h2>
                      </div>
                      {p.sector && (
                        <div className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                          Secteur : {p.sector.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 text-xs">
                      <div className="mb-6">
                        <h3 className="font-semibold text-slate-800 mb-1.5">Description du projet</h3>
                        {p.description ? (
                          <p className="text-slate-600 whitespace-pre-line leading-relaxed">{p.description}</p>
                        ) : (
                          <p className="text-slate-400 italic">Aucune description fournie.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded border border-slate-100">
                        <div>
                          <div className="text-[11px] text-slate-500 mb-0.5">Stade d'avancement</div>
                          <div className="font-medium text-slate-800">{STAGE_LABELS[p.stage]}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 mb-0.5">Type de projet</div>
                          <div className="font-medium text-slate-800">{p.projectType || '—'}</div>
                        </div>
                        
                        {b.type === 'ENTREPRISE' && (
                          <>
                            <div>
                              <div className="text-[11px] text-slate-500 mb-0.5">Date de création</div>
                              <div className="font-medium text-slate-800">
                                {p.companyCreatedAt ? new Date(p.companyCreatedAt).toLocaleDateString('fr-FR') : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 mb-0.5">Statut Juridique</div>
                              <div className="font-medium text-slate-800">{p.legalStatus || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 mb-0.5">Taille</div>
                              <div className="font-medium text-slate-800">{p.companySize ? SIZE_LABELS[p.companySize] : '—'}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {p.priorityNeeds && (
                        <div className="mt-6 border-t border-slate-100 pt-5">
                          <h3 className="font-semibold text-slate-800 mb-1.5">Besoins prioritaires</h3>
                          <p className="text-slate-600 whitespace-pre-line leading-relaxed">{p.priorityNeeds}</p>
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
                    <FileText className="size-10 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-sm font-medium text-slate-800 mb-1">Aucun projet</h3>
                    <p className="text-slate-500 text-xs">Ce bénéficiaire n'a pas encore de projet associé.</p>
                  </div>
                )}

                {b.initialObjectives && (
                  <section className="bg-white rounded-lg border border-slate-200 p-5 text-xs">
                    <h2 className="font-semibold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                      Objectifs initiaux
                    </h2>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed">{b.initialObjectives}</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          BOUTONS D'ACTION FLOTTANTS EN BAS À DROITE (Identiques aux captures)
         ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Bouton 1 : Chronomètre / Enregistrer une prestation */}
        <button
          type="button"
          onClick={() => setIsRecordServiceModalOpen(true)}
          title="Pointer une prestation / Chrono"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer relative group"
        >
          <Clock className="size-5" />
          <Play className="size-2.5 fill-white text-white absolute bottom-2.5 right-2.5" />
        </button>

        {/* Bouton 2 : Bloc-notes rapide du dossier */}
        <button
          type="button"
          onClick={() => setIsQuickNoteModalOpen(true)}
          title="Note rapide pour ce bénéficiaire"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          <FileText className="size-5" />
        </button>

        {/* Bouton 3 : Messagerie */}
        <button
          type="button"
          onClick={() => navigate('/messages')}
          title="Messagerie instantanée"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          <MessageSquare className="size-5" />
        </button>
      </div>

      {/* =========================================================================
          MODALE : CRÉER UN COMPTEUR D'HEURES
         ========================================================================= */}
      {isHourCounterModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
                Compteur d'heures d'accompagnement
              </h3>
              <button
                type="button"
                onClick={() => setIsHourCounterModalOpen(false)}
                className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHourCounter} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Intitulé du forfait / programme
                </label>
                <input
                  type="text"
                  value={counterNameInput}
                  onChange={(e) => setCounterNameInput(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                  placeholder="Ex : Accompagnement Création d'Entreprise"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Volume horaire alloué (en heures)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={counterHoursInput}
                  onChange={(e) => setCounterHoursInput(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#f06553]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHourCounterModalOpen(false)}
                  className="h-8 px-4 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Enregistrer le compteur
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODALE : GESTION DES CLÉS & ACCÈS PORTAIL
         ========================================================================= */}
      {isKeyModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-[#f06553]" />
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Accès Portail · {b.firstName} {b.lastName}
                </h3>
              </div>
              <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] block">Identifiant de connexion :</span>
                <span className="font-medium text-slate-800">{b.email}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Le portail bénéficiaire est actuellement actif.</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast('✓ E-mail de réinitialisation du mot de passe envoyé');
                    setIsKeyModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded bg-[#f06553] text-white hover:bg-[#e05341] font-medium text-xs shadow-2xs"
                >
                  Renvoyer les accès
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODALE : ENREGISTRER UNE PRESTATION (+ Ajouter une prestation)
         ========================================================================= */}
      <RecordServiceModal
        isOpen={isRecordServiceModalOpen}
        onClose={() => setIsRecordServiceModalOpen(false)}
        onSuccess={() => {
          refetchAppointments();
          showToast('✓ Prestation enregistrée avec succès');
          setIsRecordServiceModalOpen(false);
        }}
        defaultBeneficiaryId={b.id}
        defaultBeneficiaryName={`${b.firstName} ${b.lastName}`}
      />

      {/* =========================================================================
          MODALE : PLANIFIER UN RENDEZ-VOUS
         ========================================================================= */}
      <CreateAppointmentWizardModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={() => {
          refetchAppointments();
          showToast('✓ Rendez-vous planifié avec succès');
          setIsAppointmentModalOpen(false);
        }}
        defaultBeneficiaryId={b.id}
      />

      {/* =========================================================================
          MODALE : FEUILLE DE PRESTATIONS
         ========================================================================= */}
      {isTimesheetModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">
                    Feuille de prestations
                  </h3>
                  <p className="text-[11px] text-slate-500">Bénéficiaire : {b.firstName} {b.lastName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimesheetModalOpen(false)}
                className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded border border-slate-200">
                <div>
                  <p className="text-slate-500 text-[11px]">Période</p>
                  <p className="font-semibold text-slate-800">
                    Mois en cours ({new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px]">Total d'heures enregistrées</p>
                  <p className="font-bold text-[#f06553] text-sm">
                    {filteredPrestations.length > 0 ? `${filteredPrestations.length} session(s)` : '0h 00m'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                      <th className="p-2 border-b border-slate-200">Date</th>
                      <th className="p-2 border-b border-slate-200">Projet</th>
                      <th className="p-2 border-b border-slate-200">Durée</th>
                      <th className="p-2 border-b border-slate-200">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPrestations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          Aucune prestation pour ce mois.
                        </td>
                      </tr>
                    ) : (
                      filteredPrestations.map(pr => (
                        <tr key={pr.id}>
                          <td className="p-2 text-slate-600">{pr.date}</td>
                          <td className="p-2 font-medium text-slate-800">{pr.project}</td>
                          <td className="p-2 text-slate-600">{pr.duration}</td>
                          <td className="p-2 text-slate-600">{pr.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>Télécharger l'état (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODALE : NOTE RAPIDE DU DOSSIER
         ========================================================================= */}
      {isQuickNoteModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                  <FileText className="size-3.5" />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Bloc-notes rapide · {b.firstName} {b.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickNoteModalOpen(false)}
                className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                  Mémo & Notes d'accompagnement internes
                </label>
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  rows={6}
                  placeholder="Écrivez vos notes de suivi, observations ou rappels pour ce bénéficiaire..."
                  className="w-full text-xs p-3 rounded border border-slate-200 focus:outline-none focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="h-8 px-4 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODALE : VISIOCONFÉRENCE RAPIDE
         ========================================================================= */}
      {isVideoModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-[#f06553]" />
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Entretien Vidéo · {b.firstName} {b.lastName}
                </h3>
              </div>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs text-slate-600">
              <p>Lien de visioconférence sécurisé pour ce bénéficiaire :</p>
              <div className="p-2.5 bg-slate-100 rounded border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all">
                https://meet.iml-digit.com/dossier-{b.id.slice(0, 8)}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`https://meet.iml-digit.com/dossier-${b.id.slice(0, 8)}`);
                    showToast('✓ Lien de visio copié dans le presse-papier');
                    setIsVideoModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded bg-[#f06553] text-white hover:bg-[#e05341] font-medium text-xs shadow-2xs"
                >
                  Copier le lien
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          TOAST NOTIFICATION FLOTTANT
         ========================================================================= */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-6 z-[80] animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#23c3b1] animate-ping" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
