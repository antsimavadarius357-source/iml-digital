import { useState, useMemo } from 'react';
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
  Plus
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
                  Sur base de vos 0 bénéficiaires actifs
                </p>

                {/* Graphique avec axes et graduations exactes */}
                <div className="h-44 w-full flex items-end pt-2 pb-7 border-l border-b border-slate-300 relative pl-2 select-none">
                  {/* Échelle Y */}
                  <div className="absolute -left-5 top-0 bottom-7 flex flex-col justify-between text-[10px] text-slate-500 font-mono">
                    <span>1</span>
                    <span>0.8</span>
                    <span>0.6</span>
                    <span>0.4</span>
                    <span>0.2</span>
                    <span>0</span>
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
                <div>
                  <h3 className="text-[14px] font-normal text-slate-800">
                    Parcours à créer
                  </h3>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                    Aucune tâche restante
                  </div>
                </div>

                <div>
                  <h3 className="text-[14px] font-normal text-slate-800">
                    Étapes à valider
                  </h3>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                    Aucune tâche restante
                  </div>
                </div>
              </div>

              {/* Ligne 2 : Dates à proposer & En attente d'un coach */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-[14px] font-normal text-slate-800">
                    Dates à proposer
                  </h3>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                    Aucune tâche restante
                  </div>
                </div>

                <div>
                  <h3 className="text-[14px] font-normal text-slate-800">
                    En attente d'un coach
                  </h3>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                    Aucune tâche restante
                  </div>
                </div>
              </div>

              {/* Ligne 3 : Certificats numériques à attribuer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-[14px] font-normal text-slate-800">
                    Certificats numériques à attribuer
                  </h3>
                  <div className="border-b border-slate-200 mt-1 mb-2.5" />
                  <div className="border border-slate-200 rounded py-3.5 px-3 text-center text-xs text-slate-400 bg-white shadow-2xs">
                    Il n'y a pas de certificats numériques à attribuer
                  </div>
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

    </div>
  );
}
