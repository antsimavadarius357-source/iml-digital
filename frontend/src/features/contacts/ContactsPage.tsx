import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDown, 
  ArrowUp,
  Plus,
  Mail,
  Building,
  Phone,
  Trash2,
  X,
  UserCheck,
  Pencil
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export type ContactCategory = 'Bénéficiaire' | 'Coach' | 'Partenaire' | 'Financeur' | 'Externe';

export interface ContactItem {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  category: ContactCategory;
  roleDescription?: string;
  source: 'database_beneficiary' | 'database_user' | 'partner_preset' | 'custom';
  createdAt: string;
}

// Contacts institutionnels et partenaires piliers du réseau d'accompagnement
const PRESET_PARTNER_CONTACTS: ContactItem[] = [
  {
    id: 'partner-anpi',
    name: 'ANPI Gabon (Investissements)',
    company: 'Agence Nationale Promotion Investissements',
    email: 'contact@anpi-gabon.ga',
    phone: '+24111763450',
    category: 'Partenaire',
    roleDescription: 'Formalisation, agréments d\'investissements & guichet unique',
    source: 'partner_preset',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'partner-dgpme',
    name: 'Direction Générale des PME',
    company: 'Ministère du Commerce et des PME',
    email: 'pme.contact@gouv.ga',
    phone: '+24111721000',
    category: 'Partenaire',
    roleDescription: 'Agrément PME & programmes nationaux d\'incubation',
    source: 'partner_preset',
    createdAt: '2026-01-12T08:00:00.000Z'
  },
  {
    id: 'partner-ccig',
    name: 'Chambre de Commerce (CCIG)',
    company: 'Chambre de Commerce, d\'Agriculture et des Mines',
    email: 'contact@ccig-gabon.org',
    phone: '+24111762063',
    category: 'Partenaire',
    roleDescription: 'Appui consulaire, réseautage B2B & export',
    source: 'partner_preset',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'partner-espace-pme',
    name: 'Espace PME Libreville',
    company: 'Pépinière & Tiers-lieu d\'Accompagnement B2',
    email: 'accueil@espace-pme.ga',
    phone: '+24165301122',
    category: 'Partenaire',
    roleDescription: 'Salles de réunion, ateliers pratiques & coworking',
    source: 'partner_preset',
    createdAt: '2026-01-20T08:00:00.000Z'
  },
  {
    id: 'partner-bgfibank',
    name: 'BGFIBank Pôle Entrepreneuriat',
    company: 'Groupe BGFIBank Gabon',
    email: 'bgfibank.pme@bgfi.com',
    phone: '+24111762323',
    category: 'Financeur',
    roleDescription: 'Lignes de crédit d\'amorçage, affacturage & comptes pros',
    source: 'partner_preset',
    createdAt: '2026-02-01T08:00:00.000Z'
  },
  {
    id: 'partner-bicig',
    name: 'BICIG PME & Start-up',
    company: 'Banque Internationale pour le Commerce',
    email: 'contact@bicig-gabon.com',
    phone: '+24111762613',
    category: 'Financeur',
    roleDescription: 'Prêts d\'investissement, cautionnement & garanties FGIS',
    source: 'partner_preset',
    createdAt: '2026-02-05T08:00:00.000Z'
  }
];

