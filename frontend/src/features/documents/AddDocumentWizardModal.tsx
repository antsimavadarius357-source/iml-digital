import { useState, useId, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBeneficiaryId?: string;
}

const DEFAULT_CATEGORIES = [
  'Business Plan / Modèle économique',
  'Statuts entreprise / RCCM / NIF',
  "Pièce d'identité (CNI / Passeport)",
  'Bilan & États financiers',
  'Attestation & Justificatif',
  'Étude de marché & Stratégie',
  'Devis, Contrats & Factures',
  'Diagnostic & Fiche cadrage',
  'Autre document'
];

export default function AddDocumentWizardModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultBeneficiaryId 
}: AddDocumentModalProps) {
  const queryClient = useQueryClient();
  const fileInputId = useId();

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(defaultBeneficiaryId || '');
  const [beneficiaryInput, setBeneficiaryInput] = useState<string>('');
  const [fileCategory, setFileCategory] = useState<string>('Business Plan / Modèle économique');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Charger la liste des bénéficiaires
  const { data: bRes, isLoading: loadingBeneficiaries } = useQuery({
    queryKey: ['beneficiaries-list-modal'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Initialiser le bénéficiaire sélectionné et le texte affiché
  useEffect(() => {
    if (defaultBeneficiaryId && beneficiaries.length > 0) {
      setSelectedBeneficiaryId(defaultBeneficiaryId);
      const b = beneficiaries.find((item: any) => item.id === defaultBeneficiaryId);
      if (b) {
        setBeneficiaryInput(`${b.firstName} ${b.lastName} (${b.fileNumber || 'IML'})`);
      }
    } else if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
      const first = beneficiaries[0];
      setSelectedBeneficiaryId(first.id);
      setBeneficiaryInput(`${first.firstName} ${first.lastName} (${first.fileNumber || 'IML'})`);
    }
  }, [defaultBeneficiaryId, beneficiaries]);

  const handleBeneficiaryInputChange = (val: string) => {
    setBeneficiaryInput(val);
    const lower = val.toLowerCase().trim();
    const found = beneficiaries.find((b: any) => {
      const full = `${b.firstName} ${b.lastName}`.toLowerCase();
      const code = (b.fileNumber || '').toLowerCase();
      const comp = (b.companyName || '').toLowerCase();
      return full === lower || `${full} (${code})` === lower || `${full} (${code}) - ${comp}` === lower || b.id === val;
    }) || beneficiaries.find((b: any) => {
      const full = `${b.firstName} ${b.lastName}`.toLowerCase();
      const code = (b.fileNumber || '').toLowerCase();
      return full.includes(lower) || (code && code.includes(lower));
    });

    if (found) {
      setSelectedBeneficiaryId(found.id);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setFileTitle('');
    setFileCategory('Business Plan / Modèle économique');
    setErrorMessage(null);
    setIsDragging(false);
    if (!defaultBeneficiaryId && beneficiaries.length > 0) {
      setSelectedBeneficiaryId(beneficiaries[0].id);
      setBeneficiaryInput(`${beneficiaries[0].firstName} ${beneficiaries[0].lastName} (${beneficiaries[0].fileNumber || 'IML'})`);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setUploadedFile(file);
    setErrorMessage(null);
    if (!fileTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setFileTitle(cleanName);
    }
  };

  // Mutation d'upload direct
  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!selectedBeneficiaryId) {
        throw new Error('Veuillez sélectionner un bénéficiaire valide.');
      }
      if (!uploadedFile) {
        throw new Error('Veuillez choisir un fichier à téléverser.');
      }
      if (!fileTitle.trim()) {
        throw new Error('Veuillez renseigner un titre pour le document.');
      }

      const fd = new FormData();
      fd.append('ownerType', 'BENEFICIARY');
      fd.append('ownerId', selectedBeneficiaryId);
      fd.append('title', fileTitle.trim());
      fd.append('category', fileCategory || 'AUTRE');
      fd.append('file', uploadedFile);

      const res = await fetch('/api/v1/documents', {
        method: 'POST',
        body: fd,
        credentials: 'include',
        headers: { 'X-Requested-With': 'iml-digital' }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || err?.message || "Erreur lors de l'enregistrement du document");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiary'] });
      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Une erreur est survenue.');
    }
  });

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const currentBeneficiaryObj = beneficiaries.find((b: any) => b.id === selectedBeneficiaryId);

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 flex justify-center items-center transition-opacity animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col text-slate-800 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête compact */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shrink-0">
              <FileCheck className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Ajouter un document
              </h2>
              <p className="text-[11px] text-slate-500">
                Rattachez directement une pièce justificative au dossier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="size-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corps du formulaire compact */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            uploadMut.mutate();
          }} 
          className="p-4 sm:p-5 space-y-3 text-xs"
        >
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] flex items-center gap-2">
              <AlertCircle className="size-3.5 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grille 2 colonnes pour Bénéficiaire & Catégorie avec saisie libre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Bénéficiaire rattaché avec saisie / recherche */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Bénéficiaire rattaché <span className="text-rose-500">*</span>
                </label>
                {currentBeneficiaryObj && (
                  <span className="text-[10px] text-emerald-600 font-bold truncate max-w-[120px]">
                    ✓ Identifié
                  </span>
                )}
              </div>
              {loadingBeneficiaries ? (
                <div className="h-8.5 bg-slate-50 border border-slate-200 rounded-lg animate-pulse flex items-center px-3 text-[11px] text-slate-400">
                  Chargement...
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="beneficiaries-modal-list"
                    value={beneficiaryInput}
                    onChange={(e) => handleBeneficiaryInputChange(e.target.value)}
                    placeholder="Tapez un nom ou sélectionnez..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs"
                  />
                  <datalist id="beneficiaries-modal-list">
                    {beneficiaries.map((b: any) => (
                      <option 
                        key={b.id} 
                        value={`${b.firstName} ${b.lastName} (${b.fileNumber || 'IML'}) - ${b.companyName || 'Projet'}`} 
                      />
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            {/* 2. Catégorie du document avec saisie libre */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Catégorie du document <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Saisie libre</span>
              </div>
              <input
                type="text"
                required
                list="document-categories-modal-list"
                value={fileCategory}
                onChange={(e) => setFileCategory(e.target.value)}
                placeholder="Ex: Statuts, CNI, Business Plan..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs"
              />
              <datalist id="document-categories-modal-list">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 3. Fichier téléversé (Zone de dépôt compacte) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Fichier <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              id={fileInputId}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />

            {!uploadedFile ? (
              <label
                htmlFor={fileInputId}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileChange(f);
                }}
                className={`border-2 border-dashed rounded-xl py-3 px-4 flex items-center justify-between gap-3 text-left cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-lg bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <UploadCloud className="size-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      Cliquez pour parcourir ou glissez un fichier ici
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PDF, DOCX, XLSX, JPG, PNG (Max. 15 Mo)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 shrink-0 transition-colors">
                  Parcourir
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div className="truncate text-left">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    htmlFor={fileInputId}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md cursor-pointer transition-colors"
                  >
                    Changer
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setFileTitle('');
                    }}
                    className="size-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Titre / Intitulé du document avec saisie libre */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Intitulé du document <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              placeholder="Ex : Business Plan validé 2026, Statuts notariés, CNI recto-verso..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white hover:border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all shadow-2xs placeholder-slate-400"
            />
          </div>

          {/* Boutons d'action compacts */}
          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploadMut.isPending}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploadMut.isPending || !uploadedFile || !fileTitle.trim() || !selectedBeneficiaryId}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploadMut.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Déposer le document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
