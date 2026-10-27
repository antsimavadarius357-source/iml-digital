import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Award, 
  Search, 
  Check, 
  Loader2, 
  CheckCircle2, 
  UserCheck,
  Printer,
  Sparkles,
  Eye,
  Sliders,
  Send,
  ShieldCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import DigitalCertificateView, { CERTIFICATE_THEMES } from './DigitalCertificateView';

export interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBeneficiaryId?: string;
  initialTab?: 'config' | 'preview';
}

// Modèles de certificats numériques IML Digital
const CERTIFICATE_TEMPLATES = [
  { 
    id: 'cert-incubation', 
    type: 'incubation' as const,
    name: "Certificat de fin de parcours d'incubation IML", 
    desc: "Atteste de la validation complète du programme d'accompagnement et des jalons opérationnels." 
  },
  { 
    id: 'cert-business-plan', 
    type: 'business_plan' as const,
    name: "Certificat de validation de modèle économique & Business Plan", 
    desc: "Atteste de la solidité financière, de la robustesse prévisionnelle et de la stratégie de marché." 
  },
  { 
    id: 'cert-competences', 
    type: 'competences' as const,
    name: "Attestation de compétences entrepreneuriales & pitch", 
    desc: "Reconnaissance des aptitudes managériales, de leadership et de présentation aux investisseurs." 
  },
  { 
    id: 'cert-honneur', 
    type: 'honneur' as const,
    name: "Diplôme d'honneur du mérite entrepreneurial", 
    desc: "Distinction officielle délivrée aux lauréats porteurs de projet et dirigeants d'exception." 
  }
];

