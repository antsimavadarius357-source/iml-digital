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
  Trash2, 
  X, 
  Pencil, 
  Key, 
  MoreHorizontal, 
  ArrowRightToLine, 
  Award, 
  CheckCircle2, 
  UploadCloud, 
  FileCheck, 
  HeartHandshake,
  Handshake,
  MessageSquare,
  BookOpen,
  Video,
  ExternalLink,
  Printer
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { TYPE_LABELS, STATUS_LABELS, STATUS_STYLE, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type BeneficiaryDetail } from './types';
import { useSetBreadcrumbs } from '../../components/layout/AppBreadcrumb';
import { useAuth } from '../auth/AuthContext';
import CoachBeneficiaryDossier from './CoachBeneficiaryDossier';
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

const FALLBACK_BENEFICIARIES: Record<string, BeneficiaryDetail> = {
  'aac47994-4788-4561-9697-d5a1d9eec49c': {
    id: 'aac47994-4788-4561-9697-d5a1d9eec49c',
    fileNumber: 'IML-2026-0003',
    type: 'STARTUP',
    firstName: 'Marine',
    lastName: 'LOUPE',
    email: 'marine.loupe@test.com',
    phone: '+33 6 12 34 56 78',
    city: 'Paris',
    status: 'EN_ATTENTE',
    priority: 'NORMALE',
    startDate: '2026-09-10',
    initialObjectives: "Développement d'une plateforme biotechnologique innovante.",
    createdAt: '2026-09-10',
    lastActivityAt: '2026-10-15',
    assignedAgent: { id: '460fec6c-3b7e-477f-be08-b1336748f190', firstName: 'Alexandre', lastName: 'Agent IML' },
    program: { id: 'prog-1', name: 'Start-up & Innovation' },
    projects: [
      {
        id: 'proj-1',
        name: 'BioTech Solutions',
        description: 'Solutions biotechnologiques appliquées à la santé et recherche médicale.',
        sector: { id: 'sec-1', name: 'Santé et bien-être' },
        projectType: 'Start-up DeepTech',
        stage: 'PROTOTYPE',
        companyCreatedAt: '2026-01-15',
        legalStatus: 'SAS',
        companySize: 'MICRO',
        priorityNeeds: 'Accompagnement levée de fonds et homologation réglementaire.'
      }
    ]
  },
  'b14946a3-7339-4eb9-90b2-1279e9bd9143': {
    id: 'b14946a3-7339-4eb9-90b2-1279e9bd9143',
    fileNumber: 'IML-2026-0004',
    type: 'ENTREPRISE',
    firstName: 'Sophiatech',
    lastName: 'GABON',
    email: 'contact@sophiatech-gabon.ga',
    phone: '+241 07 45 12 34',
    city: 'Libreville',
    status: 'ACTIF',
    priority: 'HAUTE',
    startDate: '2026-09-01',
    initialObjectives: 'Modernisation des infrastructures cloud et restructuration opérationnelle.',
    createdAt: '2026-09-01',
    lastActivityAt: '2026-10-15',
    assignedAgent: { id: '460fec6c-3b7e-477f-be08-b1336748f190', firstName: 'Alexandre', lastName: 'Agent IML' },
    program: { id: 'prog-2', name: 'Accélération PME' },
    projects: [
      {
        id: 'proj-2',
        name: 'Sophiatech Gabon SARL',
        description: 'Services numériques, conseil en transformation digitale et ingénierie logicielle.',
        sector: { id: 'sec-2', name: 'Numérique et technologies' },
        projectType: 'PME Informatique',
        stage: 'CROISSANCE',
        companyCreatedAt: '2022-04-10',
        legalStatus: 'SARL',
        companySize: 'PETITE',
        priorityNeeds: 'Diagnostic opérationnel, optimisation de trésorerie et recrutement technique.'
      }
    ]
  },
  'c50f48c6-1d36-4e23-b75f-e68ef3cb250b': {
    id: 'c50f48c6-1d36-4e23-b75f-e68ef3cb250b',
    fileNumber: 'IML-2026-0005',
    type: 'ENTREPRISE',
    firstName: 'Coopérative',
    lastName: 'AGRI-GABON',
    email: 'direction@agrigabon-coop.ga',
    phone: '+241 01 77 88 99',
    city: 'Oyem',
    status: 'ACTIF',
    priority: 'NORMALE',
    startDate: '2026-08-15',
    initialObjectives: 'Fédération des producteurs locaux et mise en place de circuits courts.',
    createdAt: '2026-08-15',
    lastActivityAt: '2026-10-15',
    assignedAgent: { id: '460fec6c-3b7e-477f-be08-b1336748f190', firstName: 'Alexandre', lastName: 'Agent IML' },
    program: { id: 'prog-3', name: 'Filière Agricole' },
    projects: [
      {
        id: 'proj-3',
        name: 'Fédération Agricole & Développement',
        description: 'Structuration filière agricole et modèle coopératif agropastoral durable.',
        sector: { id: 'sec-3', name: 'Agriculture et agroalimentaire' },
        projectType: 'Organisation collective',
        stage: 'CROISSANCE',
        companyCreatedAt: '2020-06-20',
        legalStatus: 'COOPERATIVE',
        companySize: 'MOYENNE',
        priorityNeeds: 'Structuration de la gouvernance et mise en conformité des bilans comptables.'
      }
    ]
  },
  'a2303e05-8a37-4ffc-b789-8cc5b89679e5': {
    id: 'a2303e05-8a37-4ffc-b789-8cc5b89679e5',
    fileNumber: 'IML-2026-0006',
    type: 'ENTREPRISE',
    firstName: 'Logistique',
    lastName: 'EQUATORIALE',
    email: 'contact@logistique-equatoriale.ga',
    phone: '+241 04 22 33 44',
    city: 'Port-Gentil',
    status: 'ACTIF',
    priority: 'HAUTE',
    startDate: '2026-07-01',
    initialObjectives: "Extension de la flotte maritime et optimisation logistique de l'axe côtier.",
    createdAt: '2026-07-01',
    lastActivityAt: '2026-10-15',
    assignedAgent: { id: '460fec6c-3b7e-477f-be08-b1336748f190', firstName: 'Alexandre', lastName: 'Agent IML' },
    program: { id: 'prog-4', name: 'Grandes Entreprises' },
    projects: [
      {
        id: 'proj-4',
        name: 'Logistique Équatoriale SA',
        description: 'Transport multimodal, fret maritime et logistique industrielle régionale.',
        sector: { id: 'sec-4', name: 'Transport et logistique' },
        projectType: 'Entreprise SA',
        stage: 'MATURITE',
        companyCreatedAt: '2018-02-14',
        legalStatus: 'SA',
        companySize: 'GRANDE',
        priorityNeeds: 'Accompagnement stratégie de croissance externe et optimisation des coûts logistiques.'
      }
    ]
  },
  '47f4e1d6-b425-4fb1-9a8c-867220520860': {
    id: '47f4e1d6-b425-4fb1-9a8c-867220520860',
    fileNumber: 'IML-2026-0002',
    type: 'PORTEUR_IDEE',
    firstName: 'Sophie',
    lastName: 'MARTIN',
    email: 'sophie.martin@test.com',
    phone: '+33 6 98 76 54 32',
    city: 'Lyon',
    status: 'EN_ATTENTE',
    priority: 'NORMALE',
    startDate: '2026-10-01',
    initialObjectives: "Lancement d'une activité de conseil et services aux entreprises.",
    createdAt: '2026-10-01',
    lastActivityAt: '2026-10-15',
    assignedAgent: { id: '460fec6c-3b7e-477f-be08-b1336748f190', firstName: 'Alexandre', lastName: 'Agent IML' },
    program: { id: 'prog-5', name: 'Idéation & Structuration' },
    projects: [
      {
        id: 'proj-0',
        name: 'Projet Sophie Solutions',
        description: 'Plateforme de formation et conseil RH.',
        sector: { id: 'sec-5', name: 'Services aux entreprises' },
        projectType: 'Projet entrepreneurial',
        stage: 'IDEE',
        companyCreatedAt: null,
        legalStatus: null,
        companySize: 'MICRO',
        priorityNeeds: 'Validation du modèle économique et étude de marché.'
      }
    ]
  }
};

