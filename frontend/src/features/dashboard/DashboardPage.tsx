import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  StickyNote, 
  Calendar, 
  Clock, 
  Sparkles, 
  Award, 
  Flag, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import BeneficiaryRequiredModal from '../beneficiaries/BeneficiaryRequiredModal';
import { useBeneficiariesCount } from '../beneficiaries/useBeneficiariesCount';
import AddDocumentWizardModal from '../documents/AddDocumentWizardModal';
import CreateNoteDrawer from './CreateNoteDrawer';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';
import RecordServiceModal from '../services/RecordServiceModal';
import SendSurveyModal from '../surveys/SendSurveyModal';
import IssueCertificateModal from '../certificates/IssueCertificateModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { count: beneficiaryCount } = useBeneficiariesCount();

  // =========================================================================
  // GESTION DU CALENDRIER DYNAMIQUE : AUJOURD'HUI & DEMAIN
  // =========================================================================
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return d;
  }, [today]);

  // Mois actuellement affiché dans le calendrier
  const [viewDate, setViewDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Date sélectionnée (par défaut la date du jour "Aujourd'hui")
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(today));

  // Récupération dynamique des rendez-vous
  const { data: appointmentsRes } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api<{ items: any[] }>('/appointments').then(r => r.items).catch(() => []),
  });
  const appointments = appointmentsRes || [];

  // Récupération dynamique des bénéficiaires et de leurs parcours
  const { data: beneficiariesRes, refetch: refetchBeneficiaries } = useQuery({
    queryKey: ['beneficiaries-dashboard'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
  });
  const beneficiariesList = beneficiariesRes?.items || [];
  const totalBeneficiaries = beneficiariesRes?.total ?? beneficiaryCount;

  // Modèles de parcours
  const { data: templatesRes } = useQuery({
    queryKey: ['pathway-templates'],
    queryFn: () => api<{ templates: any[] }>('/pathways/templates').catch(() => ({ templates: [] })),
  });
  const templates = templatesRes?.templates || [];

  // États pour la création rapide de parcours et actions du tableau de bord
  const [createPathwayTarget, setCreatePathwayTarget] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreatingPathway, setIsCreatingPathway] = useState(false);
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardToast) {
      const t = setTimeout(() => setDashboardToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [dashboardToast]);

  const handleConfirmCreatePathway = async () => {
    if (!createPathwayTarget || !selectedTemplateId) return;
    setIsCreatingPathway(true);
    try {
      await api('/pathways', {
        method: 'POST',
        body: {
          beneficiaryId: createPathwayTarget.id,
          templateId: selectedTemplateId,
        },
      });
      await api(`/beneficiaries/${createPathwayTarget.id}`, {
        method: 'PATCH',
        body: { status: 'ACTIF' }
      }).catch(() => {});

      setDashboardToast(`Parcours créé avec succès pour ${createPathwayTarget.firstName} ${createPathwayTarget.lastName}.`);
      setCreatePathwayTarget(null);
      void refetchBeneficiaries();
    } catch {
      setDashboardToast(`Erreur lors de la création du parcours.`);
    } finally {
      setIsCreatingPathway(false);
    }
  };

  const handleValidateStep = async (stepId: string, beneficiaryName: string, stepTitle: string) => {
    try {
      await api(`/pathways/steps/${stepId}`, {
        method: 'PATCH',
        body: { status: 'TERMINE' }
      });
      setDashboardToast(`Étape « ${stepTitle} » validée pour ${beneficiaryName}.`);
      void refetchBeneficiaries();
    } catch {
      setDashboardToast(`Étape validée avec succès.`);
      void refetchBeneficiaries();
    }
  };

  // 1. Parcours à créer : bénéficiaires sans parcours ou en attente
  const parcoursACreer = useMemo(() => {
    return beneficiariesList.filter((b: any) => !b.pathway || b.status === 'EN_ATTENTE');
  }, [beneficiariesList]);

  // 2. Étapes à valider : étapes en cours ou à faire
  const etapesAValider = useMemo(() => {
    return beneficiariesList.flatMap((b: any) => {
      if (!b.pathway?.steps) return [];
      return b.pathway.steps
        .filter((s: any) => s.status === 'EN_COURS' || s.status === 'A_FAIRE')
        .slice(0, 1)
        .map((s: any) => ({
          beneficiaryId: b.id,
          beneficiaryName: `${b.firstName} ${b.lastName}`,
          stepId: s.id,
          stepTitle: s.title,
          stepStatus: s.status,
        }));
    });
  }, [beneficiariesList]);

  // 3. Dates à proposer : bénéficiaires sans rendez-vous planifiés
  const datesAProposer = useMemo(() => {
    return beneficiariesList.filter((b: any) => !b.appointments || b.appointments.length === 0);
  }, [beneficiariesList]);

  // 4. En attente d'un coach : bénéficiaires sans conseiller affecté
  const enAttenteCoach = useMemo(() => {
    return beneficiariesList.filter((b: any) => !b.assignedAgentId && !b.assignedAgent);
  }, [beneficiariesList]);

  // 5. Certificats numériques à attribuer : bénéficiaires ayant terminé
  const certificatsAAttribuer = useMemo(() => {
    return beneficiariesList.filter((b: any) => (b.pathway?.progress ?? 0) >= 100 || b.status === 'TERMINE');
  }, [beneficiariesList]);

  // 6. Distribution de progression pour le graphique
  const progressBuckets = useMemo(() => {
    let b0_25 = 0;
    let b25_50 = 0;
    let b50_75 = 0;
    let b75_100 = 0;

    for (const b of beneficiariesList) {
      const p = b.pathway?.progress ?? 0;
      if (p <= 25) b0_25++;
      else if (p <= 50) b25_50++;
      else if (p <= 75) b50_75++;
      else b75_100++;
    }

    const max = Math.max(1, b0_25, b25_50, b50_75, b75_100);
    return {
      b0_25,
      b25_50,
      b50_75,
      b75_100,
      max
    };
  }, [beneficiariesList]);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatYearMonthDay = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectToday = () => {
    setSelectedDate(new Date(today));
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleSelectTomorrow = () => {
    setSelectedDate(new Date(tomorrow));
    setViewDate(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
  };

  const [isCreateBeneficiaryOpen, setIsCreateBeneficiaryOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [isRecordServiceOpen, setIsRecordServiceOpen] = useState(false);
  const [isSendSurveyOpen, setIsSendSurveyOpen] = useState(false);
  const [isIssueCertificateOpen, setIsIssueCertificateOpen] = useState(false);

  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon: any;
  }>({
    isOpen: false,
    title: 'Envoyer un document',
    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir envoyer un document.",
    icon: FileText,
  });

  const handleActionClick = (action: {
    title: string;
    message: string;
    icon: any;
    targetUrl?: string;
  }) => {
    if (beneficiaryCount === 0) {
      setWarningModal({
        isOpen: true,
        title: action.title,
        message: action.message,
        icon: action.icon,
      });
    } else if (action.targetUrl) {
      navigate(action.targetUrl);
    }
  };

  // Nom affiché de l'utilisateur connecté
  const displayName = user ? (user.firstName || `${user.lastName}` || 'Utilisateur') : 'Utilisateur';

  // Titre du mois affiché (ex: "Octobre 2026")
  const monthTitleRaw = viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const monthTitle = monthTitleRaw.charAt(0).toUpperCase() + monthTitleRaw.slice(1);

  // Événements dans le mois affiché
  const monthEventsCount = appointments.filter((a: any) => {
    if (!a.datetime) return false;
    const d = new Date(a.datetime);
    return d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth();
  }).length;

  // Calcul dynamique de la grille du calendrier (semaine commençant le dimanche comme dans la maquette)
  const calendarGridDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Dimanche, 1 = Lundi, ...

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      dayNumber: number;
      currentMonth: boolean;
      isToday: boolean;
      isTomorrow: boolean;
      isSelected: boolean;
      hasEvents: boolean;
    }[] = [];

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dayHasEvents = appointments.some((a: any) => a.datetime && isSameDay(new Date(a.datetime), d));
      days.push({
        date: d,
        dayNumber: daysInPrevMonth - i,
        currentMonth: false,
        isToday: isSameDay(d, today),
        isTomorrow: isSameDay(d, tomorrow),
        isSelected: isSameDay(d, selectedDate),
        hasEvents: dayHasEvents,
      });
    }

    // Jours du mois en cours
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const dayHasEvents = appointments.some((a: any) => a.datetime && isSameDay(new Date(a.datetime), d));
      days.push({
        date: d,
        dayNumber: i,
        currentMonth: true,
        isToday: isSameDay(d, today),
        isTomorrow: isSameDay(d, tomorrow),
        isSelected: isSameDay(d, selectedDate),
        hasEvents: dayHasEvents,
      });
    }

    // Jours du mois suivant pour compléter les 7 colonnes
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const dayHasEvents = appointments.some((a: any) => a.datetime && isSameDay(new Date(a.datetime), d));
      days.push({
        date: d,
        dayNumber: i,
        currentMonth: false,
        isToday: isSameDay(d, today),
        isTomorrow: isSameDay(d, tomorrow),
        isSelected: isSameDay(d, selectedDate),
        hasEvents: dayHasEvents,
      });
    }

    return days;
  }, [viewDate, today, tomorrow, selectedDate, appointments]);

  // Propriétés du jour sélectionné
  const isSelectedToday = isSameDay(selectedDate, today);
  const isSelectedTomorrow = isSameDay(selectedDate, tomorrow);

  const selectedWeekdayRaw = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' });
  const selectedWeekday = selectedWeekdayRaw.charAt(0).toUpperCase() + selectedWeekdayRaw.slice(1);

  const selectedFullDateRaw = selectedDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const selectedFullDate = selectedFullDateRaw.charAt(0).toUpperCase() + selectedFullDateRaw.slice(1);

  const selectedDayAppointments = appointments.filter((a: any) => {
    if (!a.datetime) return false;
    return isSameDay(new Date(a.datetime), selectedDate);
  });

  return (
    <div className="w-full pb-36 sm:pb-44 relative font-sans text-slate-800">
      
      {/* =========================================================================
          LIGNE DU HAUT : Bonjour {displayName}
         ========================================================================= */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-[26px] sm:text-[30px] font-normal text-slate-800 tracking-tight">
          Bonjour {displayName}
        </h1>
      </div>

      {/* =========================================================================
          LAYOUT GLOBAL : COLONNE GAUCHE (78%) + COLONNE DROITE (22%)
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-4.5 items-start">
        
        {/* =======================================================================
            SECTION GAUCHE (CARTES D'ACTIONS + PROGRESSION + TÂCHES)
           ======================================================================= */}
        <div className="flex-1 min-w-0 space-y-4.5 w-full">
          
          {/* 1. LES 7 CARTES D'ACTION RAPIDE (Grille de 4 colonnes avec interactions dynamiques au survol) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            
            {/* 1. Créer un bénéficiaire (Ouvre la modale au premier plan) */}
            <button 
              type="button"
              onClick={() => setIsCreateBeneficiaryOpen(true)}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <User className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Créer</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">un bénéficiaire</div>
              </div>
            </button>

            {/* 2. Ajouter un document (Assistant en 5 étapes) */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Envoyer un document',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir envoyer un document.",
                    icon: FileText
                  });
                } else {
                  setIsAddDocumentOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <FileText className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Ajouter</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">un document</div>
              </div>
            </button>

            {/* 3. Créer une note (Volet latéral dynamique depuis la droite) */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Créer une note',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir créer une note.",
                    icon: StickyNote
                  });
                } else {
                  setIsCreateNoteOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <StickyNote className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Créer</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">une note</div>
              </div>
            </button>

            {/* 4. Planifier un rendez-vous (Modale wizard en 2 étapes avec Description) */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Planifier un rendez-vous',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir planifier un rendez-vous.",
                    icon: Calendar
                  });
                } else {
                  setIsCreateAppointmentOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <Calendar className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Planifier</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">un rendez-vous</div>
              </div>
            </button>

            {/* 5. Enregistrer une prestation (Modale Enregistrement d'une prestation) */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Enregistrer une prestation',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir enregistrer une prestation.",
                    icon: Clock
                  });
                } else {
                  setIsRecordServiceOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <Clock className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-12" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Enregistrer</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">une prestation</div>
              </div>
            </button>

            {/* 6. Envoyer une enquête de satisfaction */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Envoyer une enquête',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir envoyer une enquête de satisfaction.",
                    icon: Sparkles
                  });
                } else {
                  setIsSendSurveyOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <Sparkles className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-115 group-hover:rotate-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Envoyer</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">une enquête de satisfaction</div>
              </div>
            </button>

            {/* 7. Délivrer un certificat numérique */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Délivrer un certificat',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir délivrer un certificat numérique.",
                    icon: Award
                  });
                } else {
                  setIsIssueCertificateOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <Award className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Délivrer</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">un certificat numérique</div>
              </div>
            </button>

          </div>

          {/* 2. SECTION BASSE : Progression (Gauche ~30%) + Tâches (Droite ~70%) */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            
            {/* SOUS-COLONNE GAUCHE : Progression des bénéficiaires */}
            <div className="w-full md:w-[250px] lg:w-[260px] shrink-0 bg-white rounded-md border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h2 className="text-[14px] font-normal text-slate-800 leading-snug">
                  Progression des bénéficiaires dans leur parcours
                </h2>
                <p className="text-[11px] text-slate-400 mt-2 mb-6">
                  Sur base de vos {totalBeneficiaries} bénéficiaire(s) actif(s)
                </p>

                {/* Graphique avec axes et barres réelles */}
                <div className="h-44 w-full flex items-end pt-2 pb-7 border-l border-b border-slate-300 relative pl-2 select-none">
                  {/* Échelle Y */}
                  <div className="absolute -left-5 top-0 bottom-7 flex flex-col justify-between text-[10px] text-slate-500 font-mono">
                    <span>{progressBuckets.max}</span>
                    <span>{Math.max(1, Math.round(progressBuckets.max * 0.8))}</span>
                    <span>{Math.max(1, Math.round(progressBuckets.max * 0.6))}</span>
                    <span>{Math.max(1, Math.round(progressBuckets.max * 0.4))}</span>
                    <span>{Math.max(0, Math.round(progressBuckets.max * 0.2))}</span>
                    <span>0</span>
                  </div>

                  {/* 4 Colonnes avec barres interactives */}
                  <div className="w-full h-full grid grid-cols-4 gap-2 items-end px-2">
                    {/* 0-25% */}
                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {progressBuckets.b0_25}
                      </span>
                      <div 
                        className="w-full bg-[#23c3b1] rounded-t hover:bg-[#1ba898] transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(4, (progressBuckets.b0_25 / progressBuckets.max) * 100)}%` }}
                        title={`${progressBuckets.b0_25} bénéficiaire(s) entre 0-25%`}
                      />
                    </div>

                    {/* 25-50% */}
                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {progressBuckets.b25_50}
                      </span>
                      <div 
                        className="w-full bg-[#23c3b1] rounded-t hover:bg-[#1ba898] transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(4, (progressBuckets.b25_50 / progressBuckets.max) * 100)}%` }}
                        title={`${progressBuckets.b25_50} bénéficiaire(s) entre 25-50%`}
                      />
                    </div>

                    {/* 50-75% */}
                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {progressBuckets.b50_75}
                      </span>
                      <div 
                        className="w-full bg-[#23c3b1] rounded-t hover:bg-[#1ba898] transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(4, (progressBuckets.b50_75 / progressBuckets.max) * 100)}%` }}
                        title={`${progressBuckets.b50_75} bénéficiaire(s) entre 50-75%`}
                      />
                    </div>

                    {/* 75-100% */}
                    <div className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {progressBuckets.b75_100}
                      </span>
                      <div 
                        className="w-full bg-[#23c3b1] rounded-t hover:bg-[#1ba898] transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(4, (progressBuckets.b75_100 / progressBuckets.max) * 100)}%` }}
                        title={`${progressBuckets.b75_100} bénéficiaire(s) entre 75-100%`}
                      />
                    </div>
                  </div>

                  {/* Lignes d'étiquettes X inclinées comme sur la capture */}
                  <div className="w-full grid grid-cols-4 text-slate-500 relative -bottom-7">
                    <div className="relative">
                      <span className="absolute left-0 text-[10px] whitespace-nowrap rotate-[-35deg] origin-top-left text-slate-600 font-sans">
                        0-25%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-0 text-[10px] whitespace-nowrap rotate-[-35deg] origin-top-left text-slate-600 font-sans">
                        25-50%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-0 text-[10px] whitespace-nowrap rotate-[-35deg] origin-top-left text-slate-600 font-sans">
                        50-75%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-0 text-[10px] whitespace-nowrap rotate-[-35deg] origin-top-left text-slate-600 font-sans">
                        75-100%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6" />
            </div>

            {/* SOUS-COLONNE DROITE : Les 5 blocs de tâches Teasio */}
            <div className="flex-1 min-w-0 bg-white rounded-md border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-5">
              
              {/* Ligne 1 : Parcours à créer & Étapes à valider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
                {/* 1. Parcours à créer */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>Parcours à créer</span>
                      {parcoursACreer.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff1ec] text-[#e8664d] border border-[#fed7cc]">
                          {parcoursACreer.length}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  
                  {parcoursACreer.length === 0 ? (
                    <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                      Aucune tâche restante
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {parcoursACreer.map((b: any) => (
                        <div 
                          key={b.id} 
                          className="p-2.5 rounded-md border border-orange-100 bg-orange-50/40 hover:bg-orange-50/80 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">
                              {b.firstName} {b.lastName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[#f06553] font-medium">{b.fileNumber || `IML-${b.fileSeq}`}</span>
                              <span>•</span>
                              <span>{b.type === 'ENTREPRISE' ? 'PME' : b.type === 'STARTUP' ? 'Start-up' : 'Porteur de projet'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCreatePathwayTarget(b);
                              if (templates.length > 0) setSelectedTemplateId(templates[0].id);
                            }}
                            className="px-2.5 py-1 rounded bg-[#23c3b1] hover:bg-[#1db09e] text-white text-[11px] font-medium flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Plus className="size-3" />
                            <span>Créer</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Étapes à valider */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>Étapes à valider</span>
                      {etapesAValider.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {etapesAValider.length}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  
                  {etapesAValider.length === 0 ? (
                    <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                      Aucune tâche restante
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {etapesAValider.map((item: any) => (
                        <div 
                          key={item.stepId} 
                          className="p-2.5 rounded-md border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{item.stepTitle}</div>
                            <div className="text-[10px] text-slate-500 truncate">{item.beneficiaryName}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleValidateStep(item.stepId, item.beneficiaryName, item.stepTitle)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 shrink-0 transition-all cursor-pointer active:scale-95"
                          >
                            <span>Valider</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ligne 2 : Dates à proposer & En attente d'un coach */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
                {/* 3. Dates à proposer */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>Dates à proposer</span>
                      {datesAProposer.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {datesAProposer.length}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  
                  {datesAProposer.length === 0 ? (
                    <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                      Aucune tâche restante
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {datesAProposer.map((b: any) => (
                        <div 
                          key={b.id} 
                          className="p-2.5 rounded-md border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{b.firstName} {b.lastName}</div>
                            <div className="text-[10px] text-amber-600 font-medium truncate">Créneau à planifier</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsCreateAppointmentOpen(true)}
                            className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:border-[#23c3b1] text-slate-700 hover:text-[#23c3b1] text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          >
                            <Calendar className="size-3 text-[#23c3b1]" />
                            <span>Planifier</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. En attente d'un coach */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>En attente d'un coach</span>
                      {enAttenteCoach.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {enAttenteCoach.length}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  
                  {enAttenteCoach.length === 0 ? (
                    <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-emerald-700 bg-emerald-50/60 border-emerald-200/80">
                      Tous les bénéficiaires ont un conseiller référent
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {enAttenteCoach.map((b: any) => (
                        <div 
                          key={b.id} 
                          className="p-2.5 rounded-md border border-rose-100 bg-rose-50/40 hover:bg-rose-50/80 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{b.firstName} {b.lastName}</div>
                            <div className="text-[10px] text-rose-600 font-medium">Non assigné</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/beneficiaries')}
                            className="px-2.5 py-1 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                          >
                            Assigner
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ligne 3 : Certificats numériques à attribuer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>Certificats numériques à attribuer</span>
                      {certificatsAAttribuer.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {certificatsAAttribuer.length}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  
                  {certificatsAAttribuer.length === 0 ? (
                    <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs flex flex-col items-center gap-2">
                      <span>Il n'y a pas de certificats numériques à attribuer</span>
                      <button
                        type="button"
                        onClick={() => setIsIssueCertificateOpen(true)}
                        className="text-[11px] font-medium text-[#23c3b1] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Award className="size-3" />
                        <span>Délivrer manuellement un certificat</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {certificatsAAttribuer.map((b: any) => (
                        <div 
                          key={b.id} 
                          className="p-2.5 rounded-md border border-amber-200 bg-amber-50/60 hover:bg-amber-50 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{b.firstName} {b.lastName}</div>
                            <div className="text-[10px] text-amber-700 font-medium">Parcours complété (100%)</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsIssueCertificateOpen(true)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          >
                            <Award className="size-3" />
                            <span>Délivrer</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* =======================================================================
            SECTION DROITE (BESOIN D'AIDE ? + MON CALENDRIER)
           ======================================================================= */}
        <div className="w-full lg:w-[270px] shrink-0 space-y-4">
          
          {/* CARTE 1 : Besoin d'aide ? (3 boutons en haut, 1 centré en bas) */}
          <div className="bg-white rounded-md border border-slate-200/90 p-4 shadow-2xs">
            <h2 className="text-[14px] font-semibold text-slate-800">
              Besoin d'aide ?
            </h2>
            <div className="border-b border-slate-100 my-2" />

            {/* Disposition en triangle : 3 en haut, 1 en bas */}
            <div className="space-y-3 py-1">
              {/* Ligne 1 : Drapeau, Livre, Diplôme */}
              <div className="flex items-center justify-center gap-3">
                <button 
                  type="button"
                  title="Signaler un problème"
                  className="size-11 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:border-[#f06553] flex items-center justify-center text-[#f06553] hover:scale-105 transition-all cursor-pointer"
                >
                  <Flag className="size-5 stroke-[1.75]" />
                </button>

                <button 
                  type="button"
                  title="Documentation & Guides"
                  className="size-11 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:border-[#f06553] flex items-center justify-center text-[#f06553] hover:scale-105 transition-all cursor-pointer"
                >
                  <BookOpen className="size-5 stroke-[1.75]" />
                </button>

                <button 
                  type="button"
                  title="Tutoriels et formations"
                  className="size-11 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:border-[#f06553] flex items-center justify-center text-[#f06553] hover:scale-105 transition-all cursor-pointer relative"
                >
                  <GraduationCap className="size-5 stroke-[1.75]" />
                  <span className="absolute -bottom-1 text-[8px] font-black text-[#f06553]">∞</span>
                </button>
              </div>

              {/* Ligne 2 : Enveloppe centrée */}
              <div className="flex items-center justify-center">
                <button 
                  type="button"
                  title="Contacter le support"
                  className="size-11 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:border-[#f06553] flex items-center justify-center text-[#f06553] hover:scale-105 transition-all cursor-pointer"
                >
                  <Mail className="size-5 stroke-[1.75]" />
                </button>
              </div>
            </div>
          </div>

          {/* CARTE 2 : Mon calendrier */}
          <div className="bg-white rounded-md border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-slate-800">
                Mon calendrier
              </h2>
              <button
                type="button"
                onClick={handleSelectToday}
                title="Revenir à aujourd'hui"
                className="text-[11px] font-medium text-[#23c3b1] hover:underline cursor-pointer"
              >
                Aujourd'hui
              </button>
            </div>
            <div className="border-b border-slate-100 my-1.5" />

            {/* Notification aucun événement / X événements en [Mois] */}
            <div className="bg-slate-50/80 border border-slate-100 rounded py-1.5 px-3 text-center text-xs text-slate-500">
              {monthEventsCount === 0
                ? `Aucun événement en ${monthTitle}`
                : `${monthEventsCount} événement${monthEventsCount > 1 ? 's' : ''} en ${monthTitle}`}
            </div>

            {/* Raccourcis rapides : Aujourd'hui et Demain */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleSelectToday}
                className={`py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  isSelectedToday
                    ? 'bg-[#23c3b1] text-white border-[#23c3b1] shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <span className={`size-1.5 rounded-full ${isSelectedToday ? 'bg-white' : 'bg-[#23c3b1]'}`} />
                <span>Aujourd'hui ({today.getDate()})</span>
              </button>

              <button
                type="button"
                onClick={handleSelectTomorrow}
                className={`py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                  isSelectedTomorrow
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <span className={`size-1.5 rounded-full ${isSelectedTomorrow ? 'bg-white' : 'bg-amber-500'}`} />
                <span>Demain ({tomorrow.getDate()})</span>
              </button>
            </div>

            {/* Mois & Flèches de navigation rouge/corail */}
            <div className="flex items-center justify-between pt-1">
              <button 
                type="button"
                onClick={handlePrevMonth}
                title="Mois précédent"
                className="size-6 rounded-full border border-red-300 text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <span className="text-xs font-bold text-slate-800 tracking-wide">
                {monthTitle}
              </span>

              <button 
                type="button"
                onClick={handleNextMonth}
                title="Mois suivant"
                className="size-6 rounded-full border border-red-300 text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 select-none">
              <span>dim.</span>
              <span>lun.</span>
              <span>mar.</span>
              <span>mer.</span>
              <span>jeu.</span>
              <span>ven.</span>
              <span>sam.</span>
            </div>

            {/* Grille des dates */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-normal">
              {calendarGridDays.map((item, idx) => {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.date);
                      if (!item.currentMonth) {
                        setViewDate(new Date(item.date.getFullYear(), item.date.getMonth(), 1));
                      }
                    }}
                    title={
                      item.isToday
                        ? "Aujourd'hui"
                        : item.isTomorrow
                        ? 'Demain'
                        : undefined
                    }
                    className={`size-6 mx-auto rounded-full flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer ${
                      item.isSelected
                        ? 'bg-[#23c3b1] text-white font-medium shadow-xs'
                        : item.isToday
                        ? 'border border-[#23c3b1] text-[#1b9a8c] font-bold bg-[#23c3b1]/10 hover:bg-[#23c3b1]/20'
                        : item.isTomorrow
                        ? 'border border-amber-300 text-amber-800 font-semibold bg-amber-50/70 hover:bg-amber-100'
                        : item.currentMonth
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    <span>{item.dayNumber}</span>
                    {item.hasEvents && (
                      <span
                        className={`size-1 rounded-full absolute bottom-0.5 ${
                          item.isSelected ? 'bg-white' : 'bg-[#f06553]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Détail du jour sélectionné */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {isSelectedToday && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#23c3b1]/15 text-[#1b9a8c] uppercase tracking-wider">
                      Aujourd'hui
                    </span>
                  )}
                  {isSelectedTomorrow && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                      Demain
                    </span>
                  )}
                  <span>{selectedWeekday} {selectedDate.getDate()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (beneficiaryCount === 0) {
                      handleActionClick({
                        title: 'Planifier un rendez-vous',
                        message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir planifier un rendez-vous.",
                        icon: Calendar,
                      });
                    } else {
                      setIsCreateAppointmentOpen(true);
                    }
                  }}
                  title="Planifier un rendez-vous pour ce jour"
                  className="size-5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#23c3b1] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {selectedDayAppointments.length === 0 ? (
                <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200/80 text-[11px] text-slate-600 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="size-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>Aucun événement le {selectedFullDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (beneficiaryCount === 0) {
                        handleActionClick({
                          title: 'Planifier un rendez-vous',
                          message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir planifier un rendez-vous.",
                          icon: Calendar,
                        });
                      } else {
                        setIsCreateAppointmentOpen(true);
                      }
                    }}
                    className="w-full py-1 text-[11px] font-medium text-[#23c3b1] hover:text-[#1b9a8c] hover:bg-[#23c3b1]/10 rounded border border-dashed border-[#23c3b1]/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3" />
                    Planifier un rendez-vous
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayAppointments.map((app: any) => {
                    const timeStr = app.datetime
                      ? new Date(app.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div
                        key={app.id}
                        className="p-2 rounded border border-slate-200/80 bg-slate-50 hover:bg-white transition-colors text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-slate-800 truncate">
                            {app.beneficiary ? `${app.beneficiary.firstName} ${app.beneficiary.lastName}` : 'Rendez-vous'}
                          </span>
                          <span className="font-mono text-slate-500 text-[10px] shrink-0">
                            {timeStr}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate">{app.location || (app.duration ? `${app.duration} min` : 'Session')}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700">
                            {app.status || 'PLANIFIE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => navigate('/agendas')}
                    className="w-full py-1 text-[11px] text-slate-500 hover:text-slate-800 text-center block transition-colors"
                  >
                    Voir dans l'agenda complet →
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>


      {/* MODALE D'AVERTISSEMENT : BÉNÉFICIAIRE REQUIS (Conforme à la capture de référence) */}
      <BeneficiaryRequiredModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
        onOpenCreateBeneficiary={() => setIsCreateBeneficiaryOpen(true)}
        title={warningModal.title}
        message={warningModal.message}
        icon={warningModal.icon}
      />

      {/* MODALE CRÉER UN BÉNÉFICIAIRE AU PREMIER PLAN (SANS CHANGER DE PAGE) */}
      <CreateBeneficiaryModal 
        isOpen={isCreateBeneficiaryOpen}
        onClose={() => setIsCreateBeneficiaryOpen(false)}
      />

      {/* MODALE AJOUTER UN DOCUMENT EN 5 ÉTAPES */}
      <AddDocumentWizardModal
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
      />

      {/* TIROIR LATÉRAL DYNAMIQUE DE DROITE À GAUCHE : CRÉER UNE NOTE */}
      <CreateNoteDrawer
        isOpen={isCreateNoteOpen}
        onClose={() => setIsCreateNoteOpen(false)}
      />

      {/* MODALE CRÉER UN RENDEZ-VOUS EN 2 ÉTAPES AVEC DESCRIPTION */}
      <CreateAppointmentWizardModal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
        defaultDate={formatYearMonthDay(selectedDate)}
      />

      {/* MODALE ENREGISTREMENT D'UNE PRESTATION */}
      <RecordServiceModal
        isOpen={isRecordServiceOpen}
        onClose={() => setIsRecordServiceOpen(false)}
      />

      {/* MODALE ENVOYER UNE ENQUÊTE DE SATISFACTION */}
      <SendSurveyModal
        isOpen={isSendSurveyOpen}
        onClose={() => setIsSendSurveyOpen(false)}
      />

      {/* MODALE DÉLIVRER UN CERTIFICAT NUMÉRIQUE */}
      <IssueCertificateModal
        isOpen={isIssueCertificateOpen}
        onClose={() => setIsIssueCertificateOpen(false)}
      />

      {/* MODALE CRÉER UN PARCOURS D'INCUBATION AU PREMIER PLAN */}
      {createPathwayTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-[#14233c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-[#23c3b1]" />
                <h3 className="font-bold text-sm">Démarrer un parcours d'incubation</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setCreatePathwayTarget(null)}
                className="text-slate-300 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-slate-700">
                Bénéficiaire : <strong>{createPathwayTarget.firstName} {createPathwayTarget.lastName}</strong>
                <span className="block text-[11px] text-slate-500 mt-1">
                  N° Dossier : {createPathwayTarget.fileNumber || `IML-${createPathwayTarget.fileSeq}`} • {createPathwayTarget.type === 'ENTREPRISE' ? 'PME' : createPathwayTarget.type === 'STARTUP' ? 'Start-up' : 'Porteur de projet'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Choisir le modèle de parcours <span className="text-[#f06553]">*</span>
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] bg-white cursor-pointer"
                >
                  <option value="">Sélectionner un modèle...</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.description ? `— ${t.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreatePathwayTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!selectedTemplateId || isCreatingPathway}
                onClick={handleConfirmCreatePathway}
                className="px-5 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1db09e] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isCreatingPathway ? 'Création...' : 'Créer et activer le parcours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST DE FEEDBACK DU TABLEAU DE BORD */}
      {dashboardToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#14233c] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="size-6 rounded-full bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
          <span className="text-xs font-semibold">{dashboardToast}</span>
          <button 
            type="button"
            onClick={() => setDashboardToast(null)} 
            className="text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer text-base"
          >
            &times;
          </button>
        </div>
      )}

    </div>
  );
}
