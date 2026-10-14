import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  BadgeCheck, 
  Search, 
  Check, 
  Loader2, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Modèles de certificats numériques IML Digital
const CERTIFICATE_TEMPLATES = [
  { id: 'cert-incubation', name: "Certificat de fin de parcours d'incubation IML", desc: "Atteste de la validation complète du programme d'accompagnement" },
  { id: 'cert-business-plan', name: "Certificat de validation de modèle économique & Business Plan", desc: "Atteste de la solidité financière et stratégique du projet" },
  { id: 'cert-competences', name: "Attestation de compétences entrepreneuriales & pitch", desc: "Reconnaissance des aptitudes managériales et commerciales" },
  { id: 'cert-ateliers', name: "Attestation de participation aux ateliers numériques", desc: "Validation des modules de formation pratique et outils digitaux" },
  { id: 'cert-honneur', name: "Certificat d'honneur d'accompagnement à la création", desc: "Distinction officielle délivrée aux lauréats porteurs de projet" }
];

export default function IssueCertificateModal({
  isOpen,
  onClose,
  onSuccess
}: IssueCertificateModalProps) {
  const queryClient = useQueryClient();

  // Certificat sélectionné
  const [certSearch, setCertSearch] = useState<string>('');
  const [selectedCert, setSelectedCert] = useState<typeof CERTIFICATE_TEMPLATES[0] | null>(null);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState<boolean>(false);

  // Bénéficiaires
  const [beneficiarySearch, setBeneficiarySearch] = useState<string>('');
  const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState<boolean>(false);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<{ id: string; name: string; email?: string }[]>([]);

  const [isIssuedSuccess, setIsIssuedSuccess] = useState<boolean>(false);

  // Récupération des bénéficiaires existants
  const { data: bRes } = useQuery({
    queryKey: ['beneficiaries-list-certificates'],
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100'),
    enabled: isOpen
  });
  const beneficiaries = bRes?.items || [];

  // Filtrage des certificats
  const filteredCerts = CERTIFICATE_TEMPLATES.filter(c =>
    c.name.toLowerCase().includes(certSearch.toLowerCase()) ||
    c.desc.toLowerCase().includes(certSearch.toLowerCase())
  );

  // Filtrage des bénéficiaires
  const filteredBeneficiaries = beneficiaries.filter((b: any) => {
    const fullName = `${b.firstName} ${b.lastName}`.toLowerCase();
    return fullName.includes(beneficiarySearch.toLowerCase()) ||
           (b.fileNumber && b.fileNumber.toLowerCase().includes(beneficiarySearch.toLowerCase()));
  });

  const handleSelectBeneficiary = (b: { id: string; name: string; email?: string }) => {
    if (!selectedBeneficiaries.some(item => item.id === b.id)) {
      setSelectedBeneficiaries(prev => [...prev, b]);
    }
    setBeneficiarySearch('');
    setIsBeneficiaryDropdownOpen(false);
  };

  const handleRemoveBeneficiary = (id: string) => {
    setSelectedBeneficiaries(prev => prev.filter(item => item.id !== id));
  };

  // Mutation pour délivrer les certificats
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCert || selectedBeneficiaries.length === 0) {
        throw new Error('Veuillez sélectionner un certificat et au moins un bénéficiaire.');
      }

      // Simulation de la signature cryptographique et délivrance du certificat
      await new Promise(resolve => setTimeout(resolve, 700));
      return { success: true, count: selectedBeneficiaries.length };
    },
    onSuccess: () => {
      setIsIssuedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setTimeout(() => {
        setIsIssuedSuccess(false);
        handleClose();
        onSuccess?.();
      }, 1200);
    }
  });

  const handleClose = () => {
    setCertSearch('');
    setSelectedCert(null);
    setIsCertDropdownOpen(false);
    setBeneficiarySearch('');
    setIsBeneficiaryDropdownOpen(false);
    setSelectedBeneficiaries([]);
    setIsIssuedSuccess(false);
    onClose();
  };

  const canSubmit = !!selectedCert && selectedBeneficiaries.length > 0;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/55 backdrop-blur-[2px] p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg my-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col animate-in zoom-in-95 duration-200 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =======================================================================
            EN-TÊTE : Icône centrale BadgeCheck + Titre + Croix de fermeture
           ======================================================================= */}
        <div className="relative pt-6 pb-2 px-6 sm:px-8 text-center bg-white rounded-t-2xl shrink-0">
          
          {/* Bouton de fermeture en haut à droite */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>

          {/* Cercle avec icône BadgeCheck de certification */}
          <div className="size-11 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 shadow-2xs mx-auto mb-2.5">
            <BadgeCheck className="size-5 stroke-[1.75]" />
          </div>

          {/* Titre exact : Délivrer un certificat numérique */}
          <h2 className="text-lg sm:text-[21px] font-normal text-slate-800 tracking-tight">
            Délivrer un certificat numérique
          </h2>
        </div>

        {/* =======================================================================
            CORPS DU FORMULAIRE : Identique à la capture d'écran
           ======================================================================= */}
        <div className="px-6 sm:px-8 py-4 space-y-4">
          
          {isIssuedSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-800">
                Certificat(s) délivré(s) avec succès !
              </h3>
              <p className="text-xs text-emerald-600">
                {selectedBeneficiaries.length} bénéficiaire(s) ont reçu leur certificat numérique certifié.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Sélectionnez un certificat numérique * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sélectionnez un certificat numérique <span className="text-[#f06553]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedCert ? selectedCert.name : certSearch}
                    onChange={(e) => {
                      setSelectedCert(null);
                      setCertSearch(e.target.value);
                      setIsCertDropdownOpen(true);
                    }}
                    onFocus={() => setIsCertDropdownOpen(true)}
                    placeholder="Rechercher"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs pr-8"
                  />
                  {selectedCert ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCert(null);
                        setCertSearch('');
                        setIsCertDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : (
                    <Search className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}

                  {isCertDropdownOpen && !selectedCert && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl z-30 max-h-48 overflow-y-auto">
                      {filteredCerts.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Aucun certificat trouvé
                        </div>
                      ) : (
                        filteredCerts.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCert(c);
                              setCertSearch(c.name);
                              setIsCertDropdownOpen(false);
                            }}
                            className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                          >
                            <div className="font-medium text-slate-800">{c.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{c.desc}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Un ou des bénéficiaires * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Un ou des bénéficiaires <span className="text-[#f06553]">*</span>
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
                    placeholder="Rechercher"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] placeholder-slate-400 shadow-2xs pr-8"
                  />
                  <Search className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                  {isBeneficiaryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-xl z-30 max-h-48 overflow-y-auto">
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
                                    email: b.email
                                  });
                                }
                              }}
                              className={`px-3 py-2 text-xs flex justify-between items-center border-b border-slate-50 last:border-0 ${
                                isAlreadySelected 
                                  ? 'bg-slate-50 text-slate-400 cursor-default' 
                                  : 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-800">{b.firstName} {b.lastName}</span>
                                {isAlreadySelected && <Check className="size-3 text-[#23c3b1]" />}
                              </div>
                              <span className="text-[11px] text-slate-400">{b.email}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Sélectionnés : */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Sélectionnés :
                  </label>
                  {selectedBeneficiaries.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-normal">
                      {selectedBeneficiaries.length} sélectionné(s)
                    </span>
                  )}
                </div>

                {/* Cadre identique à la capture d'écran */}
                <div className="min-h-[140px] max-h-[160px] overflow-y-auto rounded-md border border-slate-200 bg-white p-3 flex flex-col justify-center shadow-2xs">
                  {selectedBeneficiaries.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 select-none">
                      Vous n'avez rien sélectionné
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-start items-start">
                      {selectedBeneficiaries.map((b) => (
                        <div
                          key={b.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 shadow-2xs group"
                        >
                          <UserCheck className="size-3.5 text-[#23c3b1]" />
                          <span className="font-medium">{b.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBeneficiary(b.id)}
                            className="size-3.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
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

              {/* Bouton Délivrer en bas */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => issueMutation.mutate()}
                  disabled={!canSubmit || issueMutation.isPending}
                  className={`px-7 py-2 rounded-md text-xs font-medium transition-all ${
                    canSubmit
                      ? 'bg-[#f06553] hover:bg-[#e05341] text-white shadow-2xs hover:shadow-xs cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
                  }`}
                >
                  {issueMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      Délivrance en cours...
                    </span>
                  ) : (
                    'Délivrer'
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
}