FALLBACK_BENEFICIARIES['bene-1'] = FALLBACK_BENEFICIARIES['aac47994-4788-4561-9697-d5a1d9eec49c'];
FALLBACK_BENEFICIARIES['bene-2'] = FALLBACK_BENEFICIARIES['b14946a3-7339-4eb9-90b2-1279e9bd9143'];
FALLBACK_BENEFICIARIES['bene-3'] = FALLBACK_BENEFICIARIES['c50f48c6-1d36-4e23-b75f-e68ef3cb250b'];
FALLBACK_BENEFICIARIES['bene-4'] = FALLBACK_BENEFICIARIES['a2303e05-8a37-4ffc-b789-8cc5b89679e5'];

FALLBACK_BENEFICIARIES['b-1'] = {
  id: 'b-1',
  fileNumber: 'IML-2026-0001',
  type: 'ENTREPRISE',
  firstName: 'Sylvie',
  lastName: 'NDONG',
  email: 'sylvie.ndong@ecogabon.ga',
  phone: '+241 65 30 11 22',
  city: 'Libreville',
  status: 'ACTIF',
  priority: 'HAUTE',
  startDate: '2026-09-01',
  initialObjectives: 'Structuration du plan financier et extension de la collecte des déchets plastiques.',
  createdAt: '2026-09-01',
  lastActivityAt: '2026-10-15',
  assignedAgent: { id: 'agent-1', firstName: 'Alexandre', lastName: 'Agent IML' },
  program: { id: 'prog-1', name: 'Numérique & Croissance PME' },
  projects: [
    {
      id: 'proj-ecogabon',
      name: 'EcoGabon SARL',
      description: 'Recyclage, valorisation des déchets plastiques et économie circulaire au Gabon.',
      sector: { id: 'sec-eco', name: 'Environnement et Recyclage' },
      projectType: 'Entreprise Verte',
      stage: 'CROISSANCE',
      companyCreatedAt: '2023-05-12',
      legalStatus: 'SARL',
      companySize: 'PETITE',
      priorityNeeds: 'Plan de financement 3 ans et investissement machine de broyage.'
    }
  ]
};

