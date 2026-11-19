import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  FileText, 
  Folder, 
  FolderOpen, 
  Search, 
  Building2, 
  User
} from 'lucide-react';
import { api } from '../../lib/api';

export interface DocumentItem {
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

interface BeneficiaryDossierModalProps {
  initialDoc: DocumentItem;
  allDocs: DocumentItem[];
  onClose: () => void;
  onRefreshDocs?: () => void;
}

export default function BeneficiaryDossierModal({
  initialDoc,
  allDocs,
  onClose,
  onRefreshDocs
}: BeneficiaryDossierModalProps) {
  // L'ensemble des documents appartenant à ce bénéficiaire (dossier d'ordinateur)
  const folderDocs = useMemo(() => {
    const list = allDocs.filter(d => 
      (d.beneficiaryId && d.beneficiaryId === initialDoc.beneficiaryId) ||
      (d.beneficiaryName && initialDoc.beneficiaryName && d.beneficiaryName.toLowerCase() === initialDoc.beneficiaryName.toLowerCase())
    );
    // S'assurer que le document cliqué est présent au moins une fois
    if (!list.some(d => d.id === initialDoc.id)) {
      list.unshift(initialDoc);
    }
    return list;
  }, [allDocs, initialDoc]);

  // Fichier actuellement sélectionné dans le dossier
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDoc.id);
  const activeDoc = useMemo(() => {
    return folderDocs.find(d => d.id === selectedDocId) || folderDocs[0] || initialDoc;
  }, [folderDocs, selectedDocId, initialDoc]);

  // Recherche dans les fichiers du dossier
  const [fileSearch, setFileSearch] = useState('');
  const filteredFolderDocs = useMemo(() => {
    if (!fileSearch.trim()) return folderDocs;
    const q = fileSearch.toLowerCase();
    return folderDocs.filter(d => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || d.format.toLowerCase().includes(q));
  }, [folderDocs, fileSearch]);