export default function IssueCertificateModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBeneficiaryId,
  initialTab = 'config'
}: IssueCertificateModalProps) {
  const queryClient = useQueryClient();

  // Mode d'affichage : 'config' (Paramétrage) ou 'preview' (Aperçu en direct plein écran)
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>(initialTab);

  // Certificat sélectionné
  const [selectedCert, setSelectedCert] = useState<typeof CERTIFICATE_TEMPLATES[0]>(CERTIFICATE_TEMPLATES[0]);
  const [themeColor, setThemeColor] = useState<'gold_emerald' | 'sapphire' | 'ruby_gold'>('gold_emerald');

  // Bénéficiaires
  const [beneficiarySearch, setBeneficiarySearch] = useState<string>('');
  const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState<boolean>(false);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<{ id: string; name: string; project?: string; structure?: string }[]>([]);

  const [isIssuedSuccess, setIsIssuedSuccess] = useState<boolean>(false);

  // Synchronisation de l'onglet et réinitialisation à l'ouverture
  useMemo(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'config');
      setIsIssuedSuccess(false);
    }
  }, [isOpen, initialTab]);

  // Récupération des bénéficiaires existants
  const { data: bRes } = useQuery({
    queryKey: ['beneficiaries-list-certificates'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Auto-sélection si un bénéficiaire par défaut est passé
  useMemo(() => {
    if (defaultBeneficiaryId && beneficiaries.length > 0 && selectedBeneficiaries.length === 0) {
      const match = beneficiaries.find(b => b.id === defaultBeneficiaryId);
      if (match) {
        setSelectedBeneficiaries([{
          id: match.id,
          name: `${match.firstName} ${match.lastName}`,
          project: match.companyName || match.projectName || "Projet Entreprise",
          structure: match.structureType || "PME / Startup"
        }]);

        // Vérifier si une attestation avait déjà été délivrée pour pré-charger son style
        try {
          const raw = localStorage.getItem('iml_issued_certificates');
          if (raw) {
            const parsed = JSON.parse(raw);
            const saved = parsed[match.id];
            if (saved) {
              const matchedTemplate = CERTIFICATE_TEMPLATES.find(t => t.type === saved.templateType);
              if (matchedTemplate) setSelectedCert(matchedTemplate);
              if (saved.themeColor) setThemeColor(saved.themeColor);
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }, [defaultBeneficiaryId, beneficiaries]);

  // Filtrage des bénéficiaires
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const fullName = `${b.firstName} ${b.lastName}`.toLowerCase();
    const company = (b.companyName || '').toLowerCase();
    return fullName.includes(beneficiarySearch.toLowerCase()) || company.includes(beneficiarySearch.toLowerCase());
  });

  const handleSelectBeneficiary = (b: { id: string; name: string; project?: string; structure?: string }) => {
    if (!selectedBeneficiaries.some(item => item.id === b.id)) {
      setSelectedBeneficiaries(prev => [...prev, b]);
    }
    setBeneficiarySearch('');
    setIsBeneficiaryDropdownOpen(false);
  };

  const handleRemoveBeneficiary = (id: string) => {
    setSelectedBeneficiaries(prev => prev.filter(item => item.id !== id));
  };

  // Mutation pour délivrer officiellement les certificats
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (selectedBeneficiaries.length === 0) {
        throw new Error('Veuillez sélectionner au moins un bénéficiaire.');
      }
      // Simulation signature cryptographique et archivage
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, count: selectedBeneficiaries.length };
    },
    onSuccess: () => {
      // Enregistrement persistant dans localStorage
      try {
        const raw = localStorage.getItem('iml_issued_certificates');
        const map = raw ? JSON.parse(raw) : {};
        selectedBeneficiaries.forEach(b => {
          map[b.id] = {
            id: `CERT-${Date.now().toString().slice(-6)}`,
            beneficiaryId: b.id,
            recipientName: b.name,
            projectName: b.project,
            structureType: b.structure,
            templateType: selectedCert.type,
            templateName: selectedCert.name,
            themeColor,
            issuedAt: new Date().toISOString()
          };
        });
        localStorage.setItem('iml_issued_certificates', JSON.stringify(map));
      } catch (err) {
        console.error('Erreur stockage certificat', err);
      }

      setIsIssuedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.();
    }
  });

  const handleClose = () => {
    setActiveTab('config');
    setSelectedCert(CERTIFICATE_TEMPLATES[0]);
    setThemeColor('gold_emerald');
    setBeneficiarySearch('');
    setIsBeneficiaryDropdownOpen(false);
    setSelectedBeneficiaries([]);
    setIsIssuedSuccess(false);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const primaryRecipient = selectedBeneficiaries[0] || {
    name: "Marc Roul",
    project: "Boutique Restauration & Services",
    structure: "Porteur d'Idée / Créateur"
  };

  const canSubmit = selectedBeneficiaries.length > 0;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className={`relative w-full ${activeTab === 'preview' ? 'max-w-5xl' : 'max-w-4xl'} my-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col animate-in zoom-in-95 duration-200 text-slate-800 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* =======================================================================
            EN-TÊTE : Titre + Onglets Paramétrage / Aperçu Décor + Fermer
           ======================================================================= */}
        <div className="py-3.5 px-6 sm:px-7 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-2xs">
              <Award className="size-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Délivrer un Certificat Numérique</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Décor Officiel
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Génération, signature officielle et certification avec QR code de vérification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton bascule Vue Décor / Configuration */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'config' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="size-3.5" />
                <span>Paramètres</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs text-[#23c3b1]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="size-3.5" />
                <span>Aperçu Diplôme</span>
              </button>
            </div>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={handleClose}
              className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* =======================================================================
            CORPS DU MODAL : Selon l'onglet sélectionné
           ======================================================================= */}
        <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto">
          
          {/* Écran de Succès */}
          {isIssuedSuccess ? (
            <div className="p-8 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-300 rounded-2xl text-center space-y-4 animate-in zoom-in-95 shadow-sm">
              <div className="size-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="size-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-emerald-950">
                  Certificat numérique délivré avec succès !
                </h3>
                <p className="text-xs text-emerald-800 max-w-lg mx-auto leading-relaxed">
                  L'attestation officielle a été enregistrée, signée et rattachée avec succès au dossier de{' '}
                  <span className="font-bold underline text-emerald-950">{primaryRecipient.name}</span>.
                </p>
              </div>

              {/* Actions immédiates pour voir et imprimer */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsIssuedSuccess(false);
                    setActiveTab('preview');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#23c3b1] to-[#1ca797] hover:from-[#1ea898] hover:to-[#178f81] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="size-4" />
                  <span>Voir l'attestation délivrée</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsIssuedSuccess(false);
                    setActiveTab('preview');
                    setTimeout(() => window.print(), 350);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Printer className="size-4 text-slate-600" />
                  <span>Imprimer / Télécharger en PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : activeTab === 'config' ? (
            
            /* ===================================================================
               ONGLET 1 : CONFIGURATION COMPACTE 2 COLONNES
               =================================================================== */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              {/* COLONNE GAUCHE (7/12) : Modèle & Thème du décor */}
              <div className="md:col-span-7 space-y-4">
                
                {/* 1. Sélection du modèle de certificat */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. Modèle de Certificat à décerner
                    </label>
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      4 modèles disponibles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CERTIFICATE_TEMPLATES.map((tpl) => {
                      const isSelected = selectedCert.id === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedCert(tpl)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left relative flex flex-col justify-between min-h-[66px] ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                              {tpl.name}
                            </span>
                            {isSelected && <Check className="size-4 text-amber-600 shrink-0 mt-0.5" />}
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-1 line-clamp-1">
                            {tpl.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Thème du Décor & Sceau */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    2. Thème du Décor & Sceau
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CERTIFICATE_THEMES) as Array<keyof typeof CERTIFICATE_THEMES>).map((thKey) => {
                      const th = CERTIFICATE_THEMES[thKey];
                      const isSelected = themeColor === thKey;
                      return (
                        <div
                          key={thKey}
                          onClick={() => setThemeColor(thKey)}
                          className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            isSelected 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div 
                            className="size-3.5 rounded-full border border-white/40 shadow-xs shrink-0"
                            style={{ backgroundColor: th.primary }}
                          />
                          <span className="text-[11px] font-bold truncate">{th.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* COLONNE DROITE (5/12) : Récipiendaires & Sécurité */}
              <div className="md:col-span-5 space-y-3">
                
                {/* 3. Sélection des bénéficiaires */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    3. Récipiendaire(s) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={beneficiarySearch}
                      onChange={(e) => {
                        setBeneficiarySearch(e.target.value);
                        setIsBeneficiaryDropdownOpen(true);
                      }}
                      onFocus={() => setIsBeneficiaryDropdownOpen(true)}
                      placeholder="Rechercher par nom, entreprise..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-2 focus:ring-[#23c3b1]/20 placeholder-slate-400 shadow-2xs pr-8"
                    />
                    <Search className="size-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                    {isBeneficiaryDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {filteredBeneficiaries.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            Aucun bénéficiaire trouvé
                          </div>
                        ) : (
                          filteredBeneficiaries.map((b: any) => {
                            const isAlreadySelected = selectedBeneficiaries.some(item => item.id === b.id);
                            return (
                              <div
                                key={b.id}
                                onClick={() => {
                                  if (!isAlreadySelected) {
                                    handleSelectBeneficiary({
                                      id: b.id,
                                      name: `${b.firstName} ${b.lastName}`,
                                      project: b.companyName || b.projectName || "Projet Entreprise",
                                      structure: b.structureType || "PME / Startup"
                                    });
                                  }
                                }}
                                className={`px-3 py-2 text-xs flex justify-between items-center transition-colors ${
                                  isAlreadySelected 
                                    ? 'bg-slate-50 text-slate-400 cursor-default' 
                                    : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-slate-800">{b.firstName} {b.lastName}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5">({b.companyName || b.email || 'Bénéficiaire'})</span>
                                </div>
                                {isAlreadySelected && <Check className="size-3.5 text-[#23c3b1]" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Récipiendaires sélectionnés */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span>Sélectionné(s)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {selectedBeneficiaries.length}
                    </span>
                  </div>
                  {selectedBeneficiaries.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-2.5">
                      Sélectionnez au moins un bénéficiaire ci-dessus.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-0.5">
                      {selectedBeneficiaries.map((b) => (
                        <div
                          key={b.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                        >
                          <UserCheck className="size-3 text-[#23c3b1]" />
                          <span className="truncate max-w-[130px]">{b.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBeneficiary(b.id)}
                            className="size-3.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer ml-0.5"
                            title="Retirer"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Badge Sécurisation & QR Code */}
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center gap-2.5 text-emerald-800 text-[11px]">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span className="leading-tight">
                    Certification avec QR Code infalsifiable et signature officielle IML horodatée.
                  </span>
                </div>

              </div>

            </div>

          ) : (
            
            /* ===================================================================
               ONGLET 2 : APERÇU DU CERTIFICAT EN DIRECT AVEC DÉCOR ROYAL
               =================================================================== */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="size-4 text-amber-500" />
                  <span>Aperçu en temps réel du diplôme haute résolution</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Printer className="size-3.5 text-slate-500" />
                    <span>Imprimer / PDF</span>
                  </button>
                </div>
              </div>

              {/* Rendu du certificat officiel */}
              <div className="overflow-x-auto p-1">
                <DigitalCertificateView
                  recipientName={primaryRecipient.name}
                  projectName={primaryRecipient.project}
                  structureType={primaryRecipient.structure}
                  templateType={selectedCert.type}
                  themeColor={themeColor}
                  coachName="Darius Coach IML"
                  directorName="Directeur Général IML"
                />
              </div>
            </div>

          )}

        </div>

        {/* =======================================================================
            PIED DE MODAL : Boutons d'Action (Aperçu / Délivrer)
           ======================================================================= */}
        <div className="px-6 sm:px-7 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between gap-3 flex-wrap">
          <div>
            {activeTab === 'config' ? (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Eye className="size-4 text-[#23c3b1]" />
                <span>Voir le décor & aperçu</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Sliders className="size-4 text-slate-500" />
                <span>Modifier les paramètres</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === 'preview' ? (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="size-4 text-white" />
                  <span>Imprimer / Télécharger en PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() => issueMutation.mutate()}
                  disabled={!canSubmit || issueMutation.isPending}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                    canSubmit
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-500/20 hover:shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {issueMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Délivrance officielle...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4 text-white" />
                      <span>Délivrer & Attribuer ({selectedBeneficiaries.length})</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
