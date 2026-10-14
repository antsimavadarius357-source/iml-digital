import { useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FileText, 
  Send, 
  PenTool, 
  BookOpen, 
  Monitor, 
  Upload, 
  Search, 
  Check, 
  Loader2,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface AddDocumentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Modèles prédéfinis de documents
const DOCUMENT_TEMPLATES = [
  { id: 'convention-accompagnement', name: "Convention d'accompagnement & incubation", category: 'CONVENTION', desc: 'Contrat définissant les engagements du porteur et de la structure.' },
  { id: 'diagnostic-initial', name: 'Grille de diagnostic initial & cadrage', category: 'DIAGNOSTIC', desc: 'Évaluation 360° du profil porteur et du degré de maturité.' },
  { id: 'bilan-mi-parcours', name: "Bilan d'étape & revue mi-parcours", category: 'BILAN', desc: 'Point de situation sur les jalons atteints et les ajustements.' },
  { id: 'plan-action-pap', name: "Plan d'action personnalisé (PAP)", category: 'PLAN_ACTION', desc: 'Feuille de route opérationnelle avec livrables datés.' },
  { id: 'attestation-fin', name: 'Attestation de fin de parcours incubation', category: 'ATTESTATION', desc: 'Certificat officiel attestant de la finalisation du programme.' },
  { id: 'accord-confidentialite', name: 'Accord de confidentialité & engagement', category: 'JURIDIQUE', desc: 'Protection des éléments de propriété intellectuelle du projet.' },
];

export default function AddDocumentWizardModal({ isOpen, onClose, onSuccess }: AddDocumentWizardModalProps) {
  const queryClient = useQueryClient();
  const fileInputId = useId();

  // Étape courante (1 à 5)
  const [step, setStep] = useState<number>(1);

  // Étape 1 : Que voulez-vous faire ? ('upload' | 'send' | 'sign')
  const [actionType, setActionType] = useState<'upload' | 'send' | 'sign'>('upload');

  // Étape 2 : Souhaitez-vous ajouter... ('template' | 'computer')
  const [sourceType, setSourceType] = useState<'template' | 'computer'>('template');

  // Étape 3 : Modèle choisi OU Fichier uploadé
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof DOCUMENT_TEMPLATES[0] | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  
  // Si fichier depuis ordinateur
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [fileCategory, setFileCategory] = useState<string>('BUSINESS_PLAN');

  // Étape 4 : Destinataires
  const [recipientType, setRecipientType] = useState<'beneficiaires' | 'groupes' | 'contact'>('beneficiaires');
  const [recipientSearch, setRecipientSearch] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; name: string; type: string }[]>([]);

  // Étape 5 : Message & options
  const [customMessage, setCustomMessage] = useState<string>('');
  const [notifyByEmail, setNotifyByEmail] = useState<boolean>(true);

  // Récupération des bénéficiaires existants
  const { data: bRes } = useQuery({
    queryKey: ['beneficiaries-list'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Mutation pour sauvegarder le document
  const uploadMut = useMutation({
    mutationFn: async () => {
      if (selectedRecipients.length === 0) return;
      const ownerId = selectedRecipients[0].id;

      const fd = new FormData();
      fd.append('ownerType', 'BENEFICIARY');
      fd.append('ownerId', ownerId);

      if (sourceType === 'computer' && uploadedFile) {
        fd.append('title', fileTitle || uploadedFile.name);
        fd.append('category', fileCategory);
        fd.append('file', uploadedFile);
      } else {
        const title = selectedTemplate ? selectedTemplate.name : 'Document généré';
        fd.append('title', title);
        fd.append('category', selectedTemplate?.category || 'AUTRE');
        // Fichier texte/PDF simulé pour le modèle
        const dummyBlob = new Blob([`Modèle : ${title}\nDestinataire : ${selectedRecipients[0].name}\nMessage : ${customMessage}`], { type: 'text/plain' });
        fd.append('file', dummyBlob, `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`);
      }

      const res = await fetch('http://localhost:4000/api/v1/documents', {
        method: 'POST',
        body: fd,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'X-Requested-With': 'iml-digital'
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur lors de l'enregistrement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
      onSuccess?.();
      handleClose();
    }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setSelectedTemplate(null);
    setUploadedFile(null);
    setFileTitle('');
    setSelectedRecipients([]);
    setTemplateSearch('');
    setRecipientSearch('');
    onClose();
  };

  // Filtrage des modèles
  const filteredTemplates = DOCUMENT_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
    t.desc.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Filtrage des destinataires selon la recherche
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const fullName = `${b.firstName} ${b.lastName}`.toLowerCase();
    return fullName.includes(recipientSearch.toLowerCase()) || b.fileNumber?.toLowerCase().includes(recipientSearch.toLowerCase());
  });

  const handleSelectRecipient = (recipient: { id: string; name: string; type: string }) => {
    if (!selectedRecipients.some(r => r.id === recipient.id)) {
      setSelectedRecipients(prev => [...prev, recipient]);
    }
    setRecipientSearch('');
  };

  const handleRemoveRecipient = (id: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== id));
  };

  // Validation d'étape pour pouvoir avancer
  const canProceed = () => {
    if (step === 1) return !!actionType;
    if (step === 2) return !!sourceType;
    if (step === 3) {
      if (sourceType === 'template') return !!selectedTemplate;
      if (sourceType === 'computer') return !!uploadedFile && fileTitle.trim().length > 0;
    }
    if (step === 4) return selectedRecipients.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      uploadMut.mutate();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/55 backdrop-blur-[2px] p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col animate-in zoom-in-95 duration-200 text-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =======================================================================
            EN-TÊTE FIXE ET PARFAITEMENT VISIBLE : Grand titre net + Croix
           ======================================================================= */}
        <div className="relative pt-6 pb-4 px-8 text-center bg-white border-b border-slate-100 rounded-t-2xl shrink-0">
          <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
            Ajouter un document
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* =======================================================================
            CORPS DU WIZARD : 5 ÉTAPES AVEC DÉFILEMENT INTERNE SÉCURISÉ
           ======================================================================= */}
        <div className="px-6 sm:px-10 py-5 max-h-[55vh] overflow-y-auto bg-gradient-to-b from-rose-50/20 via-white to-white flex flex-col justify-start">

          {/* ===================================================================
              ÉTAPE 1 : Que voulez-vous faire ? *
             =================================================================== */}
          {step === 1 && (
            <div className="w-full space-y-6 animate-in fade-in duration-200">
              <h3 className="text-base sm:text-lg font-medium text-slate-800 text-center">
                Que voulez-vous faire ? <span className="text-[#f06553]">*</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 pt-2">
                {/* 1. Charger le document */}
                <div
                  onClick={() => setActionType('upload')}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                    actionType === 'upload'
                      ? 'border-[#23c3b1] bg-white ring-2 ring-[#23c3b1]/20 shadow-md'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="size-12 rounded-lg bg-[#23c3b1]/10 text-[#23c3b1] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <FileText className="size-6 stroke-[1.75]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">
                    Charger le document
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Chargez un ou plusieurs documents sur la fiche d’un ou plusieurs accompagnés.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                    Les documents chargés en interne ne sont pas visibles par les accompagnés
                  </p>
                </div>

                {/* 2. Envoyer le document */}
                <div
                  onClick={() => setActionType('send')}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                    actionType === 'send'
                      ? 'border-[#23c3b1] bg-white ring-2 ring-[#23c3b1]/20 shadow-md'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="size-12 rounded-lg bg-[#23c3b1]/10 text-[#23c3b1] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <Send className="size-6 stroke-[1.75]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">
                    Envoyer le document
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Partagez un ou plusieurs documents à un ou des destinataires
                  </p>
                  <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                    Si le document est partagé à un bénéficiaire, celui-ci y aura accès via son portail.
                  </p>
                </div>

                {/* 3. Faire signer le document */}
                <div
                  onClick={() => setActionType('sign')}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                    actionType === 'sign'
                      ? 'border-[#23c3b1] bg-white ring-2 ring-[#23c3b1]/20 shadow-md'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Badge Crédits disponibles: 5 */}
                  <div className="absolute -top-3 right-4 bg-[#8b3ea8] text-white text-[10.5px] font-semibold px-3 py-0.5 rounded-full shadow-2xs">
                    Crédits disponibles: 5
                  </div>

                  <div className="size-12 rounded-lg bg-[#23c3b1]/10 text-[#23c3b1] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <PenTool className="size-6 stroke-[1.75]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2">
                    Faire signer le document
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Envoyez pour signature un ou plusieurs documents à un ou plusieurs signataires.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                    Si le document est partagé à un bénéficiaire, celui-ci y aura accès via son portail.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ÉTAPE 2 : Souhaitez-vous ajouter... *
             =================================================================== */}
          {step === 2 && (
            <div className="w-full space-y-6 animate-in fade-in duration-200">
              <h3 className="text-base sm:text-lg font-medium text-slate-800 text-center">
                Souhaitez-vous ajouter... <span className="text-[#f06553]">*</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto pt-2">
                {/* 1. Un modèle de document (Turquoise quand sélectionné) */}
                <div
                  onClick={() => setSourceType('template')}
                  className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                    sourceType === 'template'
                      ? 'bg-[#23c3b1] text-white border-[#23c3b1] shadow-md'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className={`size-14 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${
                    sourceType === 'template' ? 'text-white' : 'text-[#23c3b1] bg-[#23c3b1]/10'
                  }`}>
                    <BookOpen className="size-7 stroke-[1.75]" />
                  </div>
                  <h4 className="text-base font-bold mb-2">
                    Un modèle de document
                  </h4>
                  <p className={`text-xs leading-relaxed ${sourceType === 'template' ? 'text-white/90' : 'text-slate-500'}`}>
                    Sélectionnez un modèle de document et éditez le.
                  </p>
                </div>

                {/* 2. Un document depuis votre ordinateur */}
                <div
                  onClick={() => setSourceType('computer')}
                  className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                    sourceType === 'computer'
                      ? 'bg-[#23c3b1] text-white border-[#23c3b1] shadow-md'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className={`size-14 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${
                    sourceType === 'computer' ? 'text-white' : 'text-[#23c3b1] bg-[#23c3b1]/10'
                  }`}>
                    <Monitor className="size-7 stroke-[1.75]" />
                  </div>
                  <h4 className="text-base font-bold mb-2">
                    Un document depuis votre ordinateur
                  </h4>
                  <p className={`text-xs leading-relaxed ${sourceType === 'computer' ? 'text-white/90' : 'text-slate-500'}`}>
                    La taille maximale d’un document est 15 mb.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ÉTAPE 3 : Choix du modèle OU Upload depuis l'ordinateur
             =================================================================== */}
          {step === 3 && (
            <div className="w-full space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto">
              {sourceType === 'template' ? (
                <>
                  <h3 className="text-base sm:text-lg font-medium text-slate-800 text-center">
                    Sélectionnez un modèle de document <span className="text-[#f06553]">*</span>
                  </h3>

                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => {
                          setTemplateSearch(e.target.value);
                          setIsTemplateDropdownOpen(true);
                        }}
                        onFocus={() => setIsTemplateDropdownOpen(true)}
                        placeholder="Rechercher ou sélectionner un modèle..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] shadow-2xs"
                      />
                    </div>

                    {/* Liste déroulante des modèles ou "Aucune donnée" comme sur la capture */}
                    {isTemplateDropdownOpen && (
                      <div className="mt-1.5 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-20 max-h-56 overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 select-none">
                            Aucune donnée
                          </div>
                        ) : (
                          filteredTemplates.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => {
                                setSelectedTemplate(t);
                                setTemplateSearch(t.name);
                                setIsTemplateDropdownOpen(false);
                              }}
                              className={`px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-0 ${
                                selectedTemplate?.id === t.id ? 'bg-[#23c3b1]/10 font-semibold text-[#23c3b1]' : ''
                              }`}
                            >
                              <div>
                                <div className="font-medium text-slate-800">{t.name}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                              </div>
                              {selectedTemplate?.id === t.id && (
                                <Check className="size-4 text-[#23c3b1]" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedTemplate && (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <FileCheck className="size-4 shrink-0 text-emerald-600" />
                      <span>Modèle sélectionné : <strong>{selectedTemplate.name}</strong></span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-base sm:text-lg font-medium text-slate-800 text-center">
                    Sélectionnez votre fichier <span className="text-[#f06553]">*</span>
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Titre du document <span className="text-[#f06553]">*</span>
                      </label>
                      <input
                        type="text"
                        value={fileTitle}
                        onChange={(e) => setFileTitle(e.target.value)}
                        placeholder="Ex : Business Plan 2026, Pièce d'identité..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Catégorie
                      </label>
                      <select
                        value={fileCategory}
                        onChange={(e) => setFileCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] bg-white"
                      >
                        <option value="BUSINESS_PLAN">Business Plan</option>
                        <option value="ID_CARD">Pièce d'identité</option>
                        <option value="STATUTS">Statuts entreprise</option>
                        <option value="ATTESTATION">Attestation</option>
                        <option value="AUTRE">Autre document</option>
                      </select>
                    </div>

                    {/* Zone de glisser-déposer */}
                    <div>
                      <input 
                        type="file" 
                        id={fileInputId}
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setUploadedFile(f);
                            if (!fileTitle) setFileTitle(f.name.replace(/\.[^/.]+$/, ''));
                          }
                        }}
                      />
                      <label
                        htmlFor={fileInputId}
                        className="border-2 border-dashed border-slate-300 hover:border-[#23c3b1] rounded-xl p-6 flex flex-col items-center text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="size-8 text-[#23c3b1] mb-2" />
                        <span className="text-xs font-semibold text-slate-700">
                          {uploadedFile ? uploadedFile.name : "Cliquez ou glissez votre document ici"}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          PDF, DOCX, PNG, JPG (max 15 MB)
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===================================================================
              ÉTAPE 4 : Destinataires (À qui souhaitez-vous lier ce document ?)
             =================================================================== */}
          {step === 4 && (
            <div className="w-full space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto">
              <h3 className="text-base sm:text-lg font-medium text-slate-800 text-center">
                À qui souhaitez-vous lier ce document ?
              </h3>

              <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
                {/* Choix Destinataires * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2.5">
                    Destinataires <span className="text-[#f06553]">*</span> :
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        checked={recipientType === 'beneficiaires'}
                        onChange={() => setRecipientType('beneficiaires')}
                        className="text-[#23c3b1] focus:ring-[#23c3b1] size-4 accent-[#23c3b1]"
                      />
                      <span className={recipientType === 'beneficiaires' ? 'text-[#23c3b1] font-semibold' : ''}>
                        Un ou des bénéficiaires
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        checked={recipientType === 'groupes'}
                        onChange={() => setRecipientType('groupes')}
                        className="text-[#23c3b1] focus:ring-[#23c3b1] size-4 accent-[#23c3b1]"
                      />
                      <span className={recipientType === 'groupes' ? 'text-[#23c3b1] font-semibold' : ''}>
                        Un ou des groupes
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="recipientType"
                        checked={recipientType === 'contact'}
                        onChange={() => setRecipientType('contact')}
                        className="text-[#23c3b1] focus:ring-[#23c3b1] size-4 accent-[#23c3b1]"
                      />
                      <span className={recipientType === 'contact' ? 'text-[#23c3b1] font-semibold' : ''}>
                        Un contact
                      </span>
                    </label>
                  </div>
                </div>

                {/* Champ Rechercher avec autocomplétion */}
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Rechercher"
                      className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] bg-white placeholder-slate-400"
                    />
                    <Search className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Suggestions de recherche si l'utilisateur tape quelque chose */}
                  {recipientSearch.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-30 max-h-40 overflow-y-auto">
                      {filteredBeneficiaries.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">Aucun résultat</div>
                      ) : (
                        filteredBeneficiaries.map((b: any) => (
                          <div
                            key={b.id}
                            onClick={() => handleSelectRecipient({
                              id: b.id,
                              name: `${b.firstName} ${b.lastName}`,
                              type: 'Bénéficiaire'
                            })}
                            className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                          >
                            <span>{b.firstName} {b.lastName}</span>
                            <span className="text-[10px] text-slate-400">{b.fileNumber}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Bloc Sélectionnés : Exactement comme sur les captures 4 & 5 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sélectionnés :
                  </label>
                  <div className="border border-slate-200 rounded-md p-3 min-h-[50px] bg-white flex flex-col justify-center">
                    {selectedRecipients.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 select-none">
                        Aucune donnée
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedRecipients.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between text-xs text-slate-800 py-1 px-1"
                          >
                            <span>
                              <strong>{r.name}</strong> <span className="text-slate-400">({r.type})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(r.id)}
                              className="size-5 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Retirer"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ===================================================================
              ÉTAPE 5 : Récapitulatif & Finalisation
             =================================================================== */}
          {step === 5 && (
            <div className="w-full space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto">
              <h3 className="text-base sm:text-lg font-medium text-slate-800 text-center">
                Récapitulatif & Finalisation <span className="text-[#f06553]">*</span>
              </h3>

              <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Action choisie :</span>
                    <span className="font-semibold text-slate-800">
                      {actionType === 'upload' ? 'Charger en interne' : actionType === 'send' ? 'Envoyer au bénéficiaire' : 'Faire signer électroniquement'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Document :</span>
                    <span className="font-semibold text-slate-800">
                      {sourceType === 'template' ? (selectedTemplate?.name || 'Modèle sélectionné') : (fileTitle || uploadedFile?.name)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Destinataire(s) lié(s) :</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRecipients.map(r => r.name).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Message d'accompagnement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message d'accompagnement (facultatif) :
                  </label>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Instructions ou précisions pour le bénéficiaire..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1]"
                  />
                </div>

                {/* Option de notification e-mail */}
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={notifyByEmail}
                    onChange={(e) => setNotifyByEmail(e.target.checked)}
                    className="rounded text-[#23c3b1] focus:ring-[#23c3b1] size-4 accent-[#23c3b1]"
                  />
                  <span>Notifier immédiatement le destinataire par e-mail</span>
                </label>
              </div>

              {uploadMut.isError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                  {(uploadMut.error as any)?.message || "Une erreur est survenue lors de l'enregistrement."}
                </div>
              )}
            </div>
          )}

        </div>

        {/* =======================================================================
            PIED DE PAGE : Compteur (1/5 à 5/5) à gauche + Boutons Précédent/Suivant
           ======================================================================= */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="text-sm font-normal text-slate-500 select-none">
            {step}/5
          </div>

          <div className="flex items-center gap-2.5">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={uploadMut.isPending}
                className="px-5 py-2 rounded-md bg-[#2b3544] hover:bg-[#1f2733] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Précédent
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || uploadMut.isPending}
              className="px-5 py-2 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploadMut.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Validation...
                </>
              ) : step === 5 ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Valider
                </>
              ) : (
                'Suivant'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
