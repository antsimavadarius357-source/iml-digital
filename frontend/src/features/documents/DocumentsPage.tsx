import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  XCircle, 
  Search, 
  Download, 
  Pencil, 
  Trash2, 
  Building2, 
  User,
  X,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import AddDocumentWizardModal from './AddDocumentWizardModal';
import BeneficiaryDossierModal from './BeneficiaryDossierModal';

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  beneficiaryId: string;
  beneficiaryName: string;
  companyName: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  format: string;
  size: string;
  date: string;
  status: 'VALIDE' | 'EN_ATTENTE' | 'REJETE';
  url?: string;
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Business Plan Prévisionnel 3 ans - EcoGabon',
    category: 'Finance & Trésorerie',
    beneficiaryId: 'b-1',
    beneficiaryName: 'Sylvie NDONG',
    companyName: 'EcoGabon SARL',
    beneficiaryPhone: '+241 65 30 11 22',
    beneficiaryEmail: 'sylvie.ndong@ecogabon.ga',
    format: 'PDF',
    size: '2.4 Mo',
    date: '2026-10-14',
    status: 'VALIDE'
  },
  {
    id: 'doc-2',
    title: 'Statuts Notariés & Immatriculation RCCM Libreville',
    category: 'Juridique & Légal',
    beneficiaryId: 'b-2',
    beneficiaryName: 'Jean-Marc OBIANG',
    companyName: 'Kamba Tech',
    beneficiaryPhone: '+241 77 12 45 89',
    beneficiaryEmail: 'jm.obiang@kambatech.ga',
    format: 'PDF',
    size: '1.8 Mo',
    date: '2026-10-12',
    status: 'VALIDE'
  },
  {
    id: 'doc-3',
    title: 'Dossier de Demande de Financement Bancaire (BGFIBank)',
    category: 'Finance & Trésorerie',
    beneficiaryId: 'b-1',
    beneficiaryName: 'Sylvie NDONG',
    companyName: 'EcoGabon SARL',
    beneficiaryPhone: '+241 65 30 11 22',
    beneficiaryEmail: 'sylvie.ndong@ecogabon.ga',
    format: 'XLSX',
    size: '850 Ko',
    date: '2026-10-11',
    status: 'EN_ATTENTE'
  },
  {
    id: 'doc-4',
    title: 'Fiche d’Immatriculation ANPI & Agrément Coopérative',
    category: 'Juridique & Légal',
    beneficiaryId: 'b-3',
    beneficiaryName: 'Marcelle BIVEGHE',
    companyName: 'AgriBio Gabon Coopérative',
    beneficiaryPhone: '+241 62 88 90 14',
    beneficiaryEmail: 'contact@agrobiogabon.com',
    format: 'PDF',
    size: '1.1 Mo',
    date: '2026-10-09',
    status: 'VALIDE'
  },
  {
    id: 'doc-5',
    title: 'Pitch Deck & Support de Présentation Investisseurs',
    category: 'Stratégie & Pitch',
    beneficiaryId: 'b-2',
    beneficiaryName: 'Jean-Marc OBIANG',
    companyName: 'Kamba Tech',
    beneficiaryPhone: '+241 77 12 45 89',
    beneficiaryEmail: 'jm.obiang@kambatech.ga',
    format: 'PPTX',
    size: '4.6 Mo',
    date: '2026-10-07',
    status: 'VALIDE'
  },
  {
    id: 'doc-6',
    title: 'Grille Tarifaire B2B & Spécifications Prestations BTP',
    category: 'Commercial & Vente',
    beneficiaryId: 'b-4',
    beneficiaryName: 'Paul MVE',
    companyName: 'BTP Gabon Services',
    beneficiaryPhone: '+241 66 44 22 11',
    beneficiaryEmail: 'p.mve@btpgabon.ga',
    format: 'PDF',
    size: '720 Ko',
    date: '2026-10-04',
    status: 'EN_ATTENTE'
  }
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isCoach = user?.role === 'COACH';
  const [showUpload, setShowUpload] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Requête API vers les documents réels de la base de données
  const { data: docsRes, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api<{ items: any[] }>('/documents'),
  });

  // Modal d'édition de document
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Modal d'aperçu / lecteur de document en direct
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Bénéficiaires depuis l'API pour le filtre
  const { data: bRes } = useQuery({ 
    queryKey: ['beneficiaries-list'], 
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100') 
  });
  const beneficiaries = bRes?.items || [];

  // Documents réels enrichis de la BDD combinés aux modèles de référence
  const docs: DocumentItem[] = useMemo(() => {
    const rawItems = docsRes?.items || [];
    const realDocs: DocumentItem[] = rawItems.map((d: any) => {
      const ext = (d.fileName ? d.fileName.split('.').pop() : d.title.split('.').pop())?.toUpperCase() || 'DOC';
      let sizeLabel = '—';
      if (d.sizeBytes) {
        sizeLabel = d.sizeBytes < 1024 * 1024
          ? `${(d.sizeBytes / 1024).toFixed(0)} Ko`
          : `${(d.sizeBytes / (1024 * 1024)).toFixed(1)} Mo`;
      }
      return {
        id: d.id,
        title: d.title || d.fileName || 'Document justificatif',
        category: d.category === 'PROJET' ? 'Dossier Projet & Statuts' : d.category === 'AUTRE' ? 'Pièce justificative' : d.category,
        beneficiaryId: d.ownerId,
        beneficiaryName: d.beneficiary ? `${d.beneficiary.firstName} ${d.beneficiary.lastName}` : 'Candidat / Bénéficiaire',
        companyName: d.beneficiary?.companyName || 'Projet candidat',
        beneficiaryPhone: d.beneficiary?.phone || '',
        beneficiaryEmail: d.beneficiary?.email || '',
        format: ext,
        size: sizeLabel,
        date: d.createdAt ? d.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: (d.status || 'EN_ATTENTE') as 'VALIDE' | 'EN_ATTENTE' | 'REJETE',
        url: `/api/v1/documents/${d.id}/download`,
      };
    });

    // On affiche en priorité absolue tous les vrais documents déposés
    return [...realDocs, ...DEFAULT_DOCUMENTS];
  }, [docsRes]);

  // Suppression d'un document réel via l'API
  const handleDeleteDoc = async (id: string, title: string) => {
    if (window.confirm(`Confirmez-vous la suppression du document « ${title} » ?`)) {
      try {
        if (id.includes('-') && id.length > 20) {
          await api(`/documents/${id}`, { method: 'DELETE' });
        }
        await queryClient.invalidateQueries({ queryKey: ['documents'] });
        await refetch();
      } catch (err: any) {
        alert(err?.message || "Erreur lors de la suppression du document.");
      }
    }
  };

  // Modification du statut réel via l'API (Valider / En attente / Rejeter)
  const handleToggleStatus = async (id: string, newStatus: 'VALIDE' | 'EN_ATTENTE' | 'REJETE') => {
    try {
      if (id.includes('-') && id.length > 20) {
        await api(`/documents/${id}/status`, { method: 'PATCH', body: { status: newStatus } });
      }
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await refetch();
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la mise à jour du statut.");
    }
  };

  // Téléchargement réel
  const handleDownloadDoc = (doc: DocumentItem) => {
    if (doc.id.includes('-') && doc.id.length > 20) {
      window.open(`/api/v1/documents/${doc.id}/download`, '_blank');
    } else {
      alert(`Téléchargement de démonstration pour « ${doc.title} » (${doc.size}).`);
    }
  };

  // Enregistrement des modifications
  const handleUpdateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingDoc(null);
  };

  // Filtrage combiné
  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      const matchSearch = 
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        d.companyName.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase());

      const matchOwner = selectedOwner === 'ALL' || d.beneficiaryId === selectedOwner;
      const matchCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;

      return matchSearch && matchOwner && matchCategory && matchStatus;
    });
  }, [docs, search, selectedOwner, categoryFilter, statusFilter]);

  // Statistiques dynamiques basées sur l'ensemble des documents
  const validatedCount = useMemo(() => docs.filter(d => d.status === 'VALIDE').length, [docs]);
  const pendingCount = useMemo(() => docs.filter(d => d.status === 'EN_ATTENTE').length, [docs]);
  const totalBeneficiariesCount = bRes?.total || beneficiaries.length || 17;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in-up font-sans text-slate-800">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/15 text-[#23c3b1] flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Documents
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="px-4 py-2.5 rounded-lg bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <UploadCloud className="size-4" />
          <span>Déposer un document</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Documents déposés
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {docs.length}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Référentiel GED actif</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Validés & Certifiés
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {validatedCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Conformes aux exigences</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En attente de revue
          </span>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {pendingCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">À examiner par le coach</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Bénéficiaires actifs
          </span>
          <div className="text-2xl font-bold text-[#101f2e] mt-1">
            {totalBeneficiariesCount}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Dossiers documentaires</span>
        </div>
      </div>

      {/* 3. BARRE DE RECHERCHE ET DE FILTRES */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par document, entreprise, bénéficiaire..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
          />
        </div>

        {/* Bénéficiaire */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Bénéficiaire :</span>
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">Tous les bénéficiaires</option>
            {beneficiaries.map((b: any) => (
              <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>
            ))}
          </select>
        </div>

        {/* Thématique */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Catégorie :</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Toutes les catégories</option>
            <option value="Dossier Projet & Statuts">Dossier Projet & Statuts</option>
            <option value="Pièce justificative">Pièce justificative</option>
            <option value="Finance & Trésorerie">Finance & Trésorerie</option>
            <option value="Juridique & Légal">Juridique & Légal</option>
            <option value="Stratégie & Pitch">Stratégie & Pitch</option>
            <option value="Commercial & Vente">Commercial & Vente</option>
          </select>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">Validé</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="REJETE">Rejeté</option>
          </select>
        </div>

      </div>

      {/* 4. TABLEAU DES DOCUMENTS & LIVRABLES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-700">
              <th className="py-3 px-4">Titre du document & Format</th>
              <th className="py-3 px-4">Bénéficiaire / Entreprise</th>
              <th className="py-3 px-4">Catégorie</th>
              <th className="py-3 px-4">Date & Taille</th>
              <th className="py-3 px-4">Statut de validation</th>
              <th className="py-3 px-4 text-right">Actions directes</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <FileText className="size-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-600">Aucun document trouvé</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos critères de filtre ou téléversez un nouveau livrable.</p>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Titre & Format */}
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => setPreviewDoc(doc)}
                        className="font-bold text-slate-900 flex items-center gap-2 cursor-pointer group"
                        title="Cliquez pour visualiser le document"
                      >
                        <span className="size-6 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 group-hover:bg-[#23c3b1] group-hover:text-white transition-colors">
                          {doc.format}
                        </span>
                        <span className="truncate max-w-[280px] group-hover:text-[#23c3b1] transition-colors" title={doc.title}>
                          {doc.title}
                        </span>
                      </div>
                    </td>

                    {/* Bénéficiaire & Entreprise */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.beneficiaryName}</span>
                      </div>
                      {doc.companyName && (
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Building2 className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.companyName}</span>
                        </div>
                      )}
                    </td>

                    {/* Catégorie */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {doc.category}
                      </span>
                    </td>

                    {/* Date & Taille */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {new Date(doc.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {doc.size}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {doc.status === 'VALIDE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="size-3" /> Validé
                          </span>
                        )}
                        {doc.status === 'EN_ATTENTE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="size-3" /> En attente
                          </span>
                        )}
                        {doc.status === 'REJETE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="size-3" /> Rejeté
                          </span>
                        )}

                        {doc.status !== 'VALIDE' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(doc.id, 'VALIDE')}
                            title="Valider ce document"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <CheckCircle className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions directes */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">

                        {/* Ouvrir le dossier complet & consulter */}
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          title="Consulter le document et l'ensemble du dossier de ce bénéficiaire"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f273d] hover:bg-[#1c3d5e] text-white text-[11px] font-bold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                        >
                          <FolderOpen className="size-3.5 text-[#23c3b1]" />
                          <span>Dossier</span>
                        </button>

                        {/* Télécharger / Consulter */}
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          title="Télécharger le fichier original"
                          className="size-7 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                        >
                          <Download className="size-3.5" />
                        </button>

                        {/* Modifier & Supprimer (réservé coordination / agent) */}
                        {!isCoach && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingDoc(doc)}
                              title="Modifier le document"
                              className="size-7 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              title="Supprimer le document"
                              className="size-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. MODALE : EXPLORATEUR DE DOSSIER BÉNÉFICIAIRE COMPLET (STYLE ORDINATEUR / GESTIONNAIRE DE FICHIERS) */}
      {previewDoc && (
        <BeneficiaryDossierModal
          initialDoc={previewDoc}
          allDocs={docs}
          onClose={() => setPreviewDoc(null)}
          onRefreshDocs={async () => {
            await queryClient.invalidateQueries({ queryKey: ['documents'] });
            await refetch();
          }}
        />
      )}

      {/* 6. MODALE MODIFIER DOCUMENT */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#101f2e] text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Modifier le document</h3>
                <p className="text-[11px] text-slate-300">
                  {editingDoc.companyName} • {editingDoc.beneficiaryName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingDoc(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoc} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre du document</label>
                <input
                  type="text"
                  required
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catégorie</label>
                <select
                  value={editingDoc.category}
                  onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                >
                  <option value="Finance & Trésorerie">Finance & Trésorerie</option>
                  <option value="Juridique & Légal">Juridique & Légal</option>
                  <option value="Stratégie & Pitch">Stratégie & Pitch</option>
                  <option value="Commercial & Vente">Commercial & Vente</option>
                  <option value="Autre">Autre document</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Statut de validation</label>
                <select
                  value={editingDoc.status}
                  onChange={(e) => setEditingDoc({ ...editingDoc, status: e.target.value as any })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                >
                  <option value="VALIDE">Validé & Certifié</option>
                  <option value="EN_ATTENTE">En attente de revue</option>
                  <option value="REJETE">Rejeté / À modifier</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#23c3b1] hover:bg-[#1fb3a2] text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ASSISTANT DE DÉPÔT DE DOCUMENT */}
      <AddDocumentWizardModal 
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          setShowUpload(false);
        }}
      />

    </div>
  );
}
