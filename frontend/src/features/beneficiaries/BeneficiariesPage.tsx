import { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Download, 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  UserCheck, 
  Building2, 
  MessageSquare, 
  BarChart2, 
  Archive, 
  Trash2, 
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from './CreateBeneficiaryModal';
import BatchActionModals, { type BatchActionType } from './BatchActionModals';

interface BeneficiaryItem {
  id: string;
  fileSeq: number;
  fileNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  status: string;
  type: string;
  priority: string;
  language?: string;
  pathway?: any;
  hoursSpent?: number;
  hoursTotal?: number;
  currentStep?: number;
  totalSteps?: number;
  progressPercent?: number;
  lastActivityAt: string;
  projects?: { id: string; name: string; stage?: string; legalStatus?: string; companySize?: string; sector?: { id: string; name: string } }[];
  companyName?: string;
  assignments?: { id: string; user?: { id: string; firstName: string; lastName: string; email?: string } }[];
  assignedAgent?: { id: string; firstName: string; lastName: string };
  createdAt?: string;
}

const DEFAULT_KNOWN_BENEFICIARIES: BeneficiaryItem[] = [
  {
    id: 'aac47994-4788-4561-9697-d5a1d9eec49c',
    fileSeq: 3,
    fileNumber: 'IML-2026-0003',
    firstName: 'Marine',
    lastName: 'LOUPE',
    email: 'marine.loupe@test.com',
    status: 'EN_ATTENTE',
    type: 'STARTUP',
    priority: 'NORMALE',
    language: 'Français',
    lastActivityAt: 'Aujourd\'hui',
    projects: [{ id: 'p1', name: 'BioTech Solutions', stage: 'PROTOTYPE', legalStatus: 'SAS' }],
    companyName: 'BioTech Solutions'
  },
  {
    id: 'b14946a3-7339-4eb9-90b2-1279e9bd9143',
    fileSeq: 4,
    fileNumber: 'IML-2026-0004',
    firstName: 'Sophiatech',
    lastName: 'GABON',
    email: 'contact@sophiatech-gabon.ga',
    status: 'ACTIF',
    type: 'ENTREPRISE',
    priority: 'HAUTE',
    language: 'Français',
    lastActivityAt: 'Récemment',
    projects: [{ id: 'p2', name: 'Sophiatech Gabon SARL', stage: 'CROISSANCE', legalStatus: 'SARL', companySize: 'PETITE' }],
    companyName: 'Sophiatech Gabon SARL'
  },
  {
    id: 'c50f48c6-1d36-4e23-b75f-e68ef3cb250b',
    fileSeq: 5,
    fileNumber: 'IML-2026-0005',
    firstName: 'Coopérative',
    lastName: 'AGRI-GABON',
    email: 'direction@agrigabon-coop.ga',
    status: 'ACTIF',
    type: 'ENTREPRISE',
    priority: 'NORMALE',
    language: 'Français',
    lastActivityAt: 'Récemment',
    projects: [{ id: 'p3', name: 'Fédération Agricole & Développement', stage: 'CROISSANCE', legalStatus: 'COOPERATIVE', companySize: 'MOYENNE' }],
    companyName: 'Fédération Agricole & Développement'
  },
  {
    id: 'a2303e05-8a37-4ffc-b789-8cc5b89679e5',
    fileSeq: 6,
    fileNumber: 'IML-2026-0006',
    firstName: 'Logistique',
    lastName: 'EQUATORIALE',
    email: 'contact@logistique-equatoriale.ga',
    status: 'ACTIF',
    type: 'ENTREPRISE',
    priority: 'HAUTE',
    language: 'Français',
    lastActivityAt: 'Récemment',
    projects: [{ id: 'p4', name: 'Logistique Équatoriale SA', stage: 'MATURITE', legalStatus: 'SA', companySize: 'GRANDE' }],
    companyName: 'Logistique Équatoriale SA'
  },
  {
    id: '47f4e1d6-b425-4fb1-9a8c-867220520860',
    fileSeq: 2,
    fileNumber: 'IML-2026-0002',
    firstName: 'Sophie',
    lastName: 'MARTIN',
    email: 'sophie.martin@test.com',
    status: 'EN_ATTENTE',
    type: 'PORTEUR_IDEE',
    priority: 'NORMALE',
    language: 'Français',
    lastActivityAt: 'Récemment',
    projects: [{ id: 'p0', name: 'Projet Sophie Solutions', stage: 'IDEE' }],
    companyName: 'Projet Sophie Solutions'
  }
];

interface BeneficiariesResponse {
  items: BeneficiaryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function BeneficiariesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';
  const isDirection = user?.role === 'DIRECTION';

  // Le coach n'a pas accès à la table administrative brute des bénéficiaires : redirection vers son Cahier de Bord & Suivi
  if (isCoach) {
    return <Navigate to="/tableau-de-bord?vue=coach" replace />;
  }

  // Modale de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts (actifs)');
  const [orgFilter, setOrgFilter] = useState('Toutes les organisations');
  const [langFilter, setLangFilter] = useState('Toutes les langues');
  const [groupFilter, setGroupFilter] = useState('Tous les groupes');
  const [tagFilter, setTagFilter] = useState('Etiquettes');

  // Colonnes visibles (Ciblage strict du dossier bénéficiaire)
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    matricule: true,
    nom: true,
    structure: true,
    secteur: true,
    statut: true,
  });

  // Sélection de lignes (Batch actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<BatchActionType>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Requête API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['beneficiaries-list', page, pageSize, searchTerm],
    queryFn: () => api<BeneficiariesResponse>(`/beneficiaries?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(searchTerm)}`),
  });

  const apiItems = data?.items || [];
  const beneficiaries = useMemo(() => {
    try {
      // Pour le coach : STRICTEMENT et UNIQUEMENT les bénéficiaires autorisés par le backend (qui lui sont confiés/programmés par l'agent)
      if (isCoach) {
        return (apiItems || []).map(item => ({
          ...item,
          companyName: item.projects?.[0]?.name || item.companyName,
          type: item.type || 'PORTEUR_IDEE',
        }));
      }

      if (!apiItems || !Array.isArray(apiItems) || apiItems.length === 0) {
        return DEFAULT_KNOWN_BENEFICIARIES;
      }
      const list: BeneficiaryItem[] = [];
      apiItems.forEach(item => {
        if (!item) return;
        const itemEmail = typeof item.email === 'string' ? item.email.toLowerCase().trim() : '';
        const match = DEFAULT_KNOWN_BENEFICIARIES.find(d => {
          if (!d) return false;
          if (d.id && item.id && d.id === item.id) return true;
          const dEmail = typeof d.email === 'string' ? d.email.toLowerCase().trim() : '';
          return Boolean(dEmail && itemEmail && dEmail === itemEmail);
        });
        const pName = item.projects?.[0]?.name || match?.companyName || item.companyName;
        list.push({
          ...item,
          companyName: pName,
          type: item.type || match?.type || 'PORTEUR_IDEE',
        });
      });

      DEFAULT_KNOWN_BENEFICIARIES.forEach(d => {
        if (!d) return;
        const dEmail = typeof d.email === 'string' ? d.email.toLowerCase().trim() : '';
        const alreadyExists = list.some(x => {
          if (!x) return false;
          if (x.id && d.id && x.id === d.id) return true;
          const xEmail = typeof x.email === 'string' ? x.email.toLowerCase().trim() : '';
          return Boolean(xEmail && dEmail && xEmail === dEmail);
        });
        if (!alreadyExists) {
          list.push(d);
        }
      });
      return list;
    } catch (err) {
      console.error('Erreur lors du calcul de la liste des bénéficiaires:', err);
      return isCoach ? [] : DEFAULT_KNOWN_BENEFICIARIES;
    }
  }, [apiItems, isCoach]);
  const total = isCoach ? (data?.total ?? beneficiaries.length) : Math.max(data?.total || 0, beneficiaries.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Filtrage des bénéficiaires
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      if (statusFilter !== 'Tous les statuts (actifs)') {
        if (statusFilter === 'ACTIF' && b.status !== 'ACTIF' && b.status !== 'EN_COURS') return false;
        if (statusFilter === 'EN_ATTENTE' && b.status !== 'EN_ATTENTE') return false;
        if (statusFilter === 'TERMINE' && b.status !== 'TERMINE') return false;
      }
      return true;
    });
  }, [beneficiaries, statusFilter]);

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBeneficiaries.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredBeneficiaries.length > 0 && selectedIds.length === filteredBeneficiaries.length;

  // Export CSV direct du dossier des bénéficiaires
  const handleExportCsv = () => {
    const listToExport = selectedIds.length > 0 
      ? filteredBeneficiaries.filter(b => selectedIds.includes(b.id))
      : filteredBeneficiaries;

    if (listToExport.length === 0) {
      setToastMsg('Aucune donnée à exporter.');
      return;
    }

    const headers = [
      'N° Dossier',
      'Nom',
      'Prénom',
      'Structure / Type',
      'Entreprise / Projet',
      'Secteur d\'activité',
      'Email',
      'Téléphone',
      'Ville',
      'Coach Référent',
      'Statut du dossier',
      'Dernière Activité'
    ];

    const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = listToExport.map(b => {
      const fileNum = b.fileNumber || `IML-2026-${String(b.fileSeq || 1).padStart(4, '0')}`;
      const typeLabel = b.type === 'ENTREPRISE' ? 'PME / Entreprise' : b.type === 'STARTUP' ? 'Start-up' : 'Porteur de projet';
      const pName = b.projects?.[0]?.name || b.companyName || '';
      const sector = b.projects?.[0]?.sector?.name || 'Général';
      const coach = b.assignments?.[0]?.user ? `${b.assignments[0].user.firstName} ${b.assignments[0].user.lastName}` : 'À assigner';
      const statusLabel = (b.status === 'ACTIF' || b.status === 'EN_COURS') ? 'Dossier Actif / En incubation' : b.status === 'TERMINE' ? 'Clôturé' : 'En incubation';

      return [
        escape(fileNum),
        escape(b.lastName),
        escape(b.firstName),
        escape(typeLabel),
        escape(pName),
        escape(sector),
        escape(b.email),
        escape(b.phone || ''),
        escape(b.city || 'Libreville'),
        escape(coach),
        escape(statusLabel),
        escape(b.lastActivityAt ? new Date(b.lastActivityAt).toLocaleDateString('fr-FR') : '')
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `export_beneficiaires_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMsg(`Export CSV réussi : ${listToExport.length} dossier(s) exporté(s).`);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('Tous les statuts (actifs)');
    setOrgFilter('Toutes les organisations');
    setLangFilter('Toutes les langues');
    setGroupFilter('Tous les groupes');
    setTagFilter('Etiquettes');
  };

  // Libellé de statut visuel pour le dossier bénéficiaire
  const getStatusBadge = (status: string) => {
    const norm = (status || '').toUpperCase();
    if (norm === 'ACTIF' || norm === 'EN_COURS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Dossier actif
        </span>
      );
    }
    if (norm === 'TERMINE' || norm === 'CLOTURE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="size-1.5 rounded-full bg-slate-400" />
          Accompagnement clôturé
        </span>
      );
    }
    if (norm === 'EN_PAUSE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" />
          En pause
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
        <span className="size-1.5 rounded-full bg-[#23c3b1]" />
        En incubation
      </span>
    );
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      
      {/* =========================================================================
          1. TITRE PRINCIPAL
         ========================================================================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-[23px] font-normal text-slate-800 tracking-tight">
            {isCoach ? 'Mes Bénéficiaires & Dossiers' : isDirection ? 'Portefeuille Entreprises & Bénéficiaires' : 'Bénéficiaires'}
          </h1>
          {isCoach && (
            <p className="text-xs text-slate-500 mt-0.5">
              Entrepreneurs qui vous sont confiés ou programmés en séance par l'agent de planification.
            </p>
          )}
          {isDirection && (
            <p className="text-xs text-slate-500 mt-0.5">
              Consultation exhaustive du portefeuille pour le pilotage stratégique et l'analyse des indicateurs clés.
            </p>
          )}
        </div>

        {isDirection && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[#137469] text-xs font-bold">
            <ShieldCheck className="size-4 text-[#23c3b1]" />
            <span>Mode Consultation Direction • Lecture seule</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. BARRE SUPÉRIEURE DE CONTRÔLE (Colonnes, Recherche, Actions corail, Pagination)
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Gauche : Colonnes (Masqué pour le Coach) + Recherche (Tous) */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          
          {/* Menu déroulant Colonnes - Masqué pour le Coach */}
          {!isCoach && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Colonnes</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {isColumnsDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-2 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                    Colonnes du dossier
                  </div>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.matricule}
                      onChange={(e) => setVisibleColumns((c) => ({ ...c, matricule: e.target.checked }))}
                      className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                    />
                    <span>Matricule / N° Dossier</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.nom}
                      onChange={(e) => setVisibleColumns((c) => ({ ...c, nom: e.target.checked }))}
                      className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                    />
                    <span>Bénéficiaire</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.structure}
                      onChange={(e) => setVisibleColumns((c) => ({ ...c, structure: e.target.checked }))}
                      className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                    />
                    <span>Structure</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.secteur}
                      onChange={(e) => setVisibleColumns((c) => ({ ...c, secteur: e.target.checked }))}
                      className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                    />
                    <span>Secteur d'activité</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.statut}
                      onChange={(e) => setVisibleColumns((c) => ({ ...c, statut: e.target.checked }))}
                      className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                    />
                    <span>Statut du dossier</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Champ de recherche (Conservé pour tous) */}
          <div className="relative flex-1 max-w-xs">
            <Search className="size-3.5 text-[#23c3b1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={isCoach ? "Rechercher parmi vos bénéficiaires..." : "Rechercher"}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
            />
          </div>

        </div>

        {/* Droite : Boutons corail (Exporter & Créer masqués pour le Coach) + Pagination */}
        <div className="flex items-center gap-2.5">
          
          {/* Bouton Exporter la liste (Masqué pour le Coach) */}
          {!isCoach && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Exporter la liste</span>
            </button>
          )}

          {/* Bouton Créer un bénéficiaire (Masqué pour le Coach et pour la Direction) */}
          {!isCoach && !isDirection && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Créer un bénéficiaire</span>
            </button>
          )}

          {/* Pagination compacte (ex: 1 / 1 < >) */}
          <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-600">
            <span>{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          3. BARRE BLANCHE DE FILTRES
         ========================================================================= */}
      <div className="bg-white rounded-md border border-slate-200/90 p-2.5 shadow-2xs flex flex-wrap items-center gap-3">
        
        {/* Tous les statuts (actifs) */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs text-slate-700 hover:text-slate-900 font-normal focus:outline-none cursor-pointer"
          >
            <option value="Tous les statuts (actifs)">Tous les statuts (actifs)</option>
            <option value="ACTIF">Dossiers actifs (En incubation)</option>
            <option value="EN_ATTENTE">Nouveaux dossiers</option>
            <option value="TERMINE">Accompagnements clôturés</option>
          </select>
          <ChevronDown className="size-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filtres réservés à l'administration & agents */}
        {!isCoach && (
          <>
            {/* Toutes les organisations */}
            <div className="relative">
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs text-slate-700 hover:text-slate-900 font-normal focus:outline-none cursor-pointer"
              >
                <option value="Toutes les organisations">Toutes les organisations</option>
                <option value="IML Digital">IML Digital</option>
              </select>
              <ChevronDown className="size-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Toutes les langues */}
            <div className="relative">
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs text-slate-700 hover:text-slate-900 font-normal focus:outline-none cursor-pointer"
              >
                <option value="Toutes les langues">Toutes les langues</option>
                <option value="Français">Français</option>
                <option value="Anglais">Anglais</option>
              </select>
              <ChevronDown className="size-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Tous les groupes */}
            <div className="relative">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs text-slate-700 hover:text-slate-900 font-normal focus:outline-none cursor-pointer"
              >
                <option value="Tous les groupes">Tous les groupes</option>
                <option value="Promotion 2026">Promotion 2026</option>
              </select>
              <ChevronDown className="size-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Etiquettes */}
            <div className="relative">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="appearance-none bg-transparent pr-6 pl-1 py-1 text-xs text-slate-700 hover:text-slate-900 font-normal focus:outline-none cursor-pointer"
              >
                <option value="Etiquettes">Etiquettes</option>
                <option value="Prioritaire">Prioritaire</option>
              </select>
              <ChevronDown className="size-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </>
        )}

        {/* Bouton de réinitialisation croix grise */}
        <button
          type="button"
          onClick={handleResetFilters}
          className="size-5 rounded-sm bg-slate-300 hover:bg-slate-400 text-slate-600 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer ml-auto"
          title="Réinitialiser les filtres"
        >
          <X className="size-3" />
        </button>

      </div>

      {/* =========================================================================
          4. BARRE D'ACTIONS GROUPÉES (VISIBLE UNIQUEMENT POUR ADMIN/AGENT LORSQU'AU MOINS UNE LIGNE EST COCHÉE)
         ========================================================================= */}
      {!isCoach && selectedIds.length > 0 && (
        <div className="bg-white rounded-md border border-slate-200/90 p-2.5 shadow-2xs flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          
          {/* Label de sélection à gauche sur 3 lignes */}
          <div className="text-[11px] font-semibold text-slate-800 leading-tight pr-3 border-r border-slate-200">
            <div>Vous avez</div>
            <div>sélectionné {selectedIds.length}</div>
            <div>ligne(s)</div>
          </div>

          {/* Les 8 boutons d'actions groupées en corail */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Assigner un ou plusieurs */}
            <button
              type="button"
              onClick={() => setBatchAction('assign')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <UserCheck className="size-3.5" />
              <span>un ou plusieurs</span>
            </button>

            {/* 3. Lier à une organisation */}
            <button
              type="button"
              onClick={() => setBatchAction('org')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <Building2 className="size-3.5" />
              <span>Lier à une organisation</span>
            </button>

            {/* 4. Envoi d'un message */}
            <button
              type="button"
              onClick={() => setBatchAction('message')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <MessageSquare className="size-3.5" />
              <span>Envoi d'un message</span>
            </button>

            {/* 5. Exporter */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <Download className="size-3.5" />
              <span>Exporter</span>
            </button>

            {/* 6. Reporting */}
            <button
              type="button"
              onClick={() => setBatchAction('reporting')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <BarChart2 className="size-3.5" />
              <span>Reporting</span>
            </button>

            {/* 7. Archiver */}
            <button
              type="button"
              onClick={() => setBatchAction('archive')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <Archive className="size-3.5" />
              <span>Archiver</span>
            </button>

            {/* 8. Supprimer */}
            <button
              type="button"
              onClick={() => setBatchAction('delete')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <Trash2 className="size-3.5" />
              <span>Supprimer</span>
            </button>

          </div>

        </div>
      )}

      {/* =========================================================================
          5. TABLE DES BÉNÉFICIAIRES (ADAPTATIVE MOBILE & DESKTOP)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Version Mobile : Cartes Dédiées */}
        <div className="md:hidden divide-y divide-slate-100 p-2 sm:p-3">
          {isLoading && (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="size-5 animate-spin inline mr-2 text-[#23c3b1]" />
              <span className="text-xs">Chargement des dossiers bénéficiaires...</span>
            </div>
          )}
          {!isLoading && filteredBeneficiaries.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucun dossier bénéficiaire trouvé.
            </div>
          )}
          {!isLoading && filteredBeneficiaries.map((b) => {
            const projectName = b.projects?.[0]?.name || b.companyName || 'Projet sans nom';
            const fileNum = b.fileNumber || `IML-2026-${String(b.fileSeq || 1).padStart(4, '0')}`;
            const sectorName = b.projects?.[0]?.sector?.name || 'Général';
            const isStartup = b.type === 'STARTUP';
            const lName = (b.lastName || '').toUpperCase();
            const isOrg = b.projects?.[0]?.legalStatus === 'COOPERATIVE' || (b.type === 'ENTREPRISE' && lName.includes('AGRI'));
            const isPme = b.projects?.[0]?.companySize === 'PETITE' || b.projects?.[0]?.legalStatus === 'SARL' || lName.includes('GABON');
            const typeLabel = isStartup ? 'Start-up' : isOrg ? 'Organisation' : isPme ? 'PME' : 'Entreprise';
            const badgeClass = isStartup 
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : isOrg
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isPme
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200';

            return (
              <div
                key={b.id}
                onClick={() => navigate(`/beneficiaires/${b.id}`)}
                className="p-3.5 hover:bg-slate-50 rounded-xl space-y-2.5 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {fileNum}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {typeLabel}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{b.firstName} {b.lastName}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <span className="font-medium text-slate-700">{projectName}</span>
                    <span>• {sectorName}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10.5px] text-slate-400">
                  <span>Phase : {b.status || 'Actif'}</span>
                  <span className="text-[#23c3b1] font-bold">Consulter →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Version Desktop : Tableau classique */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
              
              {/* Checkbox Tout sélectionner (Masqué pour le Coach et pour la Direction) */}
              {!isCoach && !isDirection && (
                <th className="py-2.5 px-3 w-10 text-center border-r border-slate-100">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1] cursor-pointer"
                  />
                </th>
              )}

              {visibleColumns.matricule && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-100 min-w-[130px]">
                  Matricule
                </th>
              )}

              {visibleColumns.nom && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-100 min-w-[190px]">
                  Bénéficiaire
                </th>
              )}

              {visibleColumns.structure && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-100 min-w-[130px]">
                  Structure
                </th>
              )}

              {visibleColumns.secteur && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-100 min-w-[140px]">
                  Secteur d'activité
                </th>
              )}

              {visibleColumns.statut && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 min-w-[130px]">
                  Statut du dossier
                </th>
              )}

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Loader2 className="size-4 animate-spin inline mr-2 text-[#23c3b1]" />
                  Chargement des dossiers bénéficiaires...
                </td>
              </tr>
            )}

            {!isLoading && filteredBeneficiaries.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="max-w-md mx-auto space-y-1.5">
                    <p className="text-sm font-medium text-slate-600">
                      {isCoach 
                        ? "Aucun bénéficiaire ne vous a encore été programmé." 
                        : "Aucun dossier bénéficiaire trouvé"}
                    </p>
                    {isCoach && (
                      <p className="text-xs text-slate-400">
                        Dès que l'agent de planification vous programmera un rendez-vous ou vous assignera un entrepreneur, son dossier apparaîtra ici.
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {filteredBeneficiaries.map((b) => {
              const isSelected = selectedIds.includes(b.id);
              const projectName = b.projects?.[0]?.name || b.companyName;
              const isStartup = b.type === 'STARTUP';
              const lName = (b.lastName || '').toUpperCase();
              const isOrg = b.projects?.[0]?.legalStatus === 'COOPERATIVE' || (b.type === 'ENTREPRISE' && lName.includes('AGRI'));
              const isPme = b.projects?.[0]?.companySize === 'PETITE' || b.projects?.[0]?.legalStatus === 'SARL' || lName.includes('GABON');
              const typeLabel = isStartup ? 'Start-up' : isOrg ? 'Organisation' : isPme ? 'PME' : 'Entreprise';
              const badgeClass = isStartup 
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : isOrg
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isPme
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200';

              const fileNum = b.fileNumber || `IML-2026-${String(b.fileSeq || 1).padStart(4, '0')}`;
              const sectorName = b.projects?.[0]?.sector?.name || 'Général';

              return (
                <tr 
                  key={b.id}
                  className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${isSelected ? 'bg-teal-50/20' : ''}`}
                  onClick={() => navigate(`/beneficiaires/${b.id}`)}
                >
                  
                  {/* Case à cocher de ligne (Masqué pour le Coach et pour la Direction) */}
                  {!isCoach && !isDirection && (
                    <td className="py-2.5 px-3 text-center border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(b.id)}
                        className="rounded text-[#23c3b1] focus:ring-[#23c3b1] cursor-pointer"
                      />
                    </td>
                  )}

                  {/* 1. Matricule (sa propre zone / case !) */}
                  {visibleColumns.matricule && (
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block shadow-2xs">
                        {fileNum}
                      </span>
                    </td>
                  )}

                  {/* 2. Bénéficiaire */}
                  {visibleColumns.nom && (
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <div className="flex items-start justify-between group">
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-[#23c3b1] transition-colors text-xs sm:text-[12.5px] block">
                            {b.firstName} {b.lastName}
                          </span>
                          {projectName && (
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {projectName}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="size-3.5 text-slate-400 group-hover:text-[#23c3b1] transition-transform group-hover:translate-x-0.5 ml-2 shrink-0 self-center" />
                      </div>
                    </td>
                  )}

                  {/* 2. Structure (sa propre case !) */}
                  {visibleColumns.structure && (
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${badgeClass}`}>
                        {typeLabel}
                      </span>
                    </td>
                  )}

                  {/* 3. Secteur d'activité */}
                  {visibleColumns.secteur && (
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <Building2 className="size-2.5 text-slate-500" />
                        <span>{sectorName}</span>
                      </span>
                    </td>
                  )}

                  {/* 3. Statut du dossier */}
                  {visibleColumns.statut && (
                    <td className="py-2.5 px-3">
                      {getStatusBadge(b.status)}
                    </td>
                  )}

                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* =========================================================================
          6. BAS DE PAGE / PAGINATION (Afficher 20 ⌄ | 1 / 1 < >)
         ========================================================================= */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
        
        {/* Afficher 20 ⌄ */}
        <div className="flex items-center gap-1.5">
          <span>Afficher</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded px-2 py-0.5 pr-5 text-xs text-slate-700 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <ChevronDown className="size-3 text-[#f06553] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Pagination compacte 1 / 1 < > */}
        <div className="flex items-center gap-2">
          <span>{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

      </div>

      {/* =========================================================================
          7. MODALE DE CRÉATION DE BÉNÉFICIAIRE (Réservé aux agents / direction)
         ========================================================================= */}
      {!isCoach && (
        <CreateBeneficiaryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => void refetch()}
        />
      )}

      {/* =========================================================================
          8. MODALES D'ACTIONS GROUPÉES (Réservé aux agents / direction)
         ========================================================================= */}
      {!isCoach && (
        <BatchActionModals
          action={batchAction}
          onClose={() => setBatchAction(null)}
          selectedIds={selectedIds}
          selectedBeneficiaries={beneficiaries.filter((b) => selectedIds.includes(b.id))}
          onSuccess={(msg) => {
            setToastMsg(msg);
            setSelectedIds([]);
            void refetch();
          }}
        />
      )}

      {/* =========================================================================
          9. TOAST DE CONFIRMATION DES ACTIONS (FEEDBACK VISUEL ÉLÉGANT)
         ========================================================================= */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[#14233c] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="size-6 rounded-full bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4" />
          </div>
          <span className="text-xs font-semibold">{toastMsg}</span>
          <button 
            type="button"
            onClick={() => setToastMsg(null)} 
            className="text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
