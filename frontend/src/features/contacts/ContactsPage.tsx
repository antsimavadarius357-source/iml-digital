import { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDown, 
  ArrowUp,
  Ban
} from 'lucide-react';

interface ContactItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function ContactsPage() {
  // Liste des contacts (persistance locale)
  const [contacts] = useState<ContactItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_contacts_list_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recherche
  const [searchTerm, setSearchTerm] = useState('');

  // Tri
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sélection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Colonnes visibles
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    createdAt: true,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filtrage et tri
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [contacts, searchTerm, sortOrder]);

  const total = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayedContacts = filteredContacts.slice((page - 1) * pageSize, page * pageSize);

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

  const handleExport = () => {
    if (filteredContacts.length === 0) {
      alert('Aucun contact à exporter');
      return;
    }
    const headers = ['Nom', 'Adresse e-mail', 'Date de création'];
    const rows = filteredContacts.map(c => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${new Date(c.createdAt).toLocaleDateString('fr-FR')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      
      {/* =========================================================================
          1. TITRE PRINCIPAL
         ========================================================================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-[23px] font-normal text-slate-800 tracking-tight">
          Contacts
        </h1>
      </div>

      {/* =========================================================================
          2. BARRE SUPÉRIEURE DE CONTRÔLE (Colonnes à gauche | Recherche, Exporter, Pagination à droite)
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
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-xl z-30 p-2 space-y-1 text-xs">
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
                  checked={visibleColumns.email}
                  onChange={(e) => setVisibleColumns(c => ({ ...c, email: e.target.checked }))}
                  className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                />
                <span>Adresse e-mail</span>
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
            </div>
          )}
        </div>

        {/* Droite : Barre de recherche + Bouton Exporter la liste + Pagination compacte */}
        <div className="flex items-center gap-2.5">
          
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
              placeholder="Rechercher"
              className="w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1]"
            />
          </div>

          {/* Bouton Exporter la liste */}
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-normal flex items-center gap-1.5 border border-slate-200/90 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Exporter la liste</span>
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
          3. TABLE DES CONTACTS (Conforme à la capture d'écran)
         ========================================================================= */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden overflow-x-auto min-h-[300px] flex flex-col justify-between">
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
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200">
                  Nom
                </th>
              )}

              {visibleColumns.email && (
                <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200">
                  Adresse e-mail
                </th>
              )}

              {visibleColumns.createdAt && (
                <th 
                  onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                  className="py-2.5 px-3 font-normal text-slate-700 flex items-center gap-1 cursor-pointer select-none hover:text-slate-900"
                >
                  <span>Date de création</span>
                  {sortOrder === 'desc' ? (
                    <ArrowDown className="size-3 text-slate-700 stroke-[2]" />
                  ) : (
                    <ArrowUp className="size-3 text-slate-700 stroke-[2]" />
                  )}
                </th>
              )}

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedContacts.length === 0 ? (
              <tr>
                <td 
                  colSpan={4} 
                  className="py-24 text-center text-slate-400 select-none"
                >
                  {/* Icône cercle barré gris (exactement comme sur votre capture) */}
                  <Ban className="size-7 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-normal">
                    Aucune donnée
                  </p>
                </td>
              </tr>
            ) : (
              displayedContacts.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(c.id)}
                        className="rounded border-slate-300 text-[#23c3b1] focus:ring-[#23c3b1] size-3.5 cursor-pointer"
                      />
                    </td>
                    {visibleColumns.name && (
                      <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">
                        {c.name}
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                        {c.email}
                      </td>
                    )}
                    {visibleColumns.createdAt && (
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    )}
                  </tr>
                );
              })
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
  );
}
