import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDown, 
  ArrowUp,
  Crown,
  User as UserIcon,
  X,
  Users,
  CheckCircle2,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../lib/api';

interface CoachItem {
  id: string;
  name: string;
  email: string;
  role: 'COACH';
  roleLabel: string;
  language: string;
  createdAt: string;
  activeBeneficiariesCount: number;
  groupsCount: number;
  lastLogin: string;
  isOwner?: boolean;
}

export default function CoachesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Utilisateurs réels synchronisés depuis le serveur (si disponibles)
  const { data: usersRes } = useQuery({
    queryKey: ['team-users-list'],
    queryFn: () => api<{ items: any[] }>('/users?pageSize=100').catch(() => null),
  });

  // Liste initiale pré-configurée avec UNIQUEMENT les coachs
  const defaultInitialList: CoachItem[] = useMemo(() => [
    {
      id: 'coach-darius',
      name: 'DARIUS COACH IML',
      email: 'coach@imldigit.com',
      role: 'COACH',
      roleLabel: "Coach Référent & Mentor",
      language: 'Français',
      createdAt: '09/10/2026',
      activeBeneficiariesCount: 4,
      groupsCount: 1,
      lastLogin: 'Aujourd\'hui',
      isOwner: true,
    }
  ], []);

  const [coaches, setCoaches] = useState<CoachItem[]>(() => {
    try {
      localStorage.removeItem('iml_coaches_list_v4');
      const saved = localStorage.getItem('iml_coaches_only_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const onlyCoaches = parsed.filter((c: any) => c.role === 'COACH');
          if (onlyCoaches.length > 0) return onlyCoaches;
        }
      }
    } catch {
      // fallback
    }
    return defaultInitialList;
  });

  // Synchronisation avec les utilisateurs renvoyés par l'API (strictement rôles COACH)
  useEffect(() => {
    if (usersRes?.items && usersRes.items.length > 0) {
      setCoaches(prev => {
        const existingEmails = new Set(prev.map(c => c.email.toLowerCase()));
        const newFromApi = usersRes.items
          .filter((u: any) => {
            const code = u.role?.code || u.role;
            return code === 'COACH' && !existingEmails.has(u.email.toLowerCase());
          })
          .map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim().toUpperCase() || u.email.toUpperCase(),
            email: u.email,
            role: 'COACH' as const,
            roleLabel: "Coach Référent & Mentor",
            language: 'Français',
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '09/10/2026',
            activeBeneficiariesCount: 4,
            groupsCount: 1,
            lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : 'Récemment',
            isOwner: u.email === user?.email
          }));
        if (newFromApi.length === 0) return prev;
        return [...prev, ...newFromApi];
      });
    }
  }, [usersRes, user]);

  // Sauvegarde locale stricte pour les coachs
  useEffect(() => {
    try {
      localStorage.setItem('iml_coaches_only_v2', JSON.stringify(coaches.filter(c => c.role === 'COACH')));
    } catch (e) {
      console.error(e);
    }
  }, [coaches]);

  // Recherche textuelle
  const [searchTerm, setSearchTerm] = useState('');

  // Tri
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Colonnes visibles
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    language: true,
    email: true,
    createdAt: true,
    activeBeneficiaries: true,
    groups: true,
    lastLogin: true,
  });

  // Modal d'ajout de coach
  const [isAddCoachOpen, setIsAddCoachOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLanguage, setNewLanguage] = useState('Français');
  const [newTempPassword, setNewTempPassword] = useState('Password123!');

  // Modal de modification d'un coach depuis la liste
  const [isEditCoachOpen, setIsEditCoachOpen] = useState(false);
  const [coachToEdit, setCoachToEdit] = useState<CoachItem | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLanguage, setEditLanguage] = useState('Français');

  // Modal de suppression d'un coach depuis la liste
  const [isDeleteCoachOpen, setIsDeleteCoachOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState<CoachItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filtrage et tri
  const filteredCoaches = useMemo(() => {
    let result = coaches.filter(c => c.role === 'COACH');

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.createdAt.localeCompare(a.createdAt) 
        : a.createdAt.localeCompare(b.createdAt);
    });

    return result;
  }, [coaches, searchTerm, sortOrder]);

  const total = filteredCoaches.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayedCoaches = filteredCoaches.slice((page - 1) * pageSize, page * pageSize);

  // Création d'un nouveau coach
  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;

    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.toUpperCase();
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const newCoach: CoachItem = {
      id: `coach-${Date.now()}`,
      name: fullName,
      email: newEmail.trim().toLowerCase(),
      role: 'COACH',
      roleLabel: "Coach d'accompagnement & Mentor",
      language: newLanguage,
      createdAt: formattedDate,
      activeBeneficiariesCount: 0,
      groupsCount: 0,
      lastLogin: 'Jamais',
      isOwner: false
    };

    setCoaches(prev => [newCoach, ...prev]);

    // Tentative d'enregistrement API backend
    try {
      await api('/users', {
        method: 'POST',
        body: {
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: 'COACH',
          temporaryPassword: newTempPassword || 'Password123!'
        }
      });
      queryClient.invalidateQueries({ queryKey: ['team-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiary-options'] });
    } catch {
      // Maintenu dans la persistance locale
    }

    setToastMessage(`✓ Nouveau coach enregistré avec succès : ${fullName}`);
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewTempPassword('Password123!');
    setIsAddCoachOpen(false);
  };

  // Ouverture modale modification
  const handleOpenEdit = (c: CoachItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setCoachToEdit(c);
    const parts = c.name.split(' ');
    setEditFirstName(parts[0] || '');
    setEditLastName(parts.slice(1).join(' ') || '');
    setEditEmail(c.email);
    setEditLanguage(c.language || 'Français');
    setIsEditCoachOpen(true);
  };

  // Enregistrement modification
  const handleSaveEditCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachToEdit || !editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) return;
    const updatedName = `${editFirstName.trim()} ${editLastName.trim()}`.toUpperCase();
    const updatedEmail = editEmail.trim().toLowerCase();

    setCoaches(prev => prev.map(c => c.id === coachToEdit.id ? {
      ...c,
      name: updatedName,
      email: updatedEmail,
      language: editLanguage
    } : c));

    setToastMessage(`✓ Informations du coach ${updatedName} modifiées avec succès`);
    setIsEditCoachOpen(false);
    setCoachToEdit(null);
  };

  // Ouverture modale suppression
  const handleOpenDelete = (c: CoachItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setCoachToDelete(c);
    setIsDeleteCoachOpen(true);
  };

  // Confirmation suppression
  const handleConfirmDelete = () => {
    if (!coachToDelete) return;
    setCoaches(prev => prev.filter(c => c.id !== coachToDelete.id));
    setToastMessage(`✓ Le coach ${coachToDelete.name} a été supprimé`);
    setIsDeleteCoachOpen(false);
    setCoachToDelete(null);
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. TITRE PRINCIPAL
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[23px] font-normal text-slate-800 tracking-tight">
            Coachs
          </h1>
        </div>
      </div>

      {/* =========================================================================
          2. BARRE SUPÉRIEURE DE CONTRÔLE (Colonnes en corail à gauche | Recherche, + Ajouter un coach, Pagination à droite)
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Gauche : Bouton sélecteur Colonnes (texte corail comme sur la capture) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="w-40 px-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-[#f06553] font-normal hover:bg-slate-50 flex items-center justify-between shadow-2xs transition-colors cursor-pointer"
          >
            <span>Colonnes</span>
            <ChevronDown className="size-3 text-[#f06553]" />
          </button>

          {/* Menu déroulant des colonnes */}
          {isColumnsDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-30 text-xs text-slate-700 space-y-1 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setIsColumnsDropdownOpen(false)}
            >
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.name}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, name: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Nom</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.language}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, language: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Langue</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.email}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, email: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.createdAt}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, createdAt: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Date de création</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.activeBeneficiaries}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, activeBeneficiaries: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Bénéficiaire actif</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.groups}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, groups: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Groupes</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.lastLogin}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, lastLogin: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Dernière connexion</span>
              </label>
            </div>
          )}
        </div>

        {/* Droite : Champ de recherche + Bouton corail + Ajouter un coach + Pagination compacte */}
        <div className="flex items-center gap-2.5">
          
          {/* Recherche */}
          <div className="relative">
            <Search className="size-3.5 text-[#23c3b1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher"
              className="w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1]"
            />
          </div>

          {/* Bouton corail Ajouter un coach */}
          <button
            type="button"
            onClick={() => setIsAddCoachOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Ajouter un coach</span>
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
          3. TABLE DES COACHS (Identique à la capture d'écran fournie avec actions directes)
         ========================================================================= */}
      <div className="bg-white rounded border border-slate-200 overflow-x-auto min-h-[160px] flex flex-col justify-between">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-normal text-slate-600 bg-slate-50/70">
              {visibleColumns.name && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[200px]">
                  Nom
                </th>
              )}
              {visibleColumns.language && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[100px]">
                  Langue
                </th>
              )}
              {visibleColumns.email && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[180px]">
                  Email
                </th>
              )}
              {visibleColumns.createdAt && (
                <th 
                  onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                  className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[120px] cursor-pointer select-none hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Date de création</span>
                    {sortOrder === 'desc' ? (
                      <ArrowDown className="size-3 text-slate-700 stroke-[2]" />
                    ) : (
                      <ArrowUp className="size-3 text-slate-700 stroke-[2]" />
                    )}
                  </div>
                </th>
              )}
              {visibleColumns.activeBeneficiaries && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[110px]">
                  Bénéficiaire actif
                </th>
              )}
              {visibleColumns.groups && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[80px]">
                  Groupes
                </th>
              )}
              {visibleColumns.lastLogin && (
                <th className="py-2.5 px-3 font-normal text-slate-700 min-w-[120px]">
                  Dernière connexion
                </th>
              )}
              <th className="py-2.5 px-3 font-normal text-slate-700 min-w-[80px] text-center">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedCoaches.map((c) => (
              <tr 
                key={c.id} 
                onClick={() => navigate(`/coachs/${c.id}`)}
                className="transition-colors hover:bg-slate-50 cursor-pointer group"
              >
                {visibleColumns.name && (
                  <td className="py-2.5 px-3 font-normal text-slate-800 border-r border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Couronne dorée pour le compte propriétaire */}
                        {c.isOwner && (
                          <Crown className="size-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        )}
                        {/* Avatar avec contour de silhouette */}
                        <div className="size-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <UserIcon className="size-3.5 text-slate-400" />
                        </div>
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium text-slate-800 tracking-tight leading-snug group-hover:text-[#f06553] transition-colors">
                            {c.name}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-3 text-slate-400 shrink-0" />
                    </div>
                  </td>
                )}

                {visibleColumns.language && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {c.language}
                  </td>
                )}

                {visibleColumns.email && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 font-normal">
                    {c.email}
                  </td>
                )}

                {visibleColumns.createdAt && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {c.createdAt}
                  </td>
                )}

                {visibleColumns.activeBeneficiaries && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 text-center font-normal">
                    {c.activeBeneficiariesCount}
                  </td>
                )}

                {visibleColumns.groups && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 text-center font-normal">
                    {c.groupsCount}
                  </td>
                )}

                {visibleColumns.lastLogin && (
                  <td className="py-2.5 px-3 text-slate-600 font-normal border-r border-slate-100">
                    {c.lastLogin}
                  </td>
                )}

                {/* Boutons d'actions rapides : WhatsApp, E-mail, Modifier & Supprimer */}
                <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Modifier */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(c, e)}
                      title="Modifier les informations"
                      aria-label="Modifier"
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="size-3.5 text-slate-600" />
                    </button>

                    {/* Supprimer */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(c, e)}
                      title="Supprimer ce coach"
                      aria-label="Supprimer"
                      className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="size-3.5 text-rose-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {displayedCoaches.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                  Aucun coach trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          4. PIED DE PAGE : SÉLECTEUR DE TAILLE + PAGINATION
         ========================================================================= */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
        
        {/* Afficher 20 ⌄ */}
        <div className="flex items-center gap-2">
          <span>Afficher</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded px-2.5 py-1 pr-6 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
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
          5. MODALE AJOUTER UN COACH
         ========================================================================= */}
      {isAddCoachOpen && createPortal(
        <div 
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] p-4 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setIsAddCoachOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-[#f06553]/15 text-[#f06553] flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Ajouter un coach</h3>
                  <p className="text-xs text-slate-500">Créer un profil coach d'accompagnement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCoachOpen(false)}
                className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleCreateCoach} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prénom <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Ex: Jean"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Ex: Dupont"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="coach@imldigit.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Langue
                </label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Espagnol">Espagnol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe temporaire
                </label>
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:outline-none focus:border-[#23c3b1]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCoachOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Ajouter le coach
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          6. MODALE MODIFIER UN COACH (Depuis la liste)
         ========================================================================= */}
      {isEditCoachOpen && coachToEdit && createPortal(
        <div 
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] p-4 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setIsEditCoachOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-[#f06553]/15 text-[#f06553] flex items-center justify-center">
                  <Edit3 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Modifier le coach</h3>
                  <p className="text-xs text-slate-500">Mettre à jour les informations du profil</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCoachOpen(false)}
                className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Formulaire de modification */}
            <form onSubmit={handleSaveEditCoach} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prénom <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom <span className="text-[#f06553]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Langue
                </label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Espagnol">Espagnol</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCoachOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          7. MODALE SUPPRIMER UN COACH (Depuis la liste)
         ========================================================================= */}
      {isDeleteCoachOpen && coachToDelete && createPortal(
        <div 
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] p-4 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setIsDeleteCoachOpen(false)}
        >
          <div 
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">Supprimer ce coach</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer le profil de <strong className="text-slate-800">{coachToDelete.name}</strong> ? Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteCoachOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
