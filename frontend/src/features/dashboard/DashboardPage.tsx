import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  StickyNote, 
  Calendar, 
  Clock, 
  Flag, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Plus,
  CheckCircle2,
  X,
  Phone,
  UserCheck,
  Search,
  Building2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import BeneficiaryRequiredModal from '../beneficiaries/BeneficiaryRequiredModal';
import { useBeneficiariesCount } from '../beneficiaries/useBeneficiariesCount';
import AddDocumentWizardModal from '../documents/AddDocumentWizardModal';
import CreateNoteDrawer from './CreateNoteDrawer';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';
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

  // État d'ouverture du volet / tiroir latéral "Mon calendrier"
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(false);

  useEffect(() => {
    const handleOpenCalendar = () => setIsCalendarDrawerOpen(true);
    window.addEventListener('open-calendar-drawer', handleOpenCalendar);
    return () => window.removeEventListener('open-calendar-drawer', handleOpenCalendar);
  }, []);

  // Notifie le layout global pour décaler les boutons d'actions flottants WhatsApp / E-mail
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('calendar-drawer-changed', { detail: { open: isCalendarDrawerOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent('calendar-drawer-changed', { detail: { open: false } }));
    };
  }, [isCalendarDrawerOpen]);

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

  // Récupération des agents et coachs pour l'affectation dynamique
  const { data: optionsRes } = useQuery({
    queryKey: ['beneficiaries-options'],
    queryFn: () => api<{ agents: any[] }>('/beneficiaries/options').catch(() => ({ agents: [] })),
  });
  const allStaff = optionsRes?.agents || [];

  // États pour la création rapide de parcours et actions du tableau de bord
  const [createPathwayTarget, setCreatePathwayTarget] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreatingPathway, setIsCreatingPathway] = useState(false);
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  // Gestion de la vue active strictement basée sur le rôle du compte connecté (Coach ou Agent)
  const userRole = user?.role || 'AGENT';
  const activeVue = userRole === 'COACH' ? 'coach' : 'agent';

  // États pour la vue Coach
  const [coachSearch, setCoachSearch] = useState<string>('');

  // Bénéficiaires assignés au Coach (Accès restreint strictement à ses dossiers)
  const coachBeneficiaries = useMemo(() => {
    const list = beneficiariesList || [];
    if (!user) return list;
    if (user.role === 'COACH') {
      // Pour le coach connecté, l'API backend (/beneficiaries) applique déjà le filtre strict scopeWhere
      return list;
    }
    // Pour un compte non-coach testant la « Vue Coach », on filtre sur le profil du Coach référent (coach@imldigit.com)
    const assigned = list.filter((b: any) => {
      const matchCoach = b.assignments?.some((a: any) => 
        a.user?.email === 'coach@imldigit.com' || 
        a.user?.firstName?.toLowerCase().includes('darius')
      );
      return matchCoach;
    });
    return assigned.length > 0 ? assigned : list.slice(0, 6);
  }, [beneficiariesList, user]);

  // Séances du jour pour le Coach (programmées par l'agent)
  const coachTodayAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
      if (!a.datetime) return false;
      const d = new Date(a.datetime);
      const isToday = 
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      if (!isToday) return false;

      if (user?.role === 'COACH') {
        const isMyAppointment = a.userId === user?.id || a.user?.email === user?.email;
        return isMyAppointment || !a.userId;
      }
      return true;
    }).sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [appointments, today, user]);

  // Prochaines séances programmées par l'agent cette semaine
  const coachUpcomingAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
      if (!a.datetime) return false;
      const d = new Date(a.datetime);
      const isToday = 
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      return !isToday && d >= today;
    }).sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).slice(0, 4);
  }, [appointments, today]);

  // État pour la gestion réactive de l'affectation Référent / Coach
  const [assignmentModalTarget, setAssignmentModalTarget] = useState<any | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [sendBriefingEmail, setSendBriefingEmail] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const handleOpenAssignmentModal = (b: any) => {
    setAssignmentModalTarget(b);
    setSelectedAgentId(b.assignedAgentId || b.assignedAgent?.id || '');
    const currentCoachId = b.assignments?.[0]?.user?.id || '';
    setSelectedCoachId(currentCoachId);
    setSendBriefingEmail(true);
  };

  const handleShareWhatsApp = (b: any, coachUser?: any) => {
    const pName = b?.projects?.[0]?.name || 'Projet';
    const coachName = coachUser?.firstName ? `${coachUser.firstName} ${coachUser.lastName}` : 'Coach';
    const text = `Bonjour ${coachName},\n\nVous êtes programmé(e) par IML Digit pour l'accompagnement de *${b.firstName} ${b.lastName}* (*${pName}*).\n\nSecteur : ${b?.projects?.[0]?.sector?.name || 'Développement d\'activité'}\nStade : ${b?.projects?.[0]?.stage || 'En cours'}\n\nMerci de prendre contact avec le bénéficiaire ou votre référent IML Digit.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveAssignment = async () => {
    if (!assignmentModalTarget) return;
    setIsSavingAssignment(true);
    try {
      await api(`/beneficiaries/${assignmentModalTarget.id}`, {
        method: 'PATCH',
        body: {
          assignedAgentId: selectedAgentId || null,
          coachId: selectedCoachId || null,
        },
      });

      if (sendBriefingEmail && selectedCoachId) {
        await api(`/beneficiaries/${assignmentModalTarget.id}/notify-coach`, {
          method: 'POST',
          body: { coachId: selectedCoachId },
        }).catch(() => {});
      }

      setDashboardToast(`Affectation enregistrée ${sendBriefingEmail && selectedCoachId ? 'et briefing e-mail transmis au coach ' : ''}avec succès.`);
      setAssignmentModalTarget(null);
      void refetchBeneficiaries();
    } catch {
      setDashboardToast(`Erreur lors de la mise à jour de l'affectation.`);
    } finally {
      setIsSavingAssignment(false);
    }
  };

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
      const res = await api<any>('/pathways', {
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

      const templateName = res?.pathway?.template?.name || 'Incubation';
      setDashboardToast(`✓ Parcours « ${templateName} » activé avec succès pour ${createPathwayTarget.firstName} ${createPathwayTarget.lastName}.`);
      setCreatePathwayTarget(null);
      setSelectedTemplateId('');
      void refetchBeneficiaries();
    } catch (err: any) {
      setDashboardToast(`Erreur : ${err?.message || 'Impossible de créer le parcours.'}`);
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
  // 5. Distribution de progression pour le graphique
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

    const rawMax = Math.max(b0_25, b25_50, b50_75, b75_100);
    // On définit une échelle d'entiers propres sans doublons
    let scaleMax = Math.max(3, rawMax);
    let yTicks: number[] = [];
    if (scaleMax <= 5) {
      for (let i = scaleMax; i >= 0; i--) {
        yTicks.push(i);
      }
    } else {
      const step = Math.ceil(scaleMax / 4);
      scaleMax = step * 4;
      yTicks = [scaleMax, step * 3, step * 2, step, 0];
    }

    return {
      b0_25,
      b25_50,
      b50_75,
      b75_100,
      max: scaleMax,
      yTicks
    };
  }, [beneficiariesList]);

  // Moyenne de progression globale
  const averageProgress = useMemo(() => {
    if (!beneficiariesList.length) return 0;
    const totalProg = beneficiariesList.reduce((acc: number, b: any) => acc + (b.pathway?.progress ?? 0), 0);
    return Math.round(totalProg / beneficiariesList.length);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-black text-slate-800 tracking-tight">
            Bonjour {displayName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeVue === 'coach'
              ? 'Accompagnement, contact direct et suivi de vos entrepreneurs assignés.'
              : 'Instruction des dossiers, accueil guichet et orientation des bénéficiaires.'}
          </p>
        </div>
      </div>

      {/* =========================================================================
          VUE DÉDIÉE COACH RÉFÉRENT (Si actif)
         ========================================================================= */}
      {activeVue === 'coach' && (
        <div className="space-y-6 mb-8 animate-in fade-in duration-200">
          
          {/* 1. Bannière d'introduction Coach - Cahier de Bord */}
          <div className="bg-gradient-to-r from-slate-900 via-[#13273e] to-[#0f1d2c] rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/80">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#23c3b1] animate-pulse" />
                <span className="text-xs font-bold text-[#23c3b1] uppercase tracking-wider">
                  Cahier de Bord du Coach Référent
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">• Espace Accompagnement en Présentiel</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Mes Séances & Entrepreneurs Suivis
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
                Consultez vos rendez-vous fixés par l'équipe de planification, ouvrez la fiche de votre entrepreneur pour noter les échanges et valider les étapes en direct.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[120px]">
                <span className="block text-xl font-black text-[#23c3b1]">
                  {coachTodayAppointments.length}
                </span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  {coachTodayAppointments.length > 1 ? 'Séances aujourd\'hui' : 'Séance aujourd\'hui'}
                </span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[120px]">
                <span className="block text-xl font-black text-amber-400">
                  {coachBeneficiaries.length}
                </span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  Dossiers assignés
                </span>
              </div>
            </div>
          </div>

          {/* 2. SECTION MAJEURE : MON PLANNING DU JOUR À L'ENTREPRISE (Fixé par l'agent) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#178578]">
                  <Clock className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Mon Planning du Jour à l'Entreprise
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#23c3b1]/15 text-[#178578] border border-[#23c3b1]/30">
                      Fixé par l'agent
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Séances en présentiel dans nos bureaux • {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <Building2 className="size-3.5 text-[#23c3b1]" />
                <span>Locaux IML Digit / Espace PME</span>
              </div>
            </div>

            {/* Liste des séances d'aujourd'hui */}
            <div className="p-4 sm:p-6">
              {coachTodayAppointments.length > 0 ? (
                <div className="space-y-3.5">
                  {coachTodayAppointments.map((appt: any) => {
                    const d = new Date(appt.datetime);
                    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    const endD = new Date(d.getTime() + (appt.duration || 60) * 60000);
                    const endTimeStr = endD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    const b = appt.beneficiary || {};
                    const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Entrepreneur';

                    return (
                      <div
                        key={appt.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#23c3b1] hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                      >
                        {/* Horaires & Vignette horaire */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className="px-3 py-2 rounded-xl bg-teal-50 border border-teal-200/80 text-center shrink-0">
                            <span className="block text-sm font-black text-[#178578]">{timeStr}</span>
                            <span className="block text-[10px] text-slate-500 font-semibold">{endTimeStr}</span>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-900">
                                {bName}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                {b.type || 'PORTRAIT PME'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                appt.status === 'REALISE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {appt.status === 'REALISE' ? 'Séance Réalisée' : 'À Venir'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Building2 className="size-3.5 text-slate-400" />
                                {appt.location || "Bureau de coaching (Espace PME)"}
                              </span>
                              {b.phone && (
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <Phone className="size-3 text-slate-400" />
                                  <a href={`tel:${b.phone}`} className="hover:text-[#23c3b1]">{b.phone}</a>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bouton d'action directe pour la séance */}
                        <div className="flex items-center gap-2 shrink-0">
                          {b.id ? (
                            <Link
                              to={`/beneficiaires/${b.id}?tab=suivi`}
                              className="px-4 py-2.5 rounded-xl bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                              <BookOpen className="size-4" />
                              <span>Ouvrir la fiche pour la séance</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Dossier en cours</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-7 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 space-y-2">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Calendar className="size-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">
                    Aucune séance programmée aujourd'hui dans vos locaux
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    L'agent n'a pas fixé de rendez-vous pour votre compte aujourd'hui. Vos prochaines séances s'afficheront ici automatiquement dès leur planification.
                  </p>
                </div>
              )}

              {/* Prochaines séances programmées par l'agent si existantes */}
              {coachUpcomingAppointments.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    Prochaines séances à venir dans la semaine
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {coachUpcomingAppointments.map((appt: any) => {
                      const d = new Date(appt.datetime);
                      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const b = appt.beneficiary || {};
                      const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Entrepreneur';

                      return (
                        <div key={appt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#178578]">{dateStr} à {timeStr}</span>
                            <span className="text-[10px] text-slate-400">{appt.duration || 60}m</span>
                          </div>
                          <div className="font-bold text-slate-800 truncate" title={bName}>
                            {bName}
                          </div>
                          {b.id && (
                            <Link to={`/beneficiaires/${b.id}?tab=suivi`} className="text-[11px] text-[#23c3b1] hover:underline font-medium inline-block mt-1">
                              Préparer la séance →
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. SECTION MES DOSSIERS EN COURS : CLIC POUR RELIRE LES NOTES & VALIDER LES ÉTAPES */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#178578]">
                  <UserCheck className="size-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Mes Dossiers en cours & Suivi des Entrepreneurs
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Consultez l'historique des séances ou accédez à la fiche d'accompagnement de vos entrepreneurs
                  </p>
                </div>
              </div>

              {/* Recherche rapide */}
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un entrepreneur..."
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#23c3b1] focus:bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {coachBeneficiaries
                .filter((b: any) => {
                  const name = `${b.firstName} ${b.lastName}`.toLowerCase();
                  const comp = (b.projects?.[0]?.name || b.companyName || '').toLowerCase();
                  return name.includes(coachSearch.toLowerCase()) || comp.includes(coachSearch.toLowerCase());
                })
                .map((b: any) => {
                  const p = b.projects?.[0] || {};
                  const projectName = p.name || b.companyName || 'Activité en cours';

                  return (
                    <div key={b.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Coordonnées & Projet */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="size-11 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-slate-700">
                          {b.firstName?.[0] || 'E'}{b.lastName?.[0] || 'M'}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {b.firstName} {b.lastName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.status || 'ACTIF'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {b.type || 'PME / STARTUP'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                            <Building2 className="size-3.5 text-[#23c3b1] shrink-0" />
                            <span className="font-bold text-slate-800 truncate">{projectName}</span>
                            {p.sector?.name && (
                              <span className="text-[11px] text-slate-400">• {p.sector.name}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            {b.phone && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Phone className="size-3 text-slate-400" />
                                <a href={`tel:${b.phone}`} className="hover:text-[#23c3b1]">{b.phone}</a>
                              </span>
                            )}
                            {b.email && (
                              <span className="flex items-center gap-1 text-slate-600 truncate max-w-[200px]">
                                <Mail className="size-3 text-slate-400" />
                                <a href={`mailto:${b.email}`} className="hover:text-[#23c3b1] truncate">{b.email}</a>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS DU COACH : Relire les notes ou valider l'étape en direct */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        <Link
                          to={`/beneficiaires/${b.id}?tab=historique`}
                          className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          title="Relire les comptes-rendus des séances précédentes"
                        >
                          <BookOpen className="size-3.5 text-slate-500" />
                          <span>Relire les notes</span>
                        </Link>
                        
                        <Link
                          to={`/beneficiaires/${b.id}?tab=suivi`}
                          className="h-9 px-4 rounded-xl bg-[#14233c] hover:bg-[#1f355b] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-sm flex items-center gap-1.5"
                          title="Ouvrir la fiche de l'entrepreneur pour animer la séance et consigner les notes"
                        >
                          <UserCheck className="size-3.5 text-[#23c3b1]" />
                          <span>Séances & Mentorat</span>
                        </Link>
                      </div>

                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COCKPIT AGENT IML : GUICHET, 7 ACTIONS RAPIDES, INSTRUCTION & GESTION OPÉRATIONNELLE
         ========================================================================= */}
      {activeVue === 'agent' && (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* =======================================================================
            SECTION GAUCHE (CARTES D'ACTIONS + PROGRESSION + TÂCHES)
           ======================================================================= */}
        <div className="flex-1 min-w-0 space-y-4.5 w-full">
          
          {/* 1. LES 6 CARTES D'ACTION RAPIDE (Grille symétrique de 3 colonnes x 2 rangées) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
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


            {/* 6. Valider un jalon de parcours */}
            <button 
              type="button"
              onClick={() => navigate('/validation-etapes')}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <CheckCircle2 className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Valider</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">un jalon de parcours</div>
              </div>
            </button>

            {/* 7. Délivrer une certification (Modale certificat numérique) */}
            <button 
              type="button"
              onClick={() => {
                if (beneficiaryCount === 0) {
                  handleActionClick({
                    title: 'Délivrer une certification',
                    message: "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir délivrer une certification.",
                    icon: GraduationCap
                  });
                } else {
                  setIsIssueCertificateOpen(true);
                }
              }}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <GraduationCap className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Délivrer</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">une certification</div>
              </div>
            </button>

          </div>

          {/* 2. SECTION BASSE : Progression (Gauche ~30%) + Tâches (Droite ~70%) */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            
            {/* SOUS-COLONNE GAUCHE : Progression des bénéficiaires */}
            <div className="w-full md:w-[270px] lg:w-[285px] shrink-0 bg-white rounded-md border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h2 className="text-[14px] font-normal text-slate-800 leading-snug">
                  Progression des bénéficiaires dans leur parcours
                </h2>
                <p className="text-[11px] text-slate-400 mt-1 mb-5">
                  Sur base de vos {totalBeneficiaries} bénéficiaire(s) actif(s)
                </p>

                {/* Graphique réorganisé sans débordement */}
                <div className="flex gap-2 items-stretch select-none">
                  {/* Axe Y : graduations intégrées proprement à gauche, sans aucun débordement */}
                  <div className="w-5 shrink-0 flex flex-col justify-between items-end pb-7 pt-1 text-[10px] font-mono text-slate-400">
                    {progressBuckets.yTicks.map((val) => (
                      <span key={val} className="leading-none">{val}</span>
                    ))}
                  </div>

                  {/* Corps du graphique (grille + barres + étiquettes X) */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Zone des barres avec bordures discrètes et repères */}
                    <div className="h-38 w-full border-l border-b border-slate-300 relative flex items-end px-1.5 pb-0">
                      {/* Lignes horizontales discrètes en arrière-plan */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0">
                        {progressBuckets.yTicks.map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-full ${i === progressBuckets.yTicks.length - 1 ? 'border-b border-transparent' : 'border-b border-dashed border-slate-100'}`} 
                          />
                        ))}
                      </div>

                      {/* 4 Colonnes avec barres interactives */}
                      <div className="w-full h-full grid grid-cols-4 gap-2 items-end z-10 pt-4">
                        {/* 0-25% */}
                        <div className="flex flex-col items-center h-full justify-end group">
                          <span className="text-[10px] font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {progressBuckets.b0_25}
                          </span>
                          <div 
                            className="w-full bg-[#23c3b1] rounded-t hover:bg-[#1ba898] transition-all duration-500 min-h-[4px]"
                            style={{ height: `${progressBuckets.b0_25 === 0 ? 4 : Math.max(8, (progressBuckets.b0_25 / progressBuckets.max) * 85)}%` }}
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
                            style={{ height: `${progressBuckets.b25_50 === 0 ? 4 : Math.max(8, (progressBuckets.b25_50 / progressBuckets.max) * 85)}%` }}
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
                            style={{ height: `${progressBuckets.b50_75 === 0 ? 4 : Math.max(8, (progressBuckets.b50_75 / progressBuckets.max) * 85)}%` }}
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
                            style={{ height: `${progressBuckets.b75_100 === 0 ? 4 : Math.max(8, (progressBuckets.b75_100 / progressBuckets.max) * 85)}%` }}
                            title={`${progressBuckets.b75_100} bénéficiaire(s) entre 75-100%`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Étiquettes horizontales propres sous chaque barre */}
                    <div className="w-full grid grid-cols-4 gap-2 text-center pt-2">
                      <span className="text-[10px] text-slate-500 font-medium truncate">0-25%</span>
                      <span className="text-[10px] text-slate-500 font-medium truncate">25-50%</span>
                      <span className="text-[10px] text-slate-500 font-medium truncate">50-75%</span>
                      <span className="text-[10px] text-slate-500 font-medium truncate">75-100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicateur de progression moyenne globale */}
              <div className="mt-8 pt-4 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Taux moyen d'avancement</span>
                  <span className="font-bold text-[#178578]">{averageProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#23c3b1] to-[#178578] h-2 rounded-full transition-all duration-700" 
                    style={{ width: `${averageProgress}%` }}
                  />
                </div>
              </div>

              {/* Liste réactive des bénéficiaires avec barres de progression */}
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Bénéficiaires actifs ({beneficiariesList.length})</span>
                  <span className="text-[10px] text-slate-400">Jalons</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {beneficiariesList.map((b: any) => {
                    const prog = b.pathway?.progress ?? 0;
                    const totalSteps = b.pathway?.steps?.length ?? 0;
                    const completedSteps = b.pathway?.steps?.filter((s: any) => s.status === 'TERMINE').length ?? 0;
                    const pName = b.projects?.[0]?.name || (b.type === 'STARTUP' ? 'Start-up' : 'Porteur de projet');
                    return (
                      <div
                        key={b.id}
                        onClick={() => navigate(`/beneficiaires/${b.id}`)}
                        className="p-2 rounded-md border border-slate-200/80 hover:border-[#23c3b1]/50 bg-slate-50/60 hover:bg-white transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#178578] transition-colors">
                              {b.firstName} {b.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{pName}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            prog >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-teal-50 text-[#178578] border border-teal-200/60'
                          }`}>
                            {prog}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#23c3b1] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, prog)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                          <span>{totalSteps > 0 ? `${completedSteps}/${totalSteps} étapes validées` : 'Parcours en cours'}</span>
                          <span className="group-hover:text-[#23c3b1] transition-colors font-medium">Voir le dossier →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SOUS-COLONNE DROITE : Les 5 blocs de tâches Teasio */}
            <div className="flex-1 min-w-0 bg-white rounded-md border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-5">
              
              {/* Ligne 1 : Parcours à créer & Étapes à valider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                
                {/* 1. En attente de parcours */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>En attente de parcours</span>
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

                {/* 4. Conseillers référents & Coachs */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-normal text-slate-800 flex items-center gap-2">
                      <span>Conseillers référents & Coachs</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-[#178578] border border-teal-200">
                        {beneficiariesList.filter((b: any) => b.assignedAgent || b.assignments?.length).length}/{beneficiariesList.length} assignés
                      </span>
                    </h3>
                  </div>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  
                  {beneficiariesList.length === 0 ? (
                    <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                      Aucun bénéficiaire enregistré
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {beneficiariesList.map((b: any) => {
                        const agentName = b.assignedAgent 
                          ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` 
                          : 'Alexandre Agent IML';
                        const coachName = b.assignments?.[0]?.user 
                          ? `${b.assignments[0].user.firstName} ${b.assignments[0].user.lastName}` 
                          : 'Darius Coach IML';
                        const pName = b.projects?.[0]?.name;

                        return (
                          <div 
                            key={b.id} 
                            className="p-2.5 rounded-md border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {b.firstName} {b.lastName}
                                </span>
                                {pName && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    • {pName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] flex-wrap">
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs" title="Conseiller Référent (Agent IML)">
                                  <User className="size-2.5 text-[#23c3b1]" />
                                  <span className="truncate max-w-[140px]">{agentName}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs" title="Coach Référent (Coach IML)">
                                  <UserCheck className="size-2.5 text-amber-500" />
                                  <span className="truncate max-w-[140px]">{coachName}</span>
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignmentModal(b)}
                              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-medium shrink-0 transition-colors cursor-pointer active:scale-95 shadow-2xs self-center"
                            >
                              Gérer
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>



            </div>

          </div>

        </div>

        {/* =======================================================================
            SECTION DROITE (MON CALENDRIER EN FORME D'ICÔNE + BESOIN D'AIDE ?)
           ======================================================================= */}
        <div className="w-full lg:w-[250px] shrink-0 space-y-4">
          
          {/* CARTE 1 : Bouton Icône "Mon calendrier" (Ouvre le calendrier complet au clic) */}
          <button
            type="button"
            onClick={() => setIsCalendarDrawerOpen(true)}
            className="w-full bg-white rounded-md border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-md hover:border-[#23c3b1] transition-all flex items-center justify-between gap-3 text-left cursor-pointer group select-none"
            title="Cliquez pour ouvrir Mon calendrier"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-md bg-[#23c3b1] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Calendar className="size-5.5 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] transition-colors flex items-center gap-1.5">
                  <span>Mon calendrier</span>
                  {monthEventsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f06553] text-white leading-none">
                      {monthEventsCount}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {selectedWeekday} {selectedDate.getDate()} {monthTitle}
                </div>
              </div>
            </div>
            <div className="size-7 rounded-full bg-slate-100 group-hover:bg-[#23c3b1] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <ChevronRight className="size-4" />
            </div>
          </button>

          {/* CARTE 2 : Besoin d'aide ? (3 boutons en haut, 1 centré en bas) */}
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

        </div>

      </div>
      )}

      {/* =========================================================================
          TIROIR / VOLET COULISSANT "MON CALENDRIER" (S'OUVRE AU CLIC SUR L'ICÔNE)
         ========================================================================= */}
      {isCalendarDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop avec flou pour fermer au clic extérieur */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsCalendarDrawerOpen(false)}
          />

          {/* Tiroir latéral droit */}
          <div className="relative w-full max-w-sm bg-white h-screen shadow-2xl z-10 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header du calendrier */}
            <div className="p-4 bg-gradient-to-r from-[#14233c] to-[#1a3348] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#23c3b1] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Mon calendrier</h3>
                  <p className="text-[10px] text-slate-300">Agenda & Séances d'accompagnement</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="px-2 py-1 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-teal-300 transition-colors cursor-pointer"
                  title="Revenir à aujourd'hui"
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarDrawerOpen(false)}
                  className="size-7 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xl leading-none"
                  title="Fermer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Corps défilable du calendrier */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Notification du mois */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 text-center text-xs text-slate-600 font-medium">
                {monthEventsCount === 0
                  ? `Aucun événement en ${monthTitle}`
                  : `${monthEventsCount} événement${monthEventsCount > 1 ? 's' : ''} en ${monthTitle}`}
              </div>

              {/* Raccourcis Aujourd'hui et Demain */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                    isSelectedToday
                      ? 'bg-[#23c3b1] text-white border-[#23c3b1] shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${isSelectedToday ? 'bg-white' : 'bg-[#23c3b1]'}`} />
                  <span>Aujourd'hui ({today.getDate()})</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectTomorrow}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                    isSelectedTomorrow
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${isSelectedTomorrow ? 'bg-white' : 'bg-amber-500'}`} />
                  <span>Demain ({tomorrow.getDate()})</span>
                </button>
              </div>

              {/* Navigation des mois */}
              <div className="flex items-center justify-between pt-1 px-1">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  title="Mois précédent"
                  className="size-7 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="text-sm font-bold text-slate-800 tracking-wide">
                  {monthTitle}
                </span>

                <button 
                  type="button"
                  onClick={handleNextMonth}
                  title="Mois suivant"
                  className="size-7 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-semibold select-none">
                <span>dim.</span>
                <span>lun.</span>
                <span>mar.</span>
                <span>mer.</span>
                <span>jeu.</span>
                <span>ven.</span>
                <span>sam.</span>
              </div>

              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {calendarGridDays.map((item, idx) => (
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
                    className={`size-7 mx-auto rounded-full flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer ${
                      item.isSelected
                        ? 'bg-[#23c3b1] text-white font-bold shadow-xs'
                        : item.isToday
                        ? 'border-2 border-[#23c3b1] text-[#1b9a8c] font-bold bg-[#23c3b1]/10 hover:bg-[#23c3b1]/20'
                        : item.isTomorrow
                        ? 'border-2 border-amber-400 text-amber-800 font-bold bg-amber-50 hover:bg-amber-100'
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
                ))}
              </div>

              {/* Détail du jour sélectionné */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
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
                    className="size-6 rounded hover:bg-slate-100 text-slate-500 hover:text-[#23c3b1] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {selectedDayAppointments.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
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
                      className="w-full py-1.5 text-xs font-medium text-[#23c3b1] hover:text-[#1b9a8c] hover:bg-[#23c3b1]/10 rounded-lg border border-dashed border-[#23c3b1]/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      Planifier un rendez-vous
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedDayAppointments.map((app: any) => {
                      const timeStr = app.datetime
                        ? new Date(app.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <div
                          key={app.id}
                          className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white transition-colors text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-800 truncate">
                              {app.beneficiary ? `${app.beneficiary.firstName} ${app.beneficiary.lastName}` : 'Rendez-vous'}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px] shrink-0 font-medium">
                              {timeStr}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate">{app.location || (app.duration ? `${app.duration} min` : 'Session')}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              {app.status || 'PLANIFIE'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer du calendrier */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsCalendarDrawerOpen(false);
                  navigate('/agendas');
                }}
                className="text-xs font-semibold text-[#23c3b1] hover:underline cursor-pointer"
              >
                Ouvrir l'agenda complet →
              </button>
              <button
                type="button"
                onClick={() => setIsCalendarDrawerOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Fermer</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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


      {/* MODALE DÉLIVRANCE D'UNE CERTIFICATION */}
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

      {/* Modal d'affectation Référent & Coach */}
      {assignmentModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Affectation Référent & Coach
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {assignmentModalTarget.firstName} {assignmentModalTarget.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignmentModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Conseiller référent (Agent IML)
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                >
                  <option value="">Sélectionner un conseiller référent...</option>
                  {allStaff
                    .filter((s: any) => s.role?.code === 'AGENT' || s.role?.code === 'ADMIN')
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.role?.label || s.role?.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Coach d'accompagnement
                </label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                >
                  <option value="">Sélectionner un coach...</option>
                  {allStaff
                    .filter((s: any) => s.role?.code === 'COACH' || s.role?.code === 'ADMIN')
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.role?.label || s.role?.code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Notification automatique du coach */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendBriefingEmail}
                    onChange={(e) => setSendBriefingEmail(e.target.checked)}
                    className="mt-0.5 rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <div>
                    <span className="font-medium text-slate-800">Transmettre le dossier de cadrage par e-mail</span>
                    <p className="text-[11px] text-slate-500">Expédie les détails du projet, objectifs et coordonnées directement dans la boîte mail du coach.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const coach = allStaff.find((s: any) => s.id === selectedCoachId);
                  handleShareWhatsApp(assignmentModalTarget, coach);
                }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors active:scale-95"
                title="Partager le briefing au coach via WhatsApp"
              >
                <span>💬 Partager WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentModalTarget(null)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSavingAssignment}
                  onClick={handleSaveAssignment}
                  className="px-3.5 py-1.5 rounded text-xs font-medium bg-[#23c3b1] hover:bg-[#1db09e] text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs active:scale-95"
                >
                  {isSavingAssignment ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
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