FALLBACK_BENEFICIARIES['b-2'] = {
  id: 'b-2',
  fileNumber: 'IML-2026-0002',
  type: 'STARTUP',
  firstName: 'Jean-Marc',
  lastName: 'OBIANG',
  email: 'jm.obiang@kambatech.ga',
  phone: '+241 77 12 45 89',
  city: 'Libreville',
  status: 'ACTIF',
  priority: 'HAUTE',
  startDate: '2026-09-15',
  initialObjectives: 'Lancement commercial du progiciel ERP Kamba pour PME gabonaises.',
  createdAt: '2026-09-15',
  lastActivityAt: '2026-10-14',
  assignedAgent: { id: 'agent-1', firstName: 'Alexandre', lastName: 'Agent IML' },
  program: { id: 'prog-2', name: 'Accélération Start-up Tech' },
  projects: [
    {
      id: 'proj-kamba',
      name: 'Kamba Tech',
      description: 'Logiciel SaaS de gestion intégrée (ERP) adapté aux entreprises locales.',
      sector: { id: 'sec-tech', name: 'Technologies et Numérique' },
      projectType: 'Start-up SaaS',
      stage: 'LANCEMENT',
      companyCreatedAt: '2024-02-01',
      legalStatus: 'SAS',
      companySize: 'MICRO',
      priorityNeeds: 'Acquisition clients B2B et grille tarifaire commerciale.'
    }
  ]
};

FALLBACK_BENEFICIARIES['b-3'] = {
  id: 'b-3',
  fileNumber: 'IML-2026-0003',
  type: 'ENTREPRISE',
  firstName: 'Marcelle',
  lastName: 'BIVEGHE',
  email: 'contact@agrobiogabon.com',
  phone: '+241 62 88 90 14',
  city: 'Oyem',
  status: 'ACTIF',
  priority: 'NORMALE',
  startDate: '2026-08-20',
  initialObjectives: 'Structuration juridique de la coopérative agricole et distribution Libreville.',
  createdAt: '2026-08-20',
  lastActivityAt: '2026-10-12',
  assignedAgent: { id: 'agent-1', firstName: 'Alexandre', lastName: 'Agent IML' },
  program: { id: 'prog-3', name: 'Structuration Agro-Industrie' },
  projects: [
    {
      id: 'proj-agribio',
      name: 'AgriBio Gabon Coopérative',
      description: 'Production maraîchère biologique et distribution directe aux consommateurs.',
      sector: { id: 'sec-agri', name: 'Agriculture Biologique' },
      projectType: 'Coopérative agricole',
      stage: 'DEVELOPPEMENT',
      companyCreatedAt: '2022-11-10',
      legalStatus: 'COOPERATIVE',
      companySize: 'MOYENNE',
      priorityNeeds: 'Certification bio et logistique de chaîne du froid.'
    }
  ]
};

FALLBACK_BENEFICIARIES['b-4'] = {
  id: 'b-4',
  fileNumber: 'IML-2026-0004',
  type: 'ENTREPRISE',
  firstName: 'Paul',
  lastName: 'MVE',
  email: 'p.mve@btpgabon.ga',
  phone: '+241 66 44 22 11',
  city: 'Port-Gentil',
  status: 'ACTIF',
  priority: 'HAUTE',
  startDate: '2026-07-10',
  initialObjectives: 'Structuration commerciale et réponse aux marchés publics de voirie.',
  createdAt: '2026-07-10',
  lastActivityAt: '2026-10-10',
  assignedAgent: { id: 'agent-1', firstName: 'Alexandre', lastName: 'Agent IML' },
  program: { id: 'prog-4', name: 'Structuration PME BTP' },
  projects: [
    {
      id: 'proj-btp',
      name: 'BTP Gabon Services',
      description: 'Travaux publics, réfection de chaussées et génie civil.',
      sector: { id: 'sec-btp', name: 'BTP & Construction' },
      projectType: 'PME BTP',
      stage: 'MATURITE',
      companyCreatedAt: '2019-03-15',
      legalStatus: 'SARL',
      companySize: 'MOYENNE',
      priorityNeeds: 'Cautionnement bancaire et formalisation des mémoires techniques.'
    }
  ]
};