export default function ContactsPage() {
  // Contacts personnalisés ajoutés manuellement (persistance localStorage)
  const [customContacts, setCustomContacts] = useState<ContactItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_contacts_custom_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Blacklist des contacts supprimés (persistance locale)
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('iml_contacts_deleted_ids_v1');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Overrides des contacts modifiés (persistance locale)
  const [contactOverrides, setContactOverrides] = useState<Record<string, Partial<ContactItem>>>(() => {
    try {
      const s = localStorage.getItem('iml_contacts_overrides_v1');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  });

  // Sauvegarder les contacts personnalisés
  useEffect(() => {
    try {
      localStorage.setItem('iml_contacts_custom_v2', JSON.stringify(customContacts));
    } catch {
      // Ignorer
    }
  }, [customContacts]);

  // Sauvegarder les suppressions
  useEffect(() => {
    try {
      localStorage.setItem('iml_contacts_deleted_ids_v1', JSON.stringify(deletedIds));
    } catch {
      // Ignorer
    }
  }, [deletedIds]);

  // Sauvegarder les modifications
  useEffect(() => {
    try {
      localStorage.setItem('iml_contacts_overrides_v1', JSON.stringify(contactOverrides));
    } catch {
      // Ignorer
    }
  }, [contactOverrides]);

  // Récupération des bénéficiaires depuis la base de données
  const { data: bRes, isLoading: isLoadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries-contacts-sync'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
  });

  // Récupération des agents et coachs depuis la base de données
  const { data: optRes, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['beneficiary-options-contacts-sync'],
    queryFn: () => api<{ agents: any[] }>('/beneficiaries/options'),
  });

  // Construction de la liste unifiée des contacts
  const allContacts = useMemo(() => {
    const list: ContactItem[] = [];

    // 1. Bénéficiaires de la plateforme
    if (bRes?.items) {
      bRes.items.forEach((b: any) => {
        const projectName = b.projects?.[0]?.name || '';
        const fullName = [b.firstName, b.lastName].filter(Boolean).join(' ');
        const displayName = fullName || projectName || 'Bénéficiaire';
        const displayCompany = projectName && projectName !== displayName 
          ? projectName 
          : (b.type === 'STARTUP' ? 'Start-up en incubation' : (b.type === 'ENTREPRISE' ? 'PME / Entreprise' : 'Porteur de projet'));

        list.push({
          id: `beneficiary-${b.id}`,
          name: displayName,
          company: displayCompany,
          email: b.email || `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@contact-pme.ga`,
          phone: b.phone || '+241 07 45 88 12',
          category: 'Bénéficiaire',
          roleDescription: b.type ? `Porteur / Dirigeant (${b.type})` : 'Bénéficiaire accompagné',
          source: 'database_beneficiary',
          createdAt: b.createdAt || new Date().toISOString()
        });
      });
    }

    // 2. Coachs et équipe IML Digit
    if (optRes?.agents) {
      optRes.agents.forEach((a: any) => {
        const isCoach = a.role?.code === 'COACH';
        list.push({
          id: `user-${a.id}`,
          name: `${a.firstName} ${a.lastName}`,
          company: 'IML Digit - Cellule d\'Accompagnement',
          email: a.email,
          phone: a.phone || '+241 06 10 20 30',
          category: 'Coach',
          roleDescription: isCoach ? 'Coach Référent / Expert Technique' : (a.role?.label || 'Agent IML'),
          source: 'database_user',
          createdAt: '2026-01-01T00:00:00.000Z'
        });
      });
    }

    // 3. Partenaires et institutions clés
    list.push(...PRESET_PARTNER_CONTACTS);

    // 4. Contacts manuels ajoutés par l'utilisateur
    list.push(...customContacts);

    // Appliquer les suppressions (blacklist) et modifications (overrides)
    const result = list
      .filter(c => !deletedIds.includes(c.id))
      .map(c => {
        const override = contactOverrides[c.id];
        return override ? { ...c, ...override } : c;
      });

    return result;
  }, [bRes, optRes, customContacts, deletedIds, contactOverrides]);

  // Filtre par catégorie
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');

  // Recherche textuelle
  const [searchTerm, setSearchTerm] = useState('');

  // Tri par date ou nom
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sélection multiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Colonnes visibles
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    company: true,
    category: true,
    email: true,
    phone: true,
    createdAt: true,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modale création d'un nouveau contact
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<ContactCategory>('Externe');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Modale d'édition d'un contact existant
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState<ContactCategory>('Bénéficiaire');
  const [editRoleDesc, setEditRoleDesc] = useState('');

  // Toast temporaire
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filtrage et tri
  const filteredContacts = useMemo(() => {
    let result = [...allContacts];

    // Filtre de catégorie
    if (selectedCategory !== 'TOUS') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Recherche
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.roleDescription && c.roleDescription.toLowerCase().includes(q))
      );
    }

    // Tri par date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [allContacts, selectedCategory, searchTerm, sortOrder]);

  const total = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayedContacts = filteredContacts.slice((page - 1) * pageSize, page * pageSize);

  // Compteurs pour les pastilles de filtre
  const counts = useMemo(() => {
    return {
      all: allContacts.length,
      beneficiaries: allContacts.filter(c => c.category === 'Bénéficiaire').length,
      coaches: allContacts.filter(c => c.category === 'Coach').length,
      partners: allContacts.filter(c => c.category === 'Partenaire' || c.category === 'Financeur').length,
      custom: allContacts.filter(c => c.source === 'custom').length,
    };
  }, [allContacts]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedContacts.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = displayedContacts.length > 0 && displayedContacts.every(c => selectedIds.includes(c.id));

  // Export CSV complet
  const handleExport = () => {
    if (filteredContacts.length === 0) {
      alert('Aucun contact à exporter');
      return;
    }
    const headers = ['Nom', 'Organisation / Entreprise', 'Catégorie', 'Rôle / Fonction', 'Adresse e-mail', 'Téléphone / WhatsApp', 'Date d\'ajout'];
    const rows = filteredContacts.map(c => [
      `"${c.name}"`,
      `"${c.company || ''}"`,
      `"${c.category}"`,
      `"${c.roleDescription || ''}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${new Date(c.createdAt).toLocaleDateString('fr-FR')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_iml_digit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Liste des contacts exportée en CSV avec succès');
  };

  // Ajout manuel d'un contact
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Veuillez renseigner le nom et l\'adresse e-mail.');
      return;
    }

    const contact: ContactItem = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      company: newCompany.trim() || undefined,
      email: newEmail.trim(),
      phone: newPhone.trim() || undefined,
      category: newCategory,
      roleDescription: newRoleDesc.trim() || undefined,
      source: 'custom',
      createdAt: new Date().toISOString()
    };

    setCustomContacts(prev => [contact, ...prev]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewCompany('');
    setNewEmail('');
    setNewPhone('');
    setNewCategory('Externe');
    setNewRoleDesc('');
    showToast(`✓ Contact "${contact.name}" ajouté avec succès`);
  };

  // Ouvrir la modale d'édition pour n'importe quel contact
  const handleOpenEdit = (c: ContactItem) => {
    setEditingContact(c);
    setEditName(c.name);
    setEditCompany(c.company || '');
    setEditEmail(c.email);
    setEditPhone(c.phone || '');
    setEditCategory(c.category);
    setEditRoleDesc(c.roleDescription || '');
    setIsEditModalOpen(true);
  };

  // Sauvegarder la modification d'un contact
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    const updatedFields: Partial<ContactItem> = {
      name: editName.trim(),
      company: editCompany.trim() || undefined,
      email: editEmail.trim(),
      phone: editPhone.trim() || undefined,
      category: editCategory,
      roleDescription: editRoleDesc.trim() || undefined,
    };

    if (editingContact.source === 'custom') {
      setCustomContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...updatedFields } : c));
    }

    setContactOverrides(prev => ({
      ...prev,
      [editingContact.id]: updatedFields
    }));

    setIsEditModalOpen(false);
    setEditingContact(null);
    showToast(`✓ Contact "${editName}" mis à jour avec succès`);
  };

  // Suppression d'un contact (personnalisé ou standard)
  const handleDeleteContact = (c: ContactItem) => {
    if (window.confirm(`Confirmez-vous la suppression du contact "${c.name}" de l'annuaire ?`)) {
      if (c.source === 'custom') {
        setCustomContacts(prev => prev.filter(item => item.id !== c.id));
      }
      setDeletedIds(prev => [...prev, c.id]);
      setSelectedIds(prev => prev.filter(id => id !== c.id));
      showToast(`✓ Contact "${c.name}" supprimé de l'annuaire`);
    }
  };



  return (
    <div className="w-full space-y-4 font-sans text-slate-800">

      {/* Toast de confirmation */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#101f2e] text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700/80 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <UserCheck className="size-4 text-[#23c3b1]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          1. EN-TÊTE PRINCIPAL : TITRE, STATS & BOUTON NOUVEAU CONTACT
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-800 tracking-tight">
              Annuaire des Contacts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#178578] border border-teal-200/70">
              {allContacts.length} répertoriés
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Répertoire unifié des entrepreneurs bénéficiaires, coachs experts, coordinateurs IML et partenaires institutionnels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Nouveau contact</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. FILTRES RAPIDES PAR CATÉGORIE (Pastilles cliquables)
         ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => { setSelectedCategory('TOUS'); setPage(1); }}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 ${
            selectedCategory === 'TOUS'
              ? 'bg-[#101f2e] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tous ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => { setSelectedCategory('Bénéficiaire'); setPage(1); }}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === 'Bénéficiaire'
              ? 'bg-[#23c3b1] text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="size-2 rounded-full bg-[#23c3b1]" />
          Bénéficiaires & PME ({counts.beneficiaries})
        </button>

        <button
          type="button"
          onClick={() => { setSelectedCategory('Coach'); setPage(1); }}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === 'Coach'
              ? 'bg-[#101f2e] text-[#23c3b1] shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="size-2 rounded-full bg-[#101f2e]" />
          Coachs & Équipe ({counts.coaches})
        </button>

        <button
          type="button"
          onClick={() => { setSelectedCategory('Partenaire'); setPage(1); }}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
            selectedCategory === 'Partenaire'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="size-2 rounded-full bg-purple-500" />
          Partenaires & Financeurs ({counts.partners})
        </button>

        {counts.custom > 0 && (
          <button
            type="button"
            onClick={() => { setSelectedCategory('Externe'); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'Externe'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="size-2 rounded-full bg-amber-500" />
            Ajoutés manuellement ({counts.custom})
          </button>
        )}
      </div>

      {/* =========================================================================
          3. BARRE DE RECHERCHE, SÉLECTEUR DE COLONNES & EXPORT
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Colonnes sélectionnables */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="w-40 px-3 py-1.5 rounded border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between shadow-2xs transition-colors cursor-pointer"
          >
            <span>Colonnes</span>
            <ChevronDown className="size-3.5 text-slate-600" />
          </button>

          {isColumnsDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-xl z-30 p-2 space-y-1 text-xs">
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.name}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, name: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Nom & Prénom</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.company}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, company: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Entreprise / Organisation</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.category}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, category: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Catégorie</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.email}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, email: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Adresse e-mail</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.phone}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, phone: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Téléphone</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.createdAt}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, createdAt: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Date d'ajout</span>
              </label>
            </div>
          )}
        </div>

        {/* Barre de recherche + Export + Pagination */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Champ de recherche */}
          <div className="relative">
            <Search className="size-3.5 text-[#23c3b1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher nom, entreprise, email..."
              className="w-56 sm:w-64 pl-8 pr-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1]"
            />
          </div>

          {/* Bouton Exporter */}
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-normal flex items-center gap-1.5 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          {/* Pagination compacte 1 / 1 < > */}
          <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-600">
            <span>{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer text-slate-700"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer text-slate-700"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          4. TABLE DES CONTACTS AVEC WHATSAPP, E-MAIL, MODIFIER ET SUPPRIMER
         ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto min-h-[350px] shadow-2xs flex flex-col justify-between">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-normal text-slate-600 bg-slate-50/70">
              
              {/* Checkbox colonne */}
              <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-[#23c3b1] focus:ring-[#23c3b1] size-3.5 cursor-pointer"
                />
              </th>

              {visibleColumns.name && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200">
                  Nom & Prénom
                </th>
              )}

              {visibleColumns.company && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200">
                  Entreprise / Organisation
                </th>
              )}

              {visibleColumns.category && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200">
                  Catégorie
                </th>
              )}

              {visibleColumns.email && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200">
                  Adresse e-mail
                </th>
              )}

              {visibleColumns.phone && (
                <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200">
                  Téléphone
                </th>
              )}

              {visibleColumns.createdAt && (
                <th 
                  onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                  className="py-2.5 px-3 font-semibold text-slate-700 flex items-center gap-1 cursor-pointer select-none hover:text-slate-900 border-r border-slate-200"
                >
                  <span>Date d'ajout</span>
                  {sortOrder === 'desc' ? (
                    <ArrowDown className="size-3 text-slate-700 stroke-[2]" />
                  ) : (
                    <ArrowUp className="size-3 text-slate-700 stroke-[2]" />
                  )}
                </th>
              )}

              <th className="py-2.5 px-3 font-semibold text-slate-700 text-right pr-4 min-w-[200px]">
                Actions directes
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoadingBeneficiaries || isLoadingAgents ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400">
                  Chargement des contacts en cours...
                </td>
              </tr>
            ) : displayedContacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400">
                  Aucun contact ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              displayedContacts.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/80">
                    
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(c.id)}
                        className="rounded border-slate-300 text-[#23c3b1] focus:ring-[#23c3b1] size-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Nom & Prénom avec initiale */}
                    {visibleColumns.name && (
                      <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-2xs ${
                            c.category === 'Coach' ? 'bg-[#101f2e]' :
                            c.category === 'Bénéficiaire' ? 'bg-[#23c3b1]' :
                            c.category === 'Partenaire' ? 'bg-purple-600' :
                            c.category === 'Financeur' ? 'bg-blue-600' : 'bg-slate-600'
                          }`}>
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">{c.name}</span>
                            {c.roleDescription && (
                              <span className="text-[10px] text-slate-400 block">{c.roleDescription}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Entreprise / Organisation */}
                    {visibleColumns.company && (
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Building className="size-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{c.company || '—'}</span>
                        </div>
                      </td>
                    )}

                    {/* Catégorie */}
                    {visibleColumns.category && (
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium inline-block ${
                          c.category === 'Bénéficiaire' ? 'bg-teal-50 text-[#178578] border border-teal-200/60' :
                          c.category === 'Coach' ? 'bg-slate-100 text-[#101f2e] border border-slate-300 font-semibold' :
                          c.category === 'Partenaire' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                          c.category === 'Financeur' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' :
                          'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                          {c.category}
                        </span>
                      </td>
                    )}

                    {/* E-mail */}
                    {visibleColumns.email && (
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        <a 
                          href={`mailto:${c.email}`} 
                          className="text-[#23c3b1] hover:underline flex items-center gap-1 font-medium"
                        >
                          <Mail className="size-3 text-slate-400 shrink-0" />
                          <span>{c.email}</span>
                        </a>
                      </td>
                    )}

                    {/* Téléphone / WhatsApp */}
                    {visibleColumns.phone && (
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        {c.phone ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Non renseigné</span>
                        )}
                      </td>
                    )}

                    {/* Date d'ajout */}
                    {visibleColumns.createdAt && (
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    )}

                    {/* Actions directes : Modifier, Supprimer */}
                    <td className="py-2.5 px-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">

                        {/* Bouton Modifier */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Modifier les informations de ce contact"
                        >
                          <Pencil className="size-3 text-slate-600" />
                          <span className="hidden md:inline">Modifier</span>
                        </button>

                        {/* Bouton Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(c)}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 transition-colors cursor-pointer shadow-2xs"
                          title="Supprimer ce contact de l'annuaire"
                        >
                          <Trash2 className="size-3.5 text-rose-600" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          5. PIED DE PAGE : PAGINATION COMPACTE
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
          <span>contacts par page (Total : {total})</span>
        </div>

        {/* Pagination 1 / 1 < > */}
        <div className="flex items-center gap-2">
          <span>{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer text-slate-700"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer text-slate-700"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

      </div>

      {/* =========================================================================
          6. MODALE D'AJOUT D'UN NOUVEAU CONTACT
         ========================================================================= */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête */}
            <div className="bg-[#101f2e] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Ajouter un nouveau contact</h3>
                <p className="text-[11px] text-slate-300">Enregistrer un interlocuteur externe dans l'annuaire IML Digit</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="size-7 rounded-md hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleCreateContact} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nom complet ou Nom de l'organisme *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex : Paul MBA ou Société Gabonaise d'Énergie"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Organisation / Entreprise</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="Ex : Cabinet Conseil, Banque, Ministère..."
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ContactCategory)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-[#23c3b1] text-xs"
                  >
                    <option value="Partenaire">Partenaire</option>
                    <option value="Financeur">Financeur / Banque</option>
                    <option value="Coach">Coach / Expert</option>
                    <option value="Bénéficiaire">Bénéficiaire</option>
                    <option value="Externe">Autre / Externe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Fonction / Rôle</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Ex : Chargé d'affaires"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Adresse e-mail *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contact@exemple.com"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Numéro de téléphone / WhatsApp</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+241 07 00 00 00"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  Enregistrer le contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. MODALE DE MODIFICATION D'UN CONTACT EXISTANT
         ========================================================================= */}
      {isEditModalOpen && editingContact && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête */}
            <div className="bg-[#101f2e] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Modifier le contact</h3>
                <p className="text-[11px] text-slate-300">Mettre à jour les informations de {editingContact.name}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="size-7 rounded-md hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nom complet ou Organisation *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Entreprise / Structure</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Catégorie</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ContactCategory)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-[#23c3b1] text-xs"
                  >
                    <option value="Bénéficiaire">Bénéficiaire</option>
                    <option value="Coach">Coach / Expert</option>
                    <option value="Partenaire">Partenaire</option>
                    <option value="Financeur">Financeur / Banque</option>
                    <option value="Externe">Autre / Externe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Rôle / Fonction</label>
                  <input
                    type="text"
                    value={editRoleDesc}
                    onChange={(e) => setEditRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Adresse e-mail *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#23c3b1] text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
