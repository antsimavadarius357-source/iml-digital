import { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Ban, 
  X, 
  Users 
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface GroupItem {
  id: string;
  name: string;
  candidatesCount: number;
  groupDiscussion: boolean;
  chatInterParticipants: boolean;
  pathwayTemplate: string;
  articlesCount: number;
  createdAt: string;
}

export default function GroupsPage() {
  // Liste des groupes (persistance locale)
  const [groups, setGroups] = useState<GroupItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_groups_records_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal d'ajout de groupe
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPathway, setNewGroupPathway] = useState('Parcours standard d\'incubation');
  const [enableDiscussion, setEnableDiscussion] = useState(true);
  const [enableChat, setEnableChat] = useState(true);

  // Colonnes visibles
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    candidates: true,
    discussion: true,
    chat: true,
    pathway: true,
    articles: true,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const total = groups.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Sauvegarde des groupes
  useEffect(() => {
    try {
      localStorage.setItem('iml_groups_records_v1', JSON.stringify(groups));
    } catch (e) {
      console.error(e);
    }
  }, [groups]);

  // Ajouter un groupe
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: GroupItem = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      candidatesCount: 0,
      groupDiscussion: enableDiscussion,
      chatInterParticipants: enableChat,
      pathwayTemplate: newGroupPathway,
      articlesCount: 0,
      createdAt: new Date().toISOString()
    };

    setGroups(prev => [newGroup, ...prev]);
    setNewGroupName('');
    setIsAddGroupOpen(false);
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      
      {/* =========================================================================
          1. TITRE PRINCIPAL
         ========================================================================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-[23px] font-normal text-slate-800 tracking-tight">
          Groupes
        </h1>
      </div>

      {/* =========================================================================
          2. BARRE SUPÉRIEURE DE CONTRÔLE (Colonnes à gauche, + Ajouter un groupe + Pagination à droite)
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Gauche : Bouton sélecteur Colonnes */}
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
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl z-30 p-2 space-y-1 text-xs">
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.name}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, name: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Nom du groupe</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.candidates}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, candidates: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Nombre de candidats</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.discussion}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, discussion: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Discussion de groupe</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.chat}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, chat: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Chat inter-participants</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.pathway}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, pathway: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Modèle de parcours</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.articles}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, articles: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Articles d'accompagnement</span>
              </label>
            </div>
          )}
        </div>

        {/* Droite : Bouton corail + Ajouter un groupe + Pagination compacte */}
        <div className="flex items-center gap-2.5">
          
          {/* Bouton Ajouter un groupe */}
          <button
            type="button"
            onClick={() => setIsAddGroupOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Ajouter un groupe</span>
          </button>

          {/* Pagination compacte 1 / 1 < > */}
          <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-600">
            <span>{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          3. TABLE DES GROUPES (Identique à la capture d'écran de référence)
         ========================================================================= */}
      <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs overflow-hidden overflow-x-auto min-h-[220px] flex flex-col justify-between">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/90 text-xs font-normal text-slate-600 bg-white">
              {visibleColumns.name && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Nom du groupe
                </th>
              )}
              {visibleColumns.candidates && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Nombre de candidats
                </th>
              )}
              {visibleColumns.discussion && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Discussion de groupe
                </th>
              )}
              {visibleColumns.chat && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Chat inter-participants
                </th>
              )}
              {visibleColumns.pathway && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-100">
                  Modèle de parcours
                </th>
              )}
              {visibleColumns.articles && (
                <th className="py-2.5 px-3 font-normal text-slate-700">
                  Articles d'accompagnement
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {groups.length === 0 ? (
              <tr>
                <td 
                  colSpan={6} 
                  className="py-16 text-center text-slate-400 select-none"
                >
                  {/* Icône cercle barré gris (exactement comme sur votre capture) */}
                  <Ban className="size-6 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-normal">
                    Aucune donnée
                  </p>
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} className="transition-colors hover:bg-slate-50">
                  {visibleColumns.name && (
                    <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">
                      {g.name}
                    </td>
                  )}
                  {visibleColumns.candidates && (
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                      {g.candidatesCount}
                    </td>
                  )}
                  {visibleColumns.discussion && (
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      {g.groupDiscussion ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activée
                        </span>
                      ) : (
                        <span className="text-slate-400">Désactivée</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.chat && (
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      {g.chatInterParticipants ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activé
                        </span>
                      ) : (
                        <span className="text-slate-400">Désactivé</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.pathway && (
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                      {g.pathwayTemplate || '—'}
                    </td>
                  )}
                  {visibleColumns.articles && (
                    <td className="py-2.5 px-3 text-slate-600">
                      {g.articlesCount || 0}
                    </td>
                  )}
                </tr>
              ))
            )}
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
            className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="size-6 rounded bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

      </div>

      {/* =========================================================================
          5. MODALE AJOUTER UN GROUPE (AU PREMIER PLAN)
         ========================================================================= */}
      {isAddGroupOpen && createPortal(
        <div 
          className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] p-4 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setIsAddGroupOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-[#23c3b1]/15 text-[#23c3b1] flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Ajouter un groupe</h3>
                  <p className="text-xs text-slate-500">Créez une cohorte ou un groupe de bénéficiaires</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGroupOpen(false)}
                className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom du groupe <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex : Promotion Automne 2026, Cohorte Alpha..."
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modèle de parcours associé
                </label>
                <input
                  type="text"
                  value={newGroupPathway}
                  onChange={(e) => setNewGroupPathway(e.target.value)}
                  placeholder="Ex : Parcours d'incubation IML"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={enableDiscussion}
                    onChange={(e) => setEnableDiscussion(e.target.checked)}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Activer la discussion de groupe</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={enableChat}
                    onChange={(e) => setEnableChat(e.target.checked)}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                  />
                  <span>Activer le chat inter-participants</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddGroupOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-xs font-medium bg-[#f06553] hover:bg-[#e05341] text-white shadow-2xs transition-colors cursor-pointer"
                >
                  Créer le groupe
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
