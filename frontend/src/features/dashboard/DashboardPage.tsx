import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  Calendar, 
  Clock, 
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
  Building2,
  Video,
  Bot,
  Users,
  Eye
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import RoomBookingDetailModal, { type RoomBookingItem } from '../rooms/RoomBookingDetailModal';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import BeneficiaryRequiredModal from '../beneficiaries/BeneficiaryRequiredModal';
import { useBeneficiariesCount } from '../beneficiaries/useBeneficiariesCount';
import AddDocumentWizardModal from '../documents/AddDocumentWizardModal';
import CreateNoteDrawer from './CreateNoteDrawer';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';
import IssueCertificateModal from '../certificates/IssueCertificateModal';
import DirectorDashboardPage from '../director/DirectorDashboardPage';

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

  // Modèles de parcours
  const { data: templatesRes } = useQuery({
    queryKey: ['pathway-templates'],
    queryFn: () => api<{ templates: any[] }>('/pathways/templates').catch(() => ({ templates: [] })),
  });
  const templates = templatesRes?.templates || [];

  // Récupération des agents et coachs pour l'affectation dynamique
  const { data: optionsRes, refetch: refetchStaff } = useQuery({
    queryKey: ['beneficiaries-options'],
    queryFn: () => api<{ agents: any[] }>('/beneficiaries/options').catch(() => ({ agents: [] })),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const allStaff = optionsRes?.agents || [];

  // États pour la création rapide de parcours et actions du tableau de bord
  const [createPathwayTarget, setCreatePathwayTarget] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreatingPathway, setIsCreatingPathway] = useState(false);
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);

  // Gestion stricte et étanche de la vue selon le rôle du compte connecté :
  const userRole = user?.role || 'AGENT';
  const urlVue = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('vue')?.toLowerCase() : null;

  const activeVue = userRole === 'DIRECTION' || urlVue === 'direction'
    ? 'direction'
    : userRole === 'COACH' || urlVue === 'coach'
    ? 'coach'
    : 'agent';

  // Récupération des réservations de salle & masterclasses
  const { data: roomBookingsRes, refetch: refetchRoomBookings } = useQuery({
    queryKey: ['room-bookings'],
    queryFn: () => api<{ items: any[] }>('/rooms/bookings').catch(() => ({ items: [] })),
    enabled: activeVue === 'agent',
  });
  const roomBookings = roomBookingsRes?.items || [];
  const pendingRoomBookings = useMemo(() => roomBookings.filter((b: any) => b.status === 'EN_ATTENTE'), [roomBookings]);
  const [selectedRoomBooking, setSelectedRoomBooking] = useState<RoomBookingItem | null>(null);

  // Récupération des demandes de contact reçues depuis le formulaire public
  const qcDashboard = useQueryClient();
  const [dismissedContactIds, setDismissedContactIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('iml_dismissed_contact_ids') || '[]');
    } catch {
      return [];
    }
  });

  const { data: dashboardContactsRes } = useQuery({
    queryKey: ['dashboard-contact-messages'],
    queryFn: () => api<{ items: any[]; total: number; unreadCount: number }>('/contacts').catch(() => ({ items: [], total: 0, unreadCount: 0 })),
    enabled: activeVue === 'agent',
    refetchInterval: 10_000,
  });

  const unreadContactMessages = useMemo(() => {
    return (dashboardContactsRes?.items || []).filter((m: any) => m.status === 'NOUVEAU' && !dismissedContactIds.includes(m.id));
  }, [dashboardContactsRes, dismissedContactIds]);

  // Mutation : marquer TOUS les contacts NOUVEAU comme TRAITE
  const markAllContactsRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => api(`/contacts/${id}`, { method: 'PATCH', body: { status: 'TRAITE' } })));
    },
    onSuccess: () => {
      qcDashboard.invalidateQueries({ queryKey: ['dashboard-contact-messages'] });
      qcDashboard.invalidateQueries({ queryKey: ['contact-messages-alert'] });
      qcDashboard.invalidateQueries({ queryKey: ['contact-messages-full-list'] });
    },
  });

  const dismissAndMarkAllAsRead = (ids: string[]) => {
    const updated = Array.from(new Set([...dismissedContactIds, ...ids]));
    setDismissedContactIds(updated);
    try {
      localStorage.setItem('iml_dismissed_contact_ids', JSON.stringify(updated));
    } catch {}
    markAllContactsRead.mutate(ids);
  };

  // États pour la vue Coach
  const [coachSearch, setCoachSearch] = useState<string>('');
  const [coachStatusFilter, setCoachStatusFilter] = useState<'ACTIFS' | 'TERMINES' | 'TOUS'>('ACTIFS');

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


  // Toutes les séances assignées au Coach (triées par ordre chronologique)
  const coachAllAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
      if (!a.datetime) return false;
      if (user?.role === 'COACH') {
        const isMyAppointment = a.userId === user?.id || a.user?.email === user?.email;
        return isMyAppointment || !a.userId;
      }
      return true;
    }).sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [appointments, user]);

  // Séances prévues aujourd'hui
  const coachTodayAppointments = useMemo(() => {
    return coachAllAppointments.filter((a: any) => {
      const d = new Date(a.datetime);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  }, [coachAllAppointments, today]);

  // Prochaine séance planifiée (à partir d'aujourd'hui)
  const nextCoachAppointment = useMemo(() => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return coachAllAppointments.find((a: any) => new Date(a.datetime) >= todayStart);
  }, [coachAllAppointments, today]);

  // Toutes les séances à venir du coach (aujourd'hui et futures)
  const coachUpcomingSessions = useMemo(() => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return coachAllAppointments.filter((a: any) => new Date(a.datetime) >= todayStart);
  }, [coachAllAppointments, today]);



  // État pour la gestion réactive de l'affectation Référent / Coach
  const [assignmentModalTarget, setAssignmentModalTarget] = useState<any | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [sendBriefingEmail, setSendBriefingEmail] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const handleOpenAssignmentModal = (b: any) => {
    void refetchStaff();
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

  const handleDecideRoomBooking = async (id: string, status: 'CONFIRMEE' | 'REFUSEE') => {
    try {
      await api(`/rooms/bookings/${id}`, {
        method: 'PATCH',
        body: { status },
      });
      setDashboardToast(status === 'CONFIRMEE' ? '✓ Réservation de salle confirmée ! Le créneau est verrouillé.' : 'Demande de réservation refusée.');
      void refetchRoomBookings();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du traitement de la réservation.');
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

  // Si rôle DIRECTEUR : Affichage exclusif du Cockpit Direction (100% dédié, aucune vue agent, aucun toggle agent)
  if (activeVue === 'direction') {
    return <DirectorDashboardPage />;
  }

  return (
    <div className="w-full pb-36 sm:pb-44 relative font-sans text-slate-800">
      
      {/* =========================================================================
          LIGNE DU HAUT : Bonjour {displayName} & Accès Mon calendrier
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200/80">
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

        {/* Bouton d'accès Mon calendrier (Ouvre le calendrier interactif) */}
        <button
          type="button"
          onClick={() => setIsCalendarDrawerOpen(true)}
          className="bg-white rounded-xl border border-slate-200/90 hover:border-[#23c3b1] px-3.5 py-2 shadow-2xs hover:shadow-md transition-all flex items-center gap-2.5 text-left cursor-pointer group select-none shrink-0"
          title="Cliquez pour ouvrir Mon calendrier"
        >
          <div className="size-9 rounded-lg bg-[#23c3b1] group-hover:bg-[#1ba898] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-all">
            <Calendar className="size-4.5 stroke-[1.75]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 group-hover:text-[#178578] transition-colors flex items-center gap-1.5">
              <span>Mon calendrier</span>
              {monthEventsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#f06553] text-white leading-none">
                  {monthEventsCount}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
              {selectedWeekday} {selectedDate.getDate()} {monthTitle}
            </div>
          </div>
          <div className="size-6 rounded-full bg-slate-100 group-hover:bg-[#23c3b1] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-1">
            <ChevronRight className="size-3.5" />
          </div>
        </button>
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
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[130px]">
                <span className="block text-xl font-black text-[#23c3b1]">
                  {coachTodayAppointments.length > 0 
                    ? coachTodayAppointments.length 
                    : nextCoachAppointment 
                    ? new Date(nextCoachAppointment.datetime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : 0
                  }
                </span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  {coachTodayAppointments.length > 0 
                    ? (coachTodayAppointments.length > 1 ? 'Séances aujourd\'hui' : 'Séance aujourd\'hui')
                    : nextCoachAppointment 
                    ? 'Prochaine séance'
                    : 'Séance planifiée'
                  }
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

          {/* 2. SECTION MAJEURE : MON PLANNING ADAPTATIF (Fixé par l'agent) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#178578]">
                  <Clock className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Mon Planning d'Interventions & Séances
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#23c3b1]/15 text-[#178578] border border-[#23c3b1]/30">
                      Fixé par l'agent
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Planning synchronisé avec l'équipe de coordination • {coachUpcomingSessions.length} séance(s) programmée(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto">
                <Calendar className="size-4 text-[#23c3b1]" />
                <span>
                  {coachUpcomingSessions.length} séance(s) programmée(s)
                </span>
              </div>
            </div>

            {/* Liste de toutes les séances planifiées */}
            <div className="p-4 sm:p-6 space-y-4">
              {coachUpcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {coachUpcomingSessions.map((appt: any) => {
                    const d = new Date(appt.datetime);
                    const isApptToday = 
                      d.getFullYear() === today.getFullYear() &&
                      d.getMonth() === today.getMonth() &&
                      d.getDate() === today.getDate();
                    const isApptTomorrow = 
                      d.getFullYear() === tomorrow.getFullYear() &&
                      d.getMonth() === tomorrow.getMonth() &&
                      d.getDate() === tomorrow.getDate();
                    
                    const dateRelative = isApptToday 
                      ? "Aujourd'hui" 
                      : isApptTomorrow 
                      ? "Demain" 
                      : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

                    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    const endD = new Date(d.getTime() + (appt.duration || 60) * 60000);
                    const endTimeStr = endD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    const b = appt.beneficiary || {};
                    const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Entrepreneur';
                    const isVisio = (appt.location || '').toLowerCase().includes('visio') || (appt.location || '').includes('http') || (appt.location || '').toLowerCase().includes('meet');

                    return (
                      <div
                        key={appt.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                          isApptToday 
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400' 
                            : isApptTomorrow 
                            ? 'bg-teal-50/30 border-teal-200 hover:border-teal-400' 
                            : 'bg-white border-slate-200 hover:border-[#23c3b1] hover:shadow-xs'
                        }`}
                      >
                        {/* Horaires & Date */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className={`px-3 py-2 rounded-xl border text-center shrink-0 min-w-[85px] ${
                            isApptToday 
                              ? 'bg-amber-100/70 border-amber-300 text-amber-900' 
                              : 'bg-teal-50 border-teal-200 text-[#178578]'
                          }`}>
                            <span className="block text-[11px] font-black uppercase tracking-wider">{dateRelative}</span>
                            <span className="block text-sm font-black mt-0.5">{timeStr}</span>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-900">
                                {bName}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                {b.type || 'PORTRAIT PME'}
                              </span>
                              {isVisio ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                  <Video className="size-3" />
                                  <span>Visioconférence IML Digit</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  <Building2 className="size-3" />
                                  <span>Présentiel Locaux PME</span>
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                appt.status === 'REALISE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {appt.status === 'REALISE' ? 'Séance Réalisée' : 'Planifiée'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <Clock className="size-3.5 text-slate-400" />
                                <span>{timeStr} - {endTimeStr} ({appt.duration || 60} min)</span>
                              </span>
                              {b.phone && (
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Phone className="size-3 text-slate-400" />
                                  <a href={`tel:${b.phone}`} className="hover:text-[#23c3b1]">{b.phone}</a>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions directes */}
                        <div className="flex items-center gap-2 shrink-0">
                          {b.id && (
                            <Link
                              to={`/beneficiaires/${b.id}?tab=suivi`}
                              className="px-4 py-2.5 rounded-xl bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                              <BookOpen className="size-4" />
                              <span>Ouvrir la fiche pour la séance</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 space-y-3">
                  <div className="size-11 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Calendar className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Aucune séance programmée pour le moment
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                      L'équipe de planification fixera vos prochains rendez-vous d'accompagnement qui apparaîtront ici automatiquement dès leur enregistrement.
                    </p>
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

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {/* Onglets de filtrage par état d'accompagnement */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCoachStatusFilter('ACTIFS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      coachStatusFilter === 'ACTIFS' 
                        ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    En cours ({coachBeneficiaries.filter((b: any) => b.status !== 'TERMINE' && b.status !== 'ABANDONNE').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoachStatusFilter('TERMINES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      coachStatusFilter === 'TERMINES' 
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Clôturés / Terminés ({coachBeneficiaries.filter((b: any) => b.status === 'TERMINE').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoachStatusFilter('TOUS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      coachStatusFilter === 'TOUS' 
                        ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tous ({coachBeneficiaries.length})
                  </button>
                </div>

                {/* Recherche rapide */}
                <div className="relative w-full sm:w-56">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={coachSearch}
                    onChange={(e) => setCoachSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#23c3b1] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {(() => {
                const filtered = coachBeneficiaries
                  .filter((b: any) => {
                    if (coachStatusFilter === 'ACTIFS') {
                      if (b.status === 'TERMINE' || b.status === 'ABANDONNE') return false;
                    } else if (coachStatusFilter === 'TERMINES') {
                      if (b.status !== 'TERMINE') return false;
                    }
                    const name = `${b.firstName} ${b.lastName}`.toLowerCase();
                    const comp = (b.projects?.[0]?.name || b.companyName || '').toLowerCase();
                    return name.includes(coachSearch.toLowerCase()) || comp.includes(coachSearch.toLowerCase());
                  });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400">
                      <p className="text-xs font-medium">
                        {coachStatusFilter === 'TERMINES'
                          ? "Aucun dossier clôturé pour l'instant. Dès qu'un parcours est finalisé (Bilan Étape 4 validé), il est archivé ici avec l'historique complet."
                          : "Aucun dossier en cours trouvé correspondant à vos critères."}
                      </p>
                    </div>
                  );
                }

                return filtered.map((b: any) => {
                  const p = b.projects?.[0] || {};
                  const projectName = p.name || b.companyName || 'Activité en cours';
                  const nextAppt = coachAllAppointments.find((a: any) => 
                    a.beneficiaryId === b.id && new Date(a.datetime) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())
                  );

                  return (
                    <div key={b.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Coordonnées & Projet */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="size-11 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-slate-700">
                          {b.firstName?.[0] || 'E'}{b.lastName?.[0] || 'M'}
                        </div>

                        <div className="min-w-0 space-y-1.5">
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
                            {nextAppt ? (
                              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold flex items-center gap-1">
                                <Calendar className="size-3 text-teal-600" />
                                <span>Séance programmée : {new Date(nextAppt.datetime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(nextAppt.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px]">
                                Aucun RDV futur fixé
                              </span>
                            )}
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
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COCKPIT AGENT IML : GUICHET, ACTIONS RAPIDES, INSTRUCTION & GESTION OPÉRATIONNELLE
         ========================================================================= */}
      {activeVue === 'agent' && (
        <div className="space-y-6 w-full">

          {/* Bannière Alerte : Nouvelles demandes de contact reçues depuis le site web */}
          {unreadContactMessages.length > 0 && (
            <div className="bg-gradient-to-r from-orange-500 via-[#FF5B37] to-amber-500 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 border border-orange-400/80">
              <div className="flex items-start sm:items-center gap-3">
                <div className="size-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <Mail className="size-5 text-white animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm sm:text-base">
                      {unreadContactMessages.length} nouvelle{unreadContactMessages.length > 1 ? 's' : ''} demande{unreadContactMessages.length > 1 ? 's' : ''} de contact reçue{unreadContactMessages.length > 1 ? 's' : ''} !
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-[#FF5B37] uppercase tracking-wider">
                      Site Web
                    </span>
                  </div>
                  <p className="text-xs text-white/90 mt-0.5 line-clamp-1">
                    Dernière demande de <strong>{unreadContactMessages[0]?.name}</strong> concernant « {unreadContactMessages[0]?.subject} ».
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                <Link
                  to="/contacts?tab=messages"
                  onClick={() => {
                    const ids = unreadContactMessages.map((m: any) => m.id);
                    if (ids.length > 0) dismissAndMarkAllAsRead(ids);
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-[#FF5B37] hover:bg-orange-50 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="size-3.5" />
                  <span>Consulter & Répondre</span>
                </Link>
                {/* Bouton rapide : Marquer comme traité sans quitter la page */}
                <button
                  type="button"
                  onClick={() => {
                    const ids = unreadContactMessages.map((m: any) => m.id);
                    if (ids.length > 0) dismissAndMarkAllAsRead(ids);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Marquer ces demandes comme traitées"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Marquer comme traité</span>
                </button>
                {/* Bouton croix pour fermer */}
                <button
                  type="button"
                  title="Fermer l'alerte"
                  onClick={() => {
                    const ids = unreadContactMessages.map((m: any) => m.id);
                    if (ids.length > 0) dismissAndMarkAllAsRead(ids);
                  }}
                  className="size-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="size-4 text-white" />
                </button>
              </div>
            </div>
          )}
          
          {/* 1. LES 6 CARTES D'ACTION RAPIDE (Grille responsive 6 colonnes sur grand écran) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
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

            {/* 3. Comptes-rendus d'experts (Raccourci direct vers le journal des comptes-rendus) */}
            <button 
              type="button"
              onClick={() => navigate('/notes-suivi')}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <BookOpen className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Comptes-rendus</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">d'experts</div>
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


            {/* 6. Suivi des parcours & jalons bénéficiaires */}
            <button 
              type="button"
              onClick={() => navigate('/beneficiaires')}
              className="relative overflow-hidden bg-white rounded-md p-2.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#23c3b1]/60 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center gap-2.5 transition-all duration-200 ease-out group text-left cursor-pointer select-none"
            >
              <div className="size-11 rounded-md bg-[#23c3b1] group-hover:bg-[#1ba898] group-hover:shadow-xs group-hover:scale-105 text-white flex items-center justify-center shrink-0 transition-all duration-200 ease-out">
                <CheckCircle2 className="size-5 stroke-[1.75] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#178578] leading-tight transition-colors duration-200">Suivi des jalons</div>
                <div className="text-[11px] text-slate-500 group-hover:text-slate-700 font-normal leading-tight mt-0.5 transition-colors duration-200">Dossiers bénéficiaires</div>
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

          {/* 2. GESTION OPÉRATIONNELLE : Les 5 blocs de tâches Teasio (Plein format élargi) */}
          <div className="w-full bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
            
            {/* Ligne 1 : Parcours à créer & Étapes à valider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. En attente de parcours */}
              <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-200/70">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>En attente de parcours</span>
                    {parcoursACreer.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff1ec] text-[#e8664d] border border-[#fed7cc]">
                        {parcoursACreer.length}
                      </span>
                    )}
                  </h3>
                </div>
                
                {parcoursACreer.length === 0 ? (
                  <div className="border border-slate-200 rounded-lg py-6 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs mt-3">
                    Aucune tâche restante
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mt-3">
                    {parcoursACreer.map((b: any) => (
                      <div 
                        key={b.id} 
                        className="p-3 rounded-lg border border-orange-200/80 bg-white hover:border-[#f06553] hover:shadow-xs transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {b.firstName} {b.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[#f06553] font-semibold">{b.fileNumber || `IML-${b.fileSeq}`}</span>
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
                          className="px-3 py-1.5 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Plus className="size-3.5" />
                          <span>Créer</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Étapes à valider */}
              <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-200/70">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>Étapes à valider</span>
                    {etapesAValider.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {etapesAValider.length}
                      </span>
                    )}
                  </h3>
                </div>
                
                {etapesAValider.length === 0 ? (
                  <div className="border border-slate-200 rounded-lg py-6 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs mt-3">
                    Aucune tâche restante
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mt-3">
                    {etapesAValider.map((item: any) => (
                      <div 
                        key={item.stepId} 
                        className="p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate">{item.stepTitle}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.beneficiaryName}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleValidateStep(item.stepId, item.beneficiaryName, item.stepTitle)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Valider</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ligne 2 : Dates à proposer & Attribution des coachs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 3. Dates à proposer */}
              <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-200/70">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>Dates à proposer</span>
                    {datesAProposer.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {datesAProposer.length}
                      </span>
                    )}
                  </h3>
                </div>
                
                {datesAProposer.length === 0 ? (
                  <div className="border border-slate-200 rounded-lg py-6 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs mt-3">
                    Aucune tâche restante
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mt-3">
                    {datesAProposer.map((b: any) => (
                      <div 
                        key={b.id} 
                        className="p-3 rounded-lg border border-slate-200 bg-white hover:border-[#23c3b1] hover:shadow-xs transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate">{b.firstName} {b.lastName}</div>
                          <div className="text-[11px] text-amber-600 font-medium truncate mt-0.5">Créneau à planifier</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCreateAppointmentOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#23c3b1] text-slate-700 hover:text-[#23c3b1] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-2xs"
                        >
                          <Calendar className="size-3.5 text-[#23c3b1]" />
                          <span>Planifier</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Attribution des Coachs */}
              <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-200/70">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>Attribution des Coachs</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#178578] border border-teal-200">
                      {beneficiariesList.filter((b: any) => b.assignments?.length).length}/{beneficiariesList.length} coachés
                    </span>
                  </h3>
                </div>
                
                {beneficiariesList.length === 0 ? (
                  <div className="border border-slate-200 rounded-lg py-6 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs mt-3">
                    Aucun bénéficiaire enregistré
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mt-3">
                    {beneficiariesList.map((b: any) => {
                      const hasCoach = b.assignments?.[0]?.user;
                      const coachName = hasCoach 
                        ? `${b.assignments[0].user.firstName} ${b.assignments[0].user.lastName}` 
                        : null;
                      const pName = b.projects?.[0]?.name;

                      return (
                        <div 
                          key={b.id} 
                          className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {b.firstName} {b.lastName}
                              </span>
                              {pName && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                  • {pName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              {coachName ? (
                                <span className="inline-flex items-center gap-1 text-[#178578] bg-teal-50/90 px-2 py-0.5 rounded border border-teal-200/80 font-medium" title="Coach assigné au bénéficiaire">
                                  <UserCheck className="size-3 text-[#178578]" />
                                  <span className="truncate max-w-[200px]">Coach : {coachName}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium" title="En attente d'attribution d'un coach">
                                  <Info className="size-3 text-amber-500" />
                                  <span>Aucun coach assigné</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignmentModal(b)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold shrink-0 transition-colors cursor-pointer active:scale-95 shadow-2xs self-center"
                          >
                            {coachName ? 'Modifier' : 'Assigner'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

              {/* Section 5 : Demandes de Salle & Masterclasses (Indépendantes de l'incubation) */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-orange-50 text-[#FF5B37] flex items-center justify-center">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                        <span>Réservations de Salle & Masterclasses</span>
                        {pendingRoomBookings.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5B37]/15 text-[#FF5B37] border border-[#FF5B37]/30">
                            {pendingRoomBookings.length} en attente
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500">Demandes de privatisation externe • Sans dossier d'incubation</p>
                    </div>
                  </div>
                </div>

                {roomBookings.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50/50">
                    Aucune demande de réservation de salle pour le moment.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {roomBookings.map((b: any) => {
                      const start = new Date(b.startAt);
                      const end = new Date(b.endAt);
                      const dateStr = start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                      const timeStr = `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
                      const isPending = b.status === 'EN_ATTENTE';
                      const isConfirmed = b.status === 'CONFIRMEE';

                      return (
                        <div
                          key={b.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isPending 
                              ? 'bg-amber-50/50 border-amber-200/80 shadow-2xs' 
                              : isConfirmed 
                              ? 'bg-emerald-50/40 border-emerald-200/80' 
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedRoomBooking(b)}
                                className="text-xs font-bold text-slate-900 hover:text-[#FF5B37] text-left cursor-pointer transition-colors"
                                title="Cliquer pour voir les détails de cette réservation"
                              >
                                {b.organizerName}
                              </button>
                              {b.organization && (
                                <span className="text-[11px] text-slate-500 font-medium">({b.organization})</span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 uppercase">
                                {b.eventType}
                              </span>
                              {b.source === 'ASSISTANT' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                                  <Bot className="size-2.5" /> IA
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPending ? 'bg-amber-100 text-amber-800' : isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {isPending ? 'En attente' : isConfirmed ? 'Salle verrouillée ✓' : 'Refusée'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1 font-medium text-slate-800">
                                <Clock className="size-3 text-slate-400" />
                                <span>{dateStr} • {timeStr}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3 text-slate-400" />
                                <span>{b.attendees} participants</span>
                              </span>
                              {b.phone && (
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Phone className="size-3 text-slate-400" />
                                  <a href={`tel:${b.phone}`} className="hover:text-[#FF5B37]">{b.phone}</a>
                                </span>
                              )}
                              {b.email && (
                                <span className="text-slate-500">{b.email}</span>
                              )}
                            </div>
                            {b.notes && (
                              <p className="text-[11px] text-slate-500 italic truncate max-w-xl">« {b.notes} »</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedRoomBooking(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:border-[#FF5B37] hover:text-[#FF5B37]"
                              title="Voir tous les détails de cette réservation"
                            >
                              <Eye className="size-3.5 text-[#FF5B37]" />
                              <span>Détails</span>
                            </button>

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDecideRoomBooking(b.id, 'CONFIRMEE')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  <span>Confirmer & bloquer</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecideRoomBooking(b.id, 'REFUSEE')}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Refuser
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <span>Aujourd'hui</span>
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
                  <span>Demain</span>
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
                  Affectation du Dossier & du Coach
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
                <label className="block font-medium text-slate-800 mb-0.5">
                  Chargé de dossier (Agent IML)
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Instruction administrative, éligibilité et suivi du parcours.
                </p>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                >
                  <option value="">Sélectionner un chargé de dossier...</option>
                  {allStaff
                    .filter((s: any) => s.role?.code === 'AGENT' || s.role?.code === 'ADMIN')
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} (Chargé de dossier IML)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-800 mb-0.5">
                  Coach / Mentor d'affaires
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Expert métier en charge des séances pratiques et du mentorat.
                </p>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                >
                  <option value="">Sélectionner un coach / mentor...</option>
                  {allStaff
                    .filter((s: any) => s.role?.code === 'COACH' || s.role?.code === 'ADMIN')
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} (Coach / Mentor)
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

      {/* MODAL DE DÉTAIL COMPLET D'UNE RÉSERVATION DE SALLE */}
      {selectedRoomBooking && (
        <RoomBookingDetailModal
          booking={selectedRoomBooking}
          onClose={() => setSelectedRoomBooking(null)}
          onDecide={async (id, status) => {
            await handleDecideRoomBooking(id, status);
            refetchRoomBookings();
            setSelectedRoomBooking(null);
          }}
          onReschedule={() => {
            refetchRoomBookings();
            setDashboardToast('Créneau de la salle décalé avec succès. Le client a été notifié.');
          }}
        />
      )}

      {/* TOAST DE FEEDBACK DU TABLEAU DE BORD (Positionné sous la navbar fixe) */}
      {dashboardToast && (
        <div className="fixed top-20 right-6 z-[9999] flex items-center gap-3 bg-[#101f2e] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/50 animate-in slide-in-from-top-4 fade-in duration-200 backdrop-blur-md">
          <div className="size-6 rounded-full bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-100">{dashboardToast}</span>
          <button 
            type="button"
            onClick={() => setDashboardToast(null)} 
            className="text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer text-lg leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      )}

    </div>
  );
}
