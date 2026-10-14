import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Users, 
  Building2, 
  MessageSquare, 
  BarChart2, 
  Archive, 
  Trash2, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';
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
  pathway?: string;
  hoursSpent?: number;
  hoursTotal?: number;
  currentStep?: number;
  totalSteps?: number;
  progressPercent?: number;
  lastActivityAt: string;
}

interface BeneficiariesResponse {
  items: BeneficiaryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function BeneficiariesPage() {
  // Modale de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts (actifs)');
  const [orgFilter, setOrgFilter] = useState('Toutes les organisations');
  const [langFilter, setLangFilter] = useState('Toutes les langues');
  const [groupFilter, setGroupFilter] = useState('Tous les groupes');
  const [tagFilter, setTagFilter] = useState('Etiquettes');

  // Colonnes visibles
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    nom: true,
    langue: true,
    statut: true,
    heures: true,
    parcours: true,
    etape: true,
    progression: true,
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

  const beneficiaries = data?.items || [];
  const total = data?.total || beneficiaries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(beneficiaries.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = beneficiaries.length > 0 && selectedIds.length === beneficiaries.length;

  // Export CSV direct
  const handleExportCsv = () => {
    const listToExport = selectedIds.length > 0 
      ? beneficiaries.filter(b => selectedIds.includes(b.id))
      : beneficiaries;

    if (listToExport.length === 0) {
      setToastMsg('Aucune donnée à exporter.');
      return;
    }

    const headers = [
      'N° Dossier',
      'Nom',
      'Prénom',
      'Structure / Type',
      'Email',
      'Téléphone',
      'Ville',
      'Statut',
      'Langue',
      'Parcours',
      'Heures Réalisées',
      'Heures Totales',
      'Progression (%)',
      'Dernière Activité'
    ];

    const escape = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = listToExport.map(b => {
      const typeLabel = b.type === 'ENTREPRISE' ? 'PME / Entreprise' : b.type === 'STARTUP' ? 'Start-up' : 'Porteur de projet';
      const fileNum = b.fileNumber || `DOS-${b.fileSeq}`;
      return [
        escape(fileNum),
        escape(b.lastName),
        escape(b.firstName),
        escape(typeLabel),
        escape(b.email),
        escape(b.phone || ''),
        escape(b.city || 'Libreville (B2)'),
        escape(b.status),
        escape(b.language || 'Français'),
        escape(b.pathway || 'Création d’entreprise'),
        escape(b.hoursSpent || 0),
        escape(b.hoursTotal || 20),
        escape(b.progressPercent || 0),
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

  // Libellé de statut visuel
  const getStatusBadge = (status: string) => {
    if (status === 'EN_ATTENTE' || status === 'ACTIF' || !status) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-[#fff1ec] text-[#e8664d] border border-[#fed7cc]">
          Parcours à créer
        </span>
      );
    }
    if (status === 'EN_COURS') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
          En cours
        </span>
      );
    }
    if (status === 'TERMINE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-slate-100 text-slate-700 border border-slate-200">
          Terminé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-orange-50 text-orange-600 border border-orange-200">
        Parcours à créer
      </span>
    );
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      
      {/* =========================================================================
          1. TITRE PRINCIPAL
         ========================================================================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-[23px] font-normal text-slate-800 tracking-tight">
          Bénéficiaires
        </h1>
      </div>

      {/* =========================================================================
          2. BARRE SUPÉRIEURE DE CONTRÔLE (Colonnes, Recherche, Actions corail, Pagination)
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Gauche : Colonnes + Recherche */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          
          {/* Menu déroulant Colonnes */}
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
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-xl z-30 p-2 space-y-1 text-xs">
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.nom}
                    onChange={(e) => setVisibleColumns((c) => ({ ...c, nom: e.target.checked }))}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Nom</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.langue}
                    onChange={(e) => setVisibleColumns((c) => ({ ...c, langue: e.target.checked }))}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Langue</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.statut}
                    onChange={(e) => setVisibleColumns((c) => ({ ...c, statut: e.target.checked }))}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Statut</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.heures}
                    onChange={(e) => setVisibleColumns((c) => ({ ...c, heures: e.target.checked }))}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Compteur d'heures</span>
                </label>
                <label className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.parcours}
                    onChange={(e) => setVisibleColumns((c) => ({ ...c, parcours: e.target.checked }))}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Parcours</span>
                </label>
              </div>
            )}
          </div>

          {/* Champ de recherche */}
          <div className="relative flex-1 max-w-xs">
            <Search className="size-3.5 text-[#23c3b1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher"
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
            />
          </div>

        </div>

        {/* Droite : Boutons corail + Pagination */}
        <div className="flex items-center gap-2.5">
          
          {/* Bouton Exporter la liste */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Exporter la liste</span>
          </button>

          {/* Bouton Créer un bénéficiaire */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Créer un bénéficiaire</span>
          </button>

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
            <option value="EN_ATTENTE">Parcours à créer</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
          </select>
          <ChevronDown className="size-3 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

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
          4. BARRE D'ACTIONS GROUPÉES (VISIBLE LORSQU'AU MOINS UNE LIGNE EST COCHÉE)
         ========================================================================= */}
      {selectedIds.length > 0 && (
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

            {/* 2. Ajouter à un groupe */}
            <button
              type="button"
              onClick={() => setBatchAction('group')}
              className="px-2.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-[11px] font-normal flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer leading-tight active:scale-95"
            >
              <Users className="size-3.5" />
              <span>Ajouter à un groupe</span>
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
          5. TABLE DES BÉNÉFICIAIRES
         ========================================================================= */}
      <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 text-xs font-normal text-slate-600 bg-white">
              
              {/* Checkbox Tout sélectionner */}
              <th className="py-2.5 px-3 w-10 text-center border-r border-slate-100">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1] cursor-pointer"
                />
              </th>

              {visibleColumns.nom && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Nom
                </th>
              )}

              {visibleColumns.langue && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Langue
                </th>
              )}

              {visibleColumns.statut && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Statut
                </th>
              )}

              {visibleColumns.heures && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Compteur d'heures
                </th>
              )}

              {visibleColumns.parcours && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Parcours
                </th>
              )}

              {visibleColumns.etape && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Etape
                </th>
              )}

              {visibleColumns.progression && (
                <th className="py-2.5 px-3 font-normal text-slate-700">
                  Progression du parcours
                </th>
              )}

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  <Loader2 className="size-4 animate-spin inline mr-2 text-[#23c3b1]" />
                  Chargement des bénéficiaires...
                </td>
              </tr>
            )}

            {!isLoading && beneficiaries.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Aucun bénéficiaire trouvé
                </td>
              </tr>
            )}

            {beneficiaries.map((b) => {
              const isSelected = selectedIds.includes(b.id);
              return (
                <tr 
                  key={b.id}
                  className={`transition-colors hover:bg-slate-50/70 ${isSelected ? 'bg-teal-50/20' : ''}`}
                >
                  
                  {/* Case à cocher de ligne */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-100">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(b.id)}
                      className="rounded text-[#23c3b1] focus:ring-[#23c3b1] cursor-pointer"
                    />
                  </td>

                  {/* Nom avec chevron > */}
                  {visibleColumns.nom && (
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <Link
                        to={`/beneficiaires/${b.id}`}
                        className="flex items-center justify-between text-slate-800 hover:text-[#23c3b1] transition-colors group"
                      >
                        <span className="font-normal">{b.firstName} {b.lastName}</span>
                        <ChevronRight className="size-3.5 text-slate-400 group-hover:text-[#23c3b1] transition-transform group-hover:translate-x-0.5 ml-2" />
                      </Link>
                    </td>
                  )}

                  {/* Langue avec drapeau français */}
                  {visibleColumns.langue && (
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-sm">🇫🇷</span>
                        <span>{b.language || 'Français'}</span>
                      </span>
                    </td>
                  )}

                  {/* Statut (badge Parcours à créer) */}
                  {visibleColumns.statut && (
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      {getStatusBadge(b.status)}
                    </td>
                  )}

                  {/* Compteur d'heures */}
                  {visibleColumns.heures && (
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">
                      {b.hoursSpent ? `${b.hoursSpent}h / ${b.hoursTotal || 0}h` : 'N/A'}
                    </td>
                  )}

                  {/* Parcours */}
                  {visibleColumns.parcours && (
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">
                      {b.pathway || 'N/A'}
                    </td>
                  )}

                  {/* Etape */}
                  {visibleColumns.etape && (
                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-600">
                      {b.currentStep !== undefined ? `${b.currentStep}/${b.totalSteps || 0}` : '0/0'}
                    </td>
                  )}

                  {/* Progression du parcours */}
                  {visibleColumns.progression && (
                    <td className="py-2.5 px-3 text-slate-600">
                      {b.progressPercent !== undefined ? `${b.progressPercent}%` : 'N/A'}
                    </td>
                  )}

                </tr>
              );
            })}
          </tbody>
        </table>
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
          7. MODALE DE CRÉATION DE BÉNÉFICIAIRE AU PREMIER PLAN
         ========================================================================= */}
      <CreateBeneficiaryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => void refetch()}
      />

      {/* =========================================================================
          8. MODALES D'ACTIONS GROUPÉES (ASSIGNER, GROUPE, ORG, MESSAGE, REPORTING, ARCHIVER, SUPPRIMER)
         ========================================================================= */}
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