  // État de chargement de l'aperçu réel
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    previewType: 'html' | 'pdf' | 'image' | 'text' | 'unsupported';
    title?: string;
    category?: string;
    html?: string;
    url?: string;
    content?: string;
    downloadUrl?: string;
    message?: string;
  } | null>(null);

  // Cache frontend : évite de re-fetcher un document déjà consulté dans la même session modale
  const previewCacheRef = useRef<Map<string, typeof previewData>>(new Map());

  // Chargement du VRAI aperçu à chaque changement de document sélectionné
  useEffect(() => {
    let isMounted = true;

    async function loadRealPreview() {
      if (!activeDoc) return;

      const docId = activeDoc.id;
      const isRealDoc = docId && docId.includes('-') && docId.length > 20;

      if (!isRealDoc) {
        // Document de démonstration / modèle officiel
        setPreviewData({
          previewType: 'unsupported',
          title: activeDoc.title,
          message: `Document de référence « ${activeDoc.title} » (${activeDoc.size}). Fichier indexé au dossier national IML.`,
          downloadUrl: `/api/v1/documents/${docId}/download`
        });
        setIsLoadingPreview(false);
        return;
      }

      // Vérifier le cache frontend avant tout appel réseau
      if (previewCacheRef.current.has(docId)) {
        if (isMounted) {
          setPreviewData(previewCacheRef.current.get(docId)!);
          setIsLoadingPreview(false);
        }
        return;
      }

      // Pour PDF et images : on peut déduire le type directement → pas d'appel API
      const ext = (activeDoc.format || '').toLowerCase();
      if (ext === 'pdf') {
        const data = {
          previewType: 'pdf' as const,
          title: activeDoc.title,
          url: `/api/v1/documents/${docId}/download?inline=1`,
          downloadUrl: `/api/v1/documents/${docId}/download`
        };
        previewCacheRef.current.set(docId, data);
        if (isMounted) { setPreviewData(data); setIsLoadingPreview(false); }
        return;
      }
      if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
        const data = {
          previewType: 'image' as const,
          title: activeDoc.title,
          url: `/api/v1/documents/${docId}/download?inline=1`,
          downloadUrl: `/api/v1/documents/${docId}/download`
        };
        previewCacheRef.current.set(docId, data);
        if (isMounted) { setPreviewData(data); setIsLoadingPreview(false); }
        return;
      }

      setIsLoadingPreview(true);
      setPreviewData(null);

      try {
        const res = await api<any>(`/documents/${docId}/preview`);
        if (isMounted) {
          previewCacheRef.current.set(docId, res);
          setPreviewData(res);
        }
      } catch (err: any) {
        console.warn('Erreur aperçu API, bascule sur aperçu direct:', err);
        if (isMounted) {
          const fallback = {
            previewType: 'unsupported' as const,
            title: activeDoc.title,
            message: "Aperçu en cours de traitement. Vous pouvez télécharger le fichier pour le consulter.",
            downloadUrl: `/api/v1/documents/${docId}/download`
          };
          previewCacheRef.current.set(docId, fallback);
          setPreviewData(fallback);
        }
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    }

    loadRealPreview();

    return () => {
      isMounted = false;
    };
  }, [activeDoc]);

  // Télécharger le document actif
  const handleDownloadActive = () => {
    if (activeDoc.id && activeDoc.id.includes('-') && activeDoc.id.length > 20) {
      window.open(`/api/v1/documents/${activeDoc.id}/download`, '_blank');
    } else {
      alert(`Téléchargement de « ${activeDoc.title} » (${activeDoc.size}).`);
    }
  };

  // Basculer le statut du document (Valider / En attente)
  const handleToggleStatus = async (docId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'VALIDE' ? 'EN_ATTENTE' : 'VALIDE';
    try {
      if (docId.includes('-') && docId.length > 20) {
        await api(`/documents/${docId}/status`, {
          method: 'PATCH',
          body: { status: nextStatus }
        });
        if (onRefreshDocs) onRefreshDocs();
      }
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la modification du statut.");
    }
  };

  // Icône couleur selon le format
  const getFormatBadge = (fmt: string) => {
    const f = (fmt || '').toUpperCase();
    if (f.includes('DOC') || f.includes('WORD')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-600 text-white shadow-2xs">
          DOCX
        </span>
      );
    }
    if (f.includes('PDF')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-600 text-white shadow-2xs">
          PDF
        </span>
      );
    }
    if (f.includes('XLS') || f.includes('SHEET')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-600 text-white shadow-2xs">
          XLSX
        </span>
      );
    }
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(f)) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-600 text-white shadow-2xs">
          IMG
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-600 text-white shadow-2xs">
        {f || 'FILE'}
      </span>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-6xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 flex flex-col h-[94vh] max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            1. BARRE DE TITRE SYSTÈME (STYLE EXPLORATEUR DE FICHIERS / WINDOWS / MAC)
           ===================================================================== */}
        <div className="py-2.5 px-5 bg-[#0f273d] text-white flex items-center justify-between border-b border-slate-700/60 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Nom du bénéficiaire uniquement */}
            <span className="font-bold text-white flex items-center gap-1.5 text-sm">
              <FolderOpen className="size-4 text-[#23c3b1] shrink-0" />
              {activeDoc.beneficiaryName || 'Bénéficiaire'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="size-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer le dossier (Échap)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. BANDEAU D'INFORMATION DU BÉNÉFICIAIRE & ACTIONS RAPIDES DU DOSSIER
           ===================================================================== */}
        <div className="py-2.5 px-5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-teal-100 text-[#0f766e] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-teal-200">
              {(activeDoc.beneficiaryName || 'IM').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm">
                  {activeDoc.beneficiaryName}
                </h2>
                {activeDoc.companyName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200/80 text-slate-800 border border-slate-300/80">
                    <Building2 className="size-3 text-slate-500" />
                    <span>{activeDoc.companyName}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                {activeDoc.beneficiaryPhone && (
                  <span>Tél : {activeDoc.beneficiaryPhone}</span>
                )}
                {activeDoc.beneficiaryEmail && (
                  <span>• {activeDoc.beneficiaryEmail}</span>
                )}
                <span className="text-teal-700 font-semibold">• Espace documentaire sécurisé IML</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lien direct fiche bénéficiaire */}
            {activeDoc.beneficiaryId && (
              <Link
                to={`/beneficiaires/${activeDoc.beneficiaryId}`}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Consulter la fiche complète du bénéficiaire"
              >
                <User className="size-3.5 text-slate-500" />
                <span>Fiche complète</span>
              </Link>
            )}
          </div>
        </div>

        {/* =====================================================================
            3. DOUBLE VOLET : EXPLORATEUR DE FICHIERS (GAUCHE) & VISIONNEUSE RÉELLE (DROITE)
           ===================================================================== */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-100/70">
          
          {/* ===================================================================
              VOLET GAUCHE : L'ENSEMBLE DES DOCUMENTS TÉLÉVERSÉS (STYLE DOSSIER PC)
             =================================================================== */}
          <div className="w-full md:w-[360px] lg:w-[380px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
            
            {/* En-tête de la liste des fichiers */}
            <div className="p-3 border-b border-slate-200/90 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Folder className="size-4 text-amber-500" />
                  <span>Fichiers téléversés</span>
                  <span className="size-5 rounded-full bg-teal-100 text-[#0f766e] text-[10px] font-bold flex items-center justify-center">
                    {folderDocs.length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Cliquez pour ouvrir</span>
              </div>

              {/* Champ de recherche rapide interne au dossier */}
              <div className="relative">
                <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Filtrer dans ce dossier..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#23c3b1]"
                />
              </div>
            </div>

            {/* Liste de tous les fichiers du dossier */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100">
              {filteredFolderDocs.length === 0 ? (
                <div className="py-12 px-4 text-center text-slate-400 space-y-2">
                  <Folder className="size-10 text-slate-300 mx-auto stroke-[1.5]" />
                  <p className="font-medium text-xs text-slate-600">Aucun document dans ce dossier</p>
                  <p className="text-[11px] text-slate-400">
                    Utilisez le bouton « Ajouter un document » pour enrichir ce dossier.
                  </p>
                </div>
              ) : (
                filteredFolderDocs.map((doc, idx) => {
                  const isSelected = doc.id === activeDoc.id;
                  const ext = (doc.format || 'DOC').toUpperCase();

                  return (
                    <div
                      key={doc.id || idx}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex items-start gap-2.5 ${
                        isSelected 
                          ? 'bg-teal-50/70 border-teal-400 shadow-2xs ring-1 ring-teal-300' 
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {/* Badge / Format */}
                      <div className="mt-0.5 shrink-0">
                        {getFormatBadge(ext)}
                      </div>

                      {/* Infos fichier */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 
                            className={`font-bold text-xs truncate leading-snug ${
                              isSelected ? 'text-[#0f766e]' : 'text-slate-800 group-hover:text-slate-900'
                            }`}
                            title={doc.title}
                          >
                            {doc.title}
                          </h4>
                          {isSelected && (
                            <span className="size-2 rounded-full bg-[#23c3b1] shrink-0 mt-1" title="Fichier actuellement ouvert" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-1 flex-wrap">
                          <span className="font-semibold text-slate-600">{doc.category}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{new Date(doc.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 mt-1.5 pt-1 border-t border-slate-100">
                          {/* Statut du document */}
                          {doc.status === 'VALIDE' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <CheckCircle className="size-2.5" /> Validé
                            </span>
                          ) : doc.status === 'REJETE' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              <XCircle className="size-2.5" /> Rejeté
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              <AlertCircle className="size-2.5" /> En attente
                            </span>
                          )}

                          {/* Action rapide télécharger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (doc.id.includes('-') && doc.id.length > 20) {
                                window.open(`/api/v1/documents/${doc.id}/download`, '_blank');
                              } else {
                                alert(`Téléchargement de « ${doc.title} »`);
                              }
                            }}
                            className="size-6 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                            title="Télécharger ce fichier directement"
                          >
                            <Download className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ===================================================================
              VOLET DROIT : LECTEUR & VISIONNEUSE RÉELLE DU DOCUMENT ACTIF
             =================================================================== */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100/70">
            
            {/* Barre d'outils du document sélectionné */}
            <div className="py-2.5 px-5 bg-white border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {getFormatBadge(activeDoc.format)}
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-md" title={activeDoc.title}>
                    {activeDoc.title}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{activeDoc.category}</span>
                    <span>•</span>
                    <span>{activeDoc.size}</span>
                    <span>•</span>
                    <span>Déposé le {new Date(activeDoc.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Boutons d'action sur le fichier sélectionné */}
              <div className="flex items-center gap-1.5">
                {/* Valider / Mettre en attente */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(activeDoc.id, activeDoc.status)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                    activeDoc.status === 'VALIDE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  }`}
                  title="Cliquer pour basculer la conformité du document"
                >
                  {activeDoc.status === 'VALIDE' ? (
                    <>
                      <CheckCircle className="size-3.5 text-emerald-600" />
                      <span>Validé & Conforme</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-3.5 text-amber-600" />
                      <span>En attente de validation</span>
                    </>
                  )}
                </button>

                {/* Télécharger */}
                <button
                  type="button"
                  onClick={handleDownloadActive}
                  className="px-3 py-1.5 rounded-lg bg-[#23c3b1] hover:bg-[#1db09f] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Télécharger une copie du fichier original sur votre ordinateur"
                >
                  <Download className="size-3.5" />
                  <span>Télécharger</span>
                </button>

                {/* Imprimer */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  title="Imprimer ce document"
                >
                  <Printer className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Zone de lecture réelle du document */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isLoadingPreview ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Loader2 className="size-8 animate-spin text-[#23c3b1]" />
                  <span className="text-xs font-semibold">Chargement du document...</span>
                </div>
              ) : previewData?.previewType === 'html' ? (
                /* CONTENU RÉEL D'UN DOCUMENT WORD (CONVERTI PAR MAMMOTH DEPUIS LE FICHIER DOCX UPLOADÉ) */
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-10 max-w-3xl mx-auto space-y-4">
                  <div className="pb-3 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Document Word authentique • {activeDoc.title}</span>
                    <span className="text-emerald-600 font-bold">✓ Indexé & Décrypté</span>
                  </div>

                  <div 
                    className="prose prose-slate max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed [&_p]:mb-2.5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:border-b [&_h1]:pb-1 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-50 [&_strong]:text-slate-900"
                    dangerouslySetInnerHTML={{ __html: previewData.html || '' }}
                  />
                </div>
              ) : previewData?.previewType === 'pdf' ? (
                /* CONTENU RÉEL D'UN FICHIER PDF INTÉGRÉ */
                <div className="h-full min-h-[500px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                  <iframe
                    src={previewData.url}
                    className="w-full h-full min-h-[65vh] border-0"
                    title={activeDoc.title}
                  />
                </div>
              ) : previewData?.previewType === 'image' ? (
                /* AFFICHAGE RÉEL D'UNE IMAGE */
                <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-md border border-slate-200 max-w-3xl mx-auto">
                  <img
                    src={previewData.url}
                    alt={activeDoc.title}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-xs"
                  />
                </div>
              ) : previewData?.previewType === 'text' ? (
                /* CONTENU TEXTE BRUT */
                <div className="bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-xs overflow-auto max-h-[70vh] whitespace-pre-wrap shadow-md">
                  {previewData.content}
                </div>
              ) : (
                /* FICHIER NON AFFICHABLE DIRECTEMENT (TABLEUR EXCEL, ARCHIVE OU DÉMONSTRATION) */
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 max-w-xl mx-auto text-center space-y-4 my-8">
                  <div className="size-16 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] flex items-center justify-center mx-auto shadow-2xs">
                    <FileText className="size-8" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {activeDoc.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Format {activeDoc.format} • {activeDoc.size} • Fichier archivé au dossier IML
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    Ce fichier est conservé en toute intégrité dans le dossier du bénéficiaire. Cliquez ci-dessous pour le télécharger ou l'ouvrir avec votre application dédiée.
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadActive}
                      className="px-4 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1db09f] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="size-4" />
                      <span>Télécharger le fichier original</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pied de page de navigation entre documents */}
            <div className="py-2.5 px-5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Dossier :</span>
                <span>{activeDoc.beneficiaryName}</span>
                <span>•</span>
                <span>{folderDocs.indexOf(activeDoc) + 1} sur {folderDocs.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer le dossier
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
