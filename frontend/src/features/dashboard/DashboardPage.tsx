import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MessageSquare, 
  Copy,
  Timer
} from 'lucide-react';
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
  const [selectedDay, setSelectedDay] = useState(12);
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

  // Jours du calendrier Octobre 2026 (le 1er octobre est un jeudi)
  const calendarDays = [
    { day: 27, currentMonth: false },
    { day: 28, currentMonth: false },
    { day: 29, currentMonth: false },
    { day: 30, currentMonth: false },
    { day: 1, currentMonth: true },
    { day: 2, currentMonth: true },
    { day: 3, currentMonth: true },
    { day: 4, currentMonth: true },
    { day: 5, currentMonth: true },
    { day: 6, currentMonth: true },
    { day: 7, currentMonth: true },
    { day: 8, currentMonth: true },
    { day: 9, currentMonth: true },
    { day: 10, currentMonth: true },
    { day: 11, currentMonth: true },
    { day: 12, currentMonth: true },
    { day: 13, currentMonth: true },
    { day: 14, currentMonth: true },
    { day: 15, currentMonth: true },
    { day: 16, currentMonth: true },
    { day: 17, currentMonth: true },
    { day: 18, currentMonth: true },
    { day: 19, currentMonth: true },
    { day: 20, currentMonth: true },
    { day: 21, currentMonth: true },
    { day: 22, currentMonth: true },
    { day: 23, currentMonth: true },
    { day: 24, currentMonth: true },
    { day: 25, currentMonth: true },
    { day: 26, currentMonth: true },
    { day: 27, currentMonth: true },
    { day: 28, currentMonth: true },
    { day: 29, currentMonth: true },
    { day: 30, currentMonth: true },
    { day: 31, currentMonth: true },
  ];

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
            <h2 className="text-[14px] font-semibold text-slate-800">
              Mon calendrier
            </h2>
            <div className="border-b border-slate-100 my-1.5" />

            {/* Notification aucun événement */}
            <div className="bg-slate-50/80 border border-slate-100 rounded py-1.5 px-3 text-center text-xs text-slate-400">
              Aucun événement en Octobre 2026
            </div>

            {/* Mois & Flèches de navigation rouge/corail */}
            <div className="flex items-center justify-between pt-1">
              <button 
                type="button"
                className="size-6 rounded-full border border-red-300 text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <span className="text-xs font-bold text-slate-800 tracking-wide">
                Octobre 2026
              </span>

              <button 
                type="button"
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
              {calendarDays.map((item, idx) => {
                const isSelected = item.currentMonth && item.day === selectedDay;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => item.currentMonth && setSelectedDay(item.day)}
                    className={`size-6 mx-auto rounded-full flex items-center justify-center text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#23c3b1] text-white font-medium shadow-xs'
                        : item.currentMonth
                        ? 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                        : 'text-slate-300 pointer-events-none'
                    }`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Détail du jour sélectionné */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Lundi {selectedDay}
              </div>
              <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                <span>Aucun événement le Lundi {selectedDay} Octobre 2026</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          3 BOUTONS FLOTTANTS CORAIL EN BAS À DROITE (Minuteur, Notes, Messagerie)
         ========================================================================= */}
      <div className="fixed bottom-20 sm:bottom-24 right-6 sm:right-8 z-40 flex items-center gap-2.5 bg-white/50 p-1.5 rounded-full backdrop-blur-xs border border-white/70 shadow-lg">
        {/* Minuteur */}
        <button
          type="button"
          title="Minuteur de séance"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-md shadow-[#f06553]/40 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Timer className="size-5" />
        </button>

        {/* Bloc-notes */}
        <button
          type="button"
          title="Prise de notes rapide"
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
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-md shadow-[#f06553]/40 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Copy className="size-5" />
        </button>

        {/* Messagerie */}
        <button
          type="button"
          title="Messagerie & Assistance"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-md shadow-[#f06553]/40 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <MessageSquare className="size-5" />
        </button>
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