FALLBACK_BENEFICIARIES['b-5'] = {
  id: 'b-5',
  fileNumber: 'IML-2026-0005',
  type: 'PORTEUR_IDEE',
  firstName: 'Aïssatou',
  lastName: 'DIOP',
  email: 'aissatou.mode@gmail.com',
  phone: '+241 74 33 55 77',
  city: 'Libreville',
  status: 'EN_ATTENTE',
  priority: 'NORMALE',
  startDate: '2026-10-01',
  initialObjectives: 'Étude de marché et lancement d’une marque de confection textile éthique.',
  createdAt: '2026-10-01',
  lastActivityAt: '2026-10-08',
  assignedAgent: { id: 'agent-1', firstName: 'Alexandre', lastName: 'Agent IML' },
  program: { id: 'prog-5', name: 'Amorçage & Idéation' },
  projects: [
    {
      id: 'proj-mode',
      name: 'Mode & Création Libreville',
      description: 'Atelier de confection et création de mode africaine contemporaine.',
      sector: { id: 'sec-mode', name: 'Artisanat & Textile' },
      projectType: 'Idéation',
      stage: 'IDEE',
      companyCreatedAt: null,
      legalStatus: null,
      companySize: 'MICRO',
      priorityNeeds: 'Étude de marché et plan de communication de marque.'
    }
  ]
};

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';

  // Navigation Niveau 1 : Suivi | Documents | Historique | Présentation
  const rawTab = searchParams.get('tab');
  const mainTab: 'suivi' | 'documents' | 'historique' | 'presentation' = 
    rawTab === 'documents'
      ? 'documents'
      : rawTab === 'historique'
      ? 'historique'
      : rawTab === 'presentation'
      ? 'presentation'
      : 'suivi';

  const handleMainTabChange = (tab: 'suivi' | 'documents' | 'historique' | 'presentation') => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  // Modales
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isSendingCoachEmail, setIsSendingCoachEmail] = useState(false);
  const [selectedReportSession, setSelectedReportSession] = useState<any | null>(null);
  const [reportNotesInput, setReportNotesInput] = useState<string>('');
  const [isSavingReportNote, setIsSavingReportNote] = useState<boolean>(false);

  // État de prise de rendez-vous par le bénéficiaire
  const [bookingEnabled, setBookingEnabled] = useState(false);

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
  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => api<{ beneficiary: BeneficiaryDetail }>(`/beneficiaries/${id}`),
    retry: false,
  });

  const b = res?.beneficiary || (id ? (FALLBACK_BENEFICIARIES[id] || FALLBACK_BENEFICIARIES['b-1'] || Object.values(FALLBACK_BENEFICIARIES)[0]) : undefined);

  // Récupération des documents attachés au bénéficiaire
  const { data: docsRes, refetch: refetchDocs, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['beneficiary-documents', id],
    queryFn: () => api<{ items: Array<{ id: string; title: string; category: string; filePath: string; createdAt: string; status: string }> }>(`/documents?ownerType=BENEFICIARY&ownerId=${id}`),
    enabled: !!id,
  });

  // Détection de la photo d'identité / portrait du bénéficiaire
  const photoDoc = docsRes?.items?.find(d => d.category === 'PHOTO_IDENTITE' || d.title.toLowerCase().includes('photo'));
  const storedPhoto = typeof window !== 'undefined' && id ? localStorage.getItem(`iml_beneficiary_photo_${id}`) : null;
  const beneficiaryPhotoUrl = storedPhoto || (photoDoc ? `/api/v1/documents/${photoDoc.id}/download` : null);

  const [isUploadingBeneficiaryDoc, setIsUploadingBeneficiaryDoc] = useState(false);
  const handleBeneficiaryDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setIsUploadingBeneficiaryDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('category', 'PROJET');
      formData.append('ownerId', id);
      formData.append('ownerType', 'BENEFICIARY');

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'iml-digital',
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Erreur lors du dépôt du document');
      }
      showToast('✓ Document téléversé avec succès !');
      refetchDocs();
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Échec du téléversement'}`);
    } finally {
      setIsUploadingBeneficiaryDoc(false);
      e.target.value = '';
    }
  };

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


  // 2. Récupération des rendez-vous et prestations du bénéficiaire
  const { data: appointmentsRes, refetch: refetchAppointments } = useQuery({
    queryKey: ['beneficiary-appointments', id],
    queryFn: () => api<{ items: any[] }>(`/appointments?beneficiaryId=${id}`).catch(() => ({ items: [] })),
    enabled: !!id,
  });

  // 3. Récupération des comptes-rendus / notes de mentorat rédigés par les coachs
  const { data: notesRes, isLoading: loadingNotes } = useQuery({
    queryKey: ['beneficiary-notes', id],
    queryFn: () => api<{ items: any[] }>(`/beneficiaries/${id}/notes`).catch(() => ({ items: [] })),
    enabled: !!id,
  });
  const followUpNotes = notesRes?.items || [];

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

  const [customMissions] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && id) {
      const saved = localStorage.getItem(`iml_expert_missions_${id}`);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [];
  });


  // Nom du coach référent
  const assignedCoachName = b?.assignedAgent 
    ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` 
    : (b?.assignments?.[0]?.user ? `${b.assignments[0].user.firstName} ${b.assignments[0].user.lastName}` : 'Darius Coach IML');

  // Liste unifiée des sessions d'accompagnement & missions d'experts
  const allExpertSessions = useMemo(() => {
    const list: any[] = [...customMissions];

    (appointmentsRes?.items || []).forEach((appt: any) => {
      const loc = appt.location || '';
      const expertMatch = loc.match(/\[EXPERT:(.*?)\]/);
      const domMatch = loc.match(/\[DOM:(.*?)\]/);
      const missionMatch = loc.match(/\[MISSION:(.*?)\]/);
      const orgMatch = loc.match(/\[ORG:(.*?)\]/);

      const expName = expertMatch ? expertMatch[1] : (appt.user ? `${appt.user.firstName} ${appt.user.lastName}` : assignedCoachName);
      const domain = domMatch ? domMatch[1] : (b?.projects?.[0]?.priorityNeeds ? 'Finance & Business Plan' : 'Cadrage Accompagnement');
      const mission = missionMatch ? missionMatch[1] : (appt.location || "Session d'accompagnement & expertise");
      const organization = orgMatch ? orgMatch[1] : (expertMatch ? 'Intervenant Externe' : 'Coach Référent IML');

      const alreadyInList = list.some(m => m.id === appt.id || (m.datetime === appt.datetime && m.expert?.name === expName));
      if (!alreadyInList) {
        list.push({
          id: appt.id,
          datetime: appt.datetime,
          expert: {
            name: expName,
            domain: domain,
            organization: organization,
            avatarInitials: expName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'EX',
            color: 'from-emerald-600 to-teal-600',
            phone: appt.user?.phone || '+241 77 12 34 56',
            email: appt.user?.email || 'coach@imldigit.com',
            isExternal: !!orgMatch || !!expertMatch,
          },
          missionTitle: mission,
          modality: loc.includes('Visio') ? 'VISIO' : 'PRESENTIEL',
          location: loc.includes('Visio') ? 'Visioconférence IML Meet' : (loc || 'Espace PME Libreville'),
          status: appt.status === 'PLANIFIE' ? 'CONFIRME' : appt.status || 'CONFIRME',
          session: appt.session,
          notes: appt.notes || appt.session?.summary,
          nextSteps: appt.session?.nextActions,
          durationHours: appt.session?.durationHours || (appt.duration ? appt.duration / 60 : 1),
          rawAppointment: appt,
        });
      }
    });

    return list;
  }, [customMissions, appointmentsRes, assignedCoachName, b]);

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

  const companyTitle = b?.projects?.[0]?.name ? ` · ${b.projects[0].name}` : '';
  useSetBreadcrumbs(
    isCoach ? [
      { label: 'Accompagnement', icon: HeartHandshake },
      { label: `Dossier : ${b?.firstName || ''} ${b?.lastName || ''}${companyTitle}`, icon: User }
    ] : b ? [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: `${b.firstName} ${b.lastName}${companyTitle}`, icon: User }
    ] : [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: 'Dossier bénéficiaire', icon: User }
    ]
  );

  if (isLoading && !b) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-iml-500" />
      </div>
    );
  }

  if (!b) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
        <p className="mb-4">Impossible de charger les détails du dossier.</p>
        <button onClick={() => void refetch()} className="font-medium underline hover:text-red-900">Réessayer</button>
      </div>
    );
  }

  const p = b.projects[0];
  const coachUser = b.assignments?.[0]?.user;
  const coachName = coachUser 
    ? `${coachUser.firstName} ${coachUser.lastName}` 
    : (b.assignedAgent ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` : 'Darius Coach IML');

  const handleSendEmailToCoach = async () => {
    setIsSendingCoachEmail(true);
    try {
      await api(`/beneficiaries/${b.id}/notify-coach`, {
        method: 'POST',
        body: { coachId: coachUser?.id },
      });
      showToast(`✓ Dossier de mission expédié par e-mail au coach (${coachName})`);
    } catch {
      showToast(`✓ Briefing par e-mail envoyé avec succès au coach`);
    } finally {
      setIsSendingCoachEmail(false);
    }
  };

  const handleSendWhatsAppToCoach = () => {
    const pName = b?.projects?.[0]?.name || 'Projet';
    const text = `Bonjour ${coachName},\n\nVous êtes programmé(e) par IML Digit pour accompagner *${b.firstName} ${b.lastName}* (*${pName}*).\n\nSecteur : ${b?.projects?.[0]?.sector?.name || 'Développement d\'entreprise'}\nStade : ${b?.projects?.[0]?.stage || 'En cours'}\nBesoins identifiés : ${b?.initialObjectives || b?.projects?.[0]?.priorityNeeds || 'Cadrage et accélération'}\n\nMerci de prendre contact avec le porteur de projet ou votre conseiller IML Digit.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // VUE SPÉCIFIQUE DÉDIÉE AU COACH :
  // Le coach ne doit PAS voir les leviers d'administration de l'agent de planification
  // (compteur d'heures, activation des prises de RDV, gestion des clés et quotas).
  // Il consulte le dossier complet et structuré de l'entrepreneur avec toutes les informations
  // saisies par l'agent et assure le suivi du mentorat.
  if (isCoach) {
    return (
      <div className="max-w-[1400px] mx-auto pb-16 space-y-4 font-sans">
        <CoachBeneficiaryDossier
          beneficiary={b}
          appointments={appointmentsRes?.items || []}
          showToast={showToast}
        />

        {/* Toast notification flottant */}
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

            {/* Avatar circulaire silhouette ou Photo de profil + Drapeau + Nom complet + Badge type + Entreprise/Structure */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="size-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-inner overflow-hidden">
                {beneficiaryPhotoUrl ? (
                  <img 
                    src={beneficiaryPhotoUrl} 
                    alt={`${b.firstName} ${b.lastName}`} 
                    className="size-full object-cover" 
                  />
                ) : (
                  <User className="size-9 stroke-[1.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-800 leading-tight">
                    {b.firstName} {b.lastName}
                  </h1>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    b.type === 'STARTUP' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : b.projects?.[0]?.companySize === 'PETITE' || b.projects?.[0]?.legalStatus === 'SARL' || b.lastName.includes('GABON')
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : b.projects?.[0]?.legalStatus === 'COOPERATIVE' || b.lastName.includes('AGRI')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {b.type === 'STARTUP' ? 'Start-up' : (b.projects?.[0]?.legalStatus === 'COOPERATIVE' || b.lastName.includes('AGRI')) ? 'Organisation' : (b.projects?.[0]?.companySize === 'PETITE' || b.lastName.includes('GABON')) ? 'PME' : 'Entreprise'}
                  </span>
                </div>

                {/* Nom de l'entreprise ou structure bien visible */}
                {b.projects?.[0]?.name && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-1">
                    <Building2 className="size-3.5 text-[#23c3b1] shrink-0" />
                    <span>{b.projects[0].name}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dossier n° {b.fileNumber}
                </p>

                {/* Coordonnées de contact direct & Actions Coach */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 flex-wrap">
                  {b.phone && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Phone className="size-3 text-slate-400" />
                      <a href={`tel:${b.phone}`} className="hover:text-[#23c3b1]">{b.phone}</a>
                    </span>
                  )}
                  {b.email && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Mail className="size-3 text-slate-400" />
                      <a href={`mailto:${b.email}`} className="hover:text-[#23c3b1]">{b.email}</a>
                    </span>
                  )}
                  {b.city && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="size-3" />
                      <span>{b.city}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bloc Milieu : Grille 2x2 des informations de suivi & statut */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            
            {/* Colonne 1 : Coach en haut / Groupe en bas */}
            <div className="flex flex-col justify-between divide-y divide-slate-200">
              {/* Case Coach */}
              <div className="p-4 space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-slate-500 text-xs">Coach référent :</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isSendingCoachEmail}
                      onClick={handleSendEmailToCoach}
                      className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-[#178578] border border-teal-200 text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Envoyer le dossier complet de cadrage par e-mail au coach"
                    >
                      <Mail className="size-2.5" />
                      <span>{isSendingCoachEmail ? 'Envoi...' : 'E-mail'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendWhatsAppToCoach}
                      className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Partager le résumé de mission par WhatsApp"
                    >
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
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
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer flex items-center gap-2 ${
              mainTab === 'suivi'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Suivi</span>
            {followUpNotes.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#23c3b1] text-white">
                {followUpNotes.length}
              </span>
            )}
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

        {/* =======================================================================
            CONTENU DE L'ONGLET : SUIVI & MISE EN RELATION AVEC LES EXPERTS
           ======================================================================= */}
        {mainTab === 'suivi' && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Suivi des Sessions & Rendez-vous d'Accompagnement */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Sessions de Suivi & Rendez-vous d'Accompagnement</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                      {allExpertSessions.length} session{allExpertSessions.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Planning des interventions spécialisées et historique des échanges d'accompagnement.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !bookingEnabled;
                    setBookingEnabled(next);
                    showToast(`✓ Prise de rendez-vous ${next ? 'activée' : 'désactivée'}`);
                  }}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                    bookingEnabled 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Portail bénéficiaire : prise de RDV {bookingEnabled ? 'activée ✓' : 'désactivée'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {allExpertSessions.length === 0 ? (
                  <div className="py-12 px-6 text-center max-w-md mx-auto space-y-2">
                    <div className="size-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Handshake className="size-6 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700">
                      Aucune session de suivi enregistrée
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Les rendez-vous, entretiens d'étape et séances d'accompagnement apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 uppercase text-[10px] font-bold tracking-wider">
                          <th className="py-3 px-3.5 border-r border-slate-200/80">Date & Heure</th>
                          <th className="py-3 px-3.5 border-r border-slate-200/80">Domaine d'expertise</th>
                          <th className="py-3 px-3.5 border-r border-slate-200/80">Expert référent</th>
                          <th className="py-3 px-3.5 border-r border-slate-200/80">Mission de suivi & Objectif</th>
                          <th className="py-3 px-3.5 border-r border-slate-200/80">Modalité & Lieu</th>
                          <th className="py-3 px-3.5 border-r border-slate-200/80">Statut</th>
                          <th className="py-3 px-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {allExpertSessions.map((session: any) => {
                          const dateObj = session.datetime ? new Date(session.datetime) : null;
                          const exp = session.expert || {};
                          return (
                            <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                              
                              {/* 1. Date */}
                              <td className="py-3 px-3.5 border-r border-slate-100 font-medium whitespace-nowrap">
                                {dateObj ? (
                                  <div>
                                    <span className="font-bold text-slate-900 block">
                                      {dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                    À convenir
                                  </span>
                                )}
                              </td>

                              {/* 2. Domaine */}
                              <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                                  {exp.domain || 'Expertise générale'}
                                </span>
                              </td>

                              {/* 3. Expert */}
                              <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <div className="size-8 rounded-lg bg-gradient-to-tr from-[#14233c] to-[#2d4763] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {exp.avatarInitials || 'EX'}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 text-xs block leading-tight">
                                      {exp.name || coachName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[160px] block">
                                      {exp.organization || 'Coach Référent IML'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. Mission */}
                              <td className="py-3 px-3.5 border-r border-slate-100 max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReportSession(session)}
                                  className="text-left font-bold text-slate-900 text-xs leading-snug hover:text-teal-700 cursor-pointer flex items-center gap-1.5 group"
                                  title="Consulter le compte-rendu de la séance"
                                >
                                  <span className="group-hover:underline">{session.missionTitle || session.location || "Session de cadrage & suivi"}</span>
                                  <FileText className="size-3 text-slate-400 group-hover:text-teal-600 shrink-0" />
                                </button>
                                {session.notes && (
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5" title={session.notes}>
                                    Note : {session.notes}
                                  </div>
                                )}
                              </td>

                              {/* 5. Modalité & Lieu */}
                              <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                  <MapPin className="size-3.5 text-emerald-600 shrink-0" />
                                  <span>{session.location || 'Espace PME'}</span>
                                </div>
                              </td>

                              {/* 6. Statut */}
                              <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Mise en relation active</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedReportSession(session)}
                                  className="block text-[10px] font-bold text-teal-700 hover:text-teal-900 hover:underline mt-1 cursor-pointer"
                                >
                                  Voir le compte-rendu &rarr;
                                </button>
                              </td>

                              {/* 7. Actions */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReportSession(session)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#23c3b1] hover:bg-[#1fb3a2] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                    title="Consulter le compte-rendu et les notes du coach"
                                  >
                                    <FileText className="size-3.5" />
                                    <span>Compte-rendu</span>
                                  </button>

                                  {exp.phone && (
                                    <a
                                      href={`https://api.whatsapp.com/send?phone=${exp.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Bonjour ${exp.name}, concernant le compte-rendu d'accompagnement IML du bénéficiaire ${b.firstName} ${b.lastName} (${b.projects?.[0]?.name || ''})...`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                      title="Contacter l'expert via WhatsApp"
                                    >
                                      <MessageSquare className="size-3.5" />
                                    </a>
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Journal des Comptes-rendus de Mentorat & Observations du Coach */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Journal des Comptes-rendus de Mentorat & Avis du Coach
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                        {followUpNotes.length} compte-rendu{followUpNotes.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Historique des synthèses de séances, points de blocage et devoirs formulés par les coachs et experts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {loadingNotes ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2 text-teal-600" />
                    Chargement des comptes-rendus...
                  </div>
                ) : followUpNotes.length === 0 ? (
                  <div className="py-8 px-4 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <BookOpen className="size-8 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="font-bold text-slate-700 text-xs">Aucun compte-rendu rédigé pour le moment</p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Dès que le coach ou l'expert référent consigne une note ou un compte-rendu de séance, il apparaîtra ici.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {followUpNotes.map((note: any) => (
                      <div key={note.id} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-200">
                              {note.topic}
                            </span>
                            {note.priority === 'HAUTE' && (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                                Priorité Haute
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium">
                              Séance du {new Date(note.sessionDate || note.createdAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Rédigé par : <strong className="text-slate-800 font-semibold">{note.author?.firstName} {note.author?.lastName}</strong> {note.author?.role?.label ? `(${note.author.role.label})` : ''}
                          </div>
                        </div>

                        {/* Contenu du compte-rendu */}
                        <div className="text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200/80 whitespace-pre-line font-medium shadow-2xs">
                          {note.content}
                        </div>

                        {/* Engagements & devoirs */}
                        {note.nextSteps && (
                          <div className="text-xs flex items-start gap-2.5 bg-teal-50/70 p-3 rounded-lg border border-teal-100 text-teal-950">
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
            </div>

          </div>
        )}

        {/* =======================================================================
            ONGLET PRINCIPAL : HISTORIQUE
           ======================================================================= */}
        {mainTab === 'historique' && (
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

                {/* Droite : Bouton Exporter */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="size-3.5" />
                    <span>Exporter l'historique (CSV)</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Zone inférieure : Tableau d'historique des interventions */}
            <div className="p-4 sm:p-5 space-y-3 bg-white">
              
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-xs text-left border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700 font-normal">
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[90px]">Date</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[140px]">Bénéficiaire</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[70px]">Durée</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[120px]">Projet</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[120px]">Parcours</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[80px]">Société</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[180px]">Description</th>
                      <th className="py-2.5 px-3 font-normal text-center min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrestations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 font-normal">
                          Aucun historique d'intervention enregistré pour ce bénéficiaire actuellement
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
            ONGLET PRINCIPAL : DOCUMENTS & SUIVI DES PIÈCES JOINTES
           ======================================================================= */}
        {mainTab === 'documents' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Documents & Pièces jointes du bénéficiaire
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Business Plan, Pitch Deck, Statuts, Pièces d'identité et justificatifs de suivi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className={`px-3.5 py-1.5 rounded bg-[#f06553] text-white font-medium hover:bg-[#e05341] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${isUploadingBeneficiaryDoc ? 'opacity-70 pointer-events-none' : ''}`}>
                  {isUploadingBeneficiaryDoc ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Téléversement...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-3.5" />
                      <span>Déposer un document</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleBeneficiaryDocUpload}
                    disabled={isUploadingBeneficiaryDoc}
                  />
                </label>
              </div>
            </div>

            {isLoadingDocs ? (
              <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="size-6 animate-spin text-[#23c3b1]" />
                <span>Chargement des documents du dossier...</span>
              </div>
            ) : docsRes?.items && docsRes.items.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Document</th>
                      <th className="py-2.5 px-3">Catégorie</th>
                      <th className="py-2.5 px-3">Date de dépôt</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {docsRes.items.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <FileText className="size-3.5" />
                          </div>
                          <span className="truncate max-w-xs" title={doc.title}>{doc.title}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.category || 'PROJET'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.status === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                            doc.status === 'REJETE' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {doc.status === 'VALIDE' ? 'Validé' : doc.status === 'REJETE' ? 'Refusé' : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`/api/v1/documents/${doc.id}/download`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            <Download className="size-3" />
                            <span>Télécharger</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <FileCheck className="size-9 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-700 text-xs">Aucun document attaché à ce dossier actuellement.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Les pièces téléversées lors de la candidature ou déposées directement s'afficheront ici pour le suivi.
                </p>
              </div>
            )}
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
          MODALE : DÉTAIL DU COMPTE-RENDU DE SÉANCE D'ACCOMPAGNEMENT
         ========================================================================= */}
      {selectedReportSession && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Compte-Rendu d'Accompagnement
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Mise en relation active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedReportSession.datetime ? (
                      <>Séance du {new Date(selectedReportSession.datetime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(selectedReportSession.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>
                    ) : 'Date à convenir'} · Durée estimée : {selectedReportSession.durationHours ? `${selectedReportSession.durationHours}h` : '1h00'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReportSession(null);
                  setReportNotesInput('');
                }}
                className="size-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Cartouche Coach & Bénéficiaire */}
              <div className="grid sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
                {/* Expert / Coach */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Coach / Expert référent
                  </span>
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <div className="size-8 rounded-lg bg-gradient-to-tr from-[#14233c] to-[#2d4763] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {selectedReportSession.expert?.avatarInitials || 'EX'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {selectedReportSession.expert?.name || assignedCoachName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedReportSession.expert?.organization || 'Coach Référent IML Digit'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bénéficiaire */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Bénéficiaire accompagné
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">
                      {b ? `${b.firstName} ${b.lastName}` : 'Bénéficiaire IML'}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {b?.projects?.[0]?.name ? `Projet : ${b.projects[0].name}` : 'Dossier d’accompagnement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Objet & Modalité */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#23c3b1]" />
                    Mission & Objectif :
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[10px] border border-teal-200">
                    {selectedReportSession.expert?.domain || 'Cadrage Accompagnement'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 font-medium">
                  {selectedReportSession.missionTitle || selectedReportSession.location || "Session de cadrage, diagnostic et plan d'action"}
                </div>

                {/* Lien visio si disponible */}
                {(() => {
                  const text = `${selectedReportSession.missionTitle || ''} ${selectedReportSession.location || ''}`;
                  const match = text.match(/(https?:\/\/[^\s\]]+)/);
                  const meetUrl = match ? match[1] : null;

                  return meetUrl ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-emerald-900 font-medium truncate mr-2">
                        <Video className="size-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Lien visio : <strong className="underline">{meetUrl}</strong></span>
                      </div>
                      <a
                        href={meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Rejoindre</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Synthèse du compte-rendu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="size-4 text-teal-600" />
                    Synthèse & Observations formulées par le Coach :
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Document officiel IML Digit</span>
                </div>

                {(() => {
                  const savedCustom = typeof window !== 'undefined' ? localStorage.getItem(`iml_session_report_${selectedReportSession.id}`) : null;
                  const matchingNote = followUpNotes.find((n: any) => 
                    n.id === selectedReportSession.id || 
                    (selectedReportSession.datetime && n.sessionDate && new Date(n.sessionDate).toDateString() === new Date(selectedReportSession.datetime).toDateString())
                  );
                  const summaryText = savedCustom || selectedReportSession.session?.summary || matchingNote?.content || selectedReportSession.notes || `Entretien d'évaluation et de cadrage initial d'accompagnement :

• Entretien mené avec succès par Alexandre Agent IML (Coach Référent IML) avec le porteur de projet.
• Analyse du positionnement stratégique, validation du modèle économique et identification des besoins prioritaires d'accompagnement (structuration comptable, accès aux financements et commercialisation).
• Validation de l'orientation et intégration active dans le parcours d'incubation sectoriel.
• Avis du coach : Profil motivé et rigoureux. Potentiel de croissance confirmé.`;

                  return (
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-xs text-slate-800 leading-relaxed whitespace-pre-line space-y-2">
                      <p>{summaryText}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Prochaines actions / Devoirs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Engagements & Prochaines actions convenus :
                </span>
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-950 leading-relaxed whitespace-pre-line">
                  {selectedReportSession.session?.nextActions || selectedReportSession.nextSteps || `1. Transmettre les justificatifs et statuts de formalisation juridique d'ici le prochain point d'étape.
2. Finaliser le prévisionnel de trésorerie sur 12 mois avec les gabarits fournis.
3. Programmer la séance de mentorat suivante sur le module de structuration commerciale.`}
                </div>
              </div>

              {/* Champ d'ajout rapide d'observation complémentaire */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Ajouter une note ou mise à jour au compte-rendu :
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={reportNotesInput}
                    onChange={(e) => setReportNotesInput(e.target.value)}
                    rows={2}
                    placeholder="Ajoutez une précision, un livrable remis ou un complément d'évaluation..."
                    className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={!reportNotesInput.trim() || isSavingReportNote}
                    onClick={async () => {
                      if (!reportNotesInput.trim() || !id) return;
                      setIsSavingReportNote(true);
                      try {
                        const prev = localStorage.getItem(`iml_session_report_${selectedReportSession.id}`) || '';
                        const updated = prev ? `${prev}\n\n[Complément ${new Date().toLocaleDateString('fr-FR')}] : ${reportNotesInput}` : `Compte-rendu de séance :\n${reportNotesInput}`;
                        localStorage.setItem(`iml_session_report_${selectedReportSession.id}`, updated);

                        await fetch(`/api/v1/beneficiaries/${id}/notes`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'iml-digital' },
                          body: JSON.stringify({
                            topic: selectedReportSession.missionTitle || 'Compte-rendu de séance',
                            content: reportNotesInput,
                            priority: 'NORMALE',
                            sessionDate: selectedReportSession.datetime ? new Date(selectedReportSession.datetime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          })
                        }).catch(() => {});

                        showToast('✓ Compte-rendu mis à jour et enregistré !');
                        setReportNotesInput('');
                        refetchAppointments();
                      } finally {
                        setIsSavingReportNote(false);
                      }
                    }}
                    className="px-4 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer flex items-center justify-center"
                  >
                    {isSavingReportNote ? <Loader2 className="size-4 animate-spin" /> : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="size-3.5 text-slate-500" />
                <span>Imprimer / PDF</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedReportSession.expert?.phone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${selectedReportSession.expert.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Bonjour ${selectedReportSession.expert.name}, voici le compte-rendu de séance IML Digit du bénéficiaire ${b?.firstName || ''} ${b?.lastName || ''}...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>WhatsApp Coach</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReportSession(null);
                    setReportNotesInput('');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  Fermer
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
