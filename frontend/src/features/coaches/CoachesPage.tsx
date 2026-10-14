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
  Users
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface CoachItem {
  id: string;
  name: string;
  email: string;
  role: 'COACH' | 'AGENT' | 'FORMATEUR' | 'ADMIN';
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

  // Liste des coachs (avec le compte courant par défaut et persistance locale)
  const defaultCoachName = user ? `${user.firstName} ${user.lastName}`.trim().toUpperCase() : 'ALEXANDRE AGENT IML';
  const defaultCoachEmail = user?.email || 'agent@imldigit.com';

  const [coaches, setCoaches] = useState<CoachItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_coaches_list_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'coach-owner-1',
        name: defaultCoachName || 'ALEXANDRE AGENT IML',
        email: defaultCoachEmail,
        role: 'AGENT',
        roleLabel: 'Agent d\'accompagnement IML',
        language: 'Français',
        createdAt: '09/10/2026',
        activeBeneficiariesCount: 1,
        groupsCount: 0,
        lastLogin: 'Aucun',
        isOwner: true
      }
    ];
  });

  // Recherche
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

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sauvegarde des coachs
  useEffect(() => {
    try {
      localStorage.setItem('iml_coaches_list_v2', JSON.stringify(coaches));
    } catch (e) {
      console.error(e);
    }
  }, [coaches]);

  // Filtrage et tri
  const filteredCoaches = useMemo(() => {
    let result = [...coaches];

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

  // Ajouter un coach
  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;

    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.toUpperCase();
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const newCoach: CoachItem = {
      id: `coach-${Date.now()}`,
      name: fullName,
      email: newEmail.trim(),
      role: 'COACH',
      roleLabel: "Coach d'accompagnement",
      language: newLanguage,
      createdAt: formattedDate,
      activeBeneficiariesCount: 0,
      groupsCount: 0,
      lastLogin: 'Aucun',
      isOwner: false
    };

    setCoaches(prev => [newCoach, ...prev]);
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setIsAddCoachOpen(false);
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      
      {/* =========================================================================
          1. TITRE PRINCIPAL
         ========================================================================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-[23px] font-normal text-slate-800 tracking-tight">
          Coachs
        </h1>
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
            <ChevronDown className="size-3.5 text-[#f06553]" />
          </button>

          {isColumnsDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl z-30 p-2 space-y-1 text-xs">
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
          3. TABLE DES COACHS (Identique à la capture d'écran fournie)
         ========================================================================= */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden overflow-x-auto min-h-[160px] flex flex-col justify-between">
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
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedCoaches.map((c) => (
              <tr 
                key={c.id} 
                onClick={() => navigate(`/coachs/${c.id}`)}
                className="transition-colors hover:bg-slate-50 cursor-pointer"
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
                          <span className="font-medium text-slate-800 tracking-tight leading-snug">
                            {c.name}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.2 w-fit mt-0.5 border ${
                            c.role === 'COACH' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : c.role === 'AGENT' 
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : c.role === 'FORMATEUR'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {c.role === 'COACH' && '🎯 Coach'}
                            {c.role === 'AGENT' && '📋 Agent coordination'}
                            {c.role === 'FORMATEUR' && '🎓 Formateur'}
                            {c.role === 'ADMIN' && '👑 Direction / Admin'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-3.5 text-slate-800 stroke-[2.5] shrink-0" />
                    </div>
                  </td>
                )}
                {visibleColumns.language && (
                  <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      {/* Drapeau français net avec trois bandes */}
                      <span className="inline-flex overflow-hidden rounded-[2px] w-4 h-3 border border-slate-200 shrink-0 shadow-2xs">
                        <span className="w-1/3 h-full bg-[#002654]"></span>
                        <span className="w-1/3 h-full bg-white"></span>
                        <span className="w-1/3 h-full bg-[#ce1126]"></span>
                      </span>
                      <span>{c.language}</span>
                    </div>
                  </td>
                )}
                {visibleColumns.email && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {c.email}
                  </td>
                )}
                {visibleColumns.createdAt && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {c.createdAt}
                  </td>
                )}
                {visibleColumns.activeBeneficiaries && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {c.activeBeneficiariesCount}
                  </td>
                )}
                {visibleColumns.groups && (
                  <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                    {c.groupsCount}
                  </td>
                )}
                {visibleColumns.lastLogin && (
                  <td className="py-2.5 px-3 text-slate-600">
                    {c.lastLogin}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          4. BAS DE PAGE / PAGINATION (Afficher 20 ⌄ | 1 / 1 < >)
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
                  <p className="text-xs text-slate-500">Ajoutez un accompagnateur ou formateur à votre équipe</p>
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
                    placeholder="Ex : Sarah"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
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
                    placeholder="Ex : BENALI"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
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
                  placeholder="coach@exemple.fr"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Langue
                </label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Espagnol">Espagnol</option>
                  <option value="Arabe">Arabe</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCoachOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-medium bg-[#f06553] hover:bg-[#e05341] text-white shadow-2xs transition-colors cursor-pointer"
                >
                  Ajouter le coach
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
