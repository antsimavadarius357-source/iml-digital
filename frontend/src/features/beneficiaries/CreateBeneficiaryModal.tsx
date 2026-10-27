import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  X, 
  Loader2, 
  Save, 
  User, 
  Building, 
  Compass, 
  Camera, 
  FileText, 
  Upload, 
  Trash2, 
  Paperclip
} from 'lucide-react';
import { api } from '../../lib/api';
import { TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type Options } from './types';

// Schéma de validation complet IML Digital
const schema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(100),
  lastName: z.string().trim().min(1, 'Nom requis').max(100),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(254),
  phone: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(['PORTEUR_IDEE', 'STARTUP', 'ENTREPRISE']),
  project: z.object({
    name: z.string().trim().min(1, 'Nom du projet requis').max(200),
    description: z.string().optional(),
    sectorId: z.string().optional(),
    projectType: z.string().optional(),
    stage: z.enum(['IDEE', 'PROTOTYPE', 'LANCEMENT', 'CROISSANCE', 'MATURITE']),
    companyCreatedAt: z.string().optional(),
    legalStatus: z.string().optional(),
    companySize: z.enum(['MICRO', 'PETITE', 'MOYENNE', 'GRANDE']).optional().or(z.literal('')),
    priorityNeeds: z.string().optional(),
  }),
  programId: z.string().optional(),
  assignedAgentId: z.string().optional(),
  startDate: z.string().optional(),
  initialObjectives: z.string().optional(),
  priority: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  status: z.enum(['EN_ATTENTE', 'ACTIF', 'EN_PAUSE', 'TERMINE', 'ABANDONNE']).default('EN_ATTENTE'),
}).superRefine((v, ctx) => {
  if (v.type === 'ENTREPRISE') {
    if (!v.project.companyCreatedAt) {
      ctx.addIssue({ code: 'custom', path: ['project', 'companyCreatedAt'], message: "Date de création requise" });
    }
    if (!v.project.legalStatus) {
      ctx.addIssue({ code: 'custom', path: ['project', 'legalStatus'], message: "Statut juridique requis" });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface AttachedDocumentItem {
  id: string;
  file: File;
  title: string;
  category: 'IDENTITE' | 'BUSINESS_PLAN' | 'JURIDIQUE' | 'FINANCIER' | 'AUTRE';
}

interface CreateBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const inp = "mt-0.5 block w-full rounded border border-slate-200 shadow-2xs focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] text-xs px-2.5 py-1.5 bg-white text-slate-800 placeholder-slate-400 transition-colors";
const lbl = "block text-[11px] font-medium text-slate-600";

export default function CreateBeneficiaryModal({ isOpen, onClose, onSuccess }: CreateBeneficiaryModalProps) {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const options = useQuery({ 
    queryKey: ['beneficiary-options'], 
    queryFn: () => api<Options>('/beneficiaries/options'), 
    staleTime: 300_000,
    enabled: isOpen
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'save' | 'save_and_schedule'>('save');

  // Gestion de la Photo du bénéficiaire (prise ou téléversée en présentiel)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Gestion des Documents physiques déposés en présentiel
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocumentItem[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { 
      type: 'PORTEUR_IDEE', 
      status: 'EN_ATTENTE', 
      priority: 'NORMALE', 
      project: { stage: 'IDEE' } 
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleAddDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: AttachedDocumentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const lower = f.name.toLowerCase();
      let cat: 'IDENTITE' | 'BUSINESS_PLAN' | 'JURIDIQUE' | 'FINANCIER' | 'AUTRE' = 'AUTRE';
      if (lower.includes('cni') || lower.includes('passeport') || lower.includes('identite')) cat = 'IDENTITE';
      else if (lower.includes('bp') || lower.includes('plan') || lower.includes('business')) cat = 'BUSINESS_PLAN';
      else if (lower.includes('statut') || lower.includes('rccm') || lower.includes('nif') || lower.includes('kbis')) cat = 'JURIDIQUE';
      else if (lower.includes('devis') || lower.includes('bilan') || lower.includes('financier') || lower.includes('banque')) cat = 'FINANCIER';

      newDocs.push({
        id: `doc-${Date.now()}-${i}`,
        file: f,
        title: f.name,
        category: cat,
      });
    }

    setAttachedDocs(prev => [...prev, ...newDocs]);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleRemoveDoc = (id: string) => {
    setAttachedDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleUpdateDocCategory = (id: string, category: any) => {
    setAttachedDocs(prev => prev.map(d => d.id === id ? { ...d, category } : d));
  };

  const createMut = useMutation({
    mutationFn: (data: FormData) => api<{ beneficiary: any }>('/beneficiaries', { 
      method: 'POST', 
      body: data 
    }),
    onSuccess: async (res) => {
      const newBeneficiary = res?.beneficiary;
      const bId = newBeneficiary?.id;

      // Téléversement de la photo et des documents déposés en présentiel
      if (bId) {
        setIsUploadingFiles(true);
        try {
          // 1. Sauvegarde locale immédiate de la photo pour affichage direct
          if (photoPreview) {
            localStorage.setItem(`iml_beneficiary_photo_${bId}`, photoPreview);
          }

          // 2. Téléversement de la photo vers le serveur
          if (photoFile) {
            const photoData = new FormData();
            photoData.append('file', photoFile);
            photoData.append('title', `Photo portrait • ${newBeneficiary.firstName} ${newBeneficiary.lastName}`);
            photoData.append('category', 'PHOTO_IDENTITE');
            photoData.append('ownerType', 'BENEFICIARY');
            photoData.append('ownerId', bId);

            await fetch('/api/v1/documents', {
              method: 'POST',
              headers: { 'X-Requested-With': 'iml-digital' },
              body: photoData,
            }).catch(console.warn);
          }

          // 3. Téléversement de tous les documents physiques joints
          for (const doc of attachedDocs) {
            const docData = new FormData();
            docData.append('file', doc.file);
            docData.append('title', doc.title || doc.file.name);
            docData.append('category', doc.category);
            docData.append('ownerType', 'BENEFICIARY');
            docData.append('ownerId', bId);

            await fetch('/api/v1/documents', {
              method: 'POST',
              headers: { 'X-Requested-With': 'iml-digital' },
              body: docData,
            }).catch(console.warn);
          }
        } finally {
          setIsUploadingFiles(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      setAttachedDocs([]);
      setApiError(null);

      if (onSuccess) onSuccess();
      onClose();

      // Si l'agent a cliqué sur "Enregistrer et mettre en contact avec un expert"
      if (actionType === 'save_and_schedule' && bId) {
        window.location.href = `/beneficiaires/${bId}?tab=suivi`;
      }
    },
    onError: (err: any) => {
      setApiError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    }
  });

  const type = watch('type');
  const isEnterprise = type === 'ENTREPRISE';

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/60 backdrop-blur-[2px] p-2 sm:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-auto flex flex-col border border-slate-200/90 text-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* EN-TÊTE DE LA MODALE */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/20 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-[#23c3b1] to-teal-500 text-white flex items-center justify-center font-bold shadow-sm">
              <User className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  Inscrire un bénéficiaire (Accueil en présentiel)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Présentiel Espace PME
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Renseignez l'identité du porteur avec sa photo, son projet et numérisez ses pièces justificatives.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CORPS DU FORMULAIRE */}
        <div className="flex-1 overflow-y-auto max-h-[calc(88vh-140px)] p-4 sm:p-6 space-y-5">
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{apiError}</span>
            </div>
          )}

          <form id="create-beneficiary-form" onSubmit={handleSubmit((d) => createMut.mutate(d as any))}>
            
            {/* 3 COLONNES PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              
              {/* -------------------------------------------------------------------
                  COLONNE 1 : Informations personnelles & Photo de profil
                 ------------------------------------------------------------------- */}
              <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                  <User className="size-3.5 text-[#23c3b1]" />
                  <h3 className="text-xs font-bold text-slate-800">
                    1. Informations personnelles & Photo
                  </h3>
                </div>

                {/* Bloc Photo de profil prise en présentiel */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center gap-3">
                  <div className="relative size-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu photo" className="size-full object-cover" />
                    ) : (
                      <User className="size-7 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-slate-700">
                      Photo du bénéficiaire
                    </span>
                    <span className="block text-[10px] text-slate-400 mb-1.5">
                      Prise ou fichier (JPG, PNG)
                    </span>

                    <input 
                      type="file" 
                      ref={photoInputRef}
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden" 
                    />

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                      >
                        <Camera className="size-3 text-[#23c3b1]" />
                        <span>{photoPreview ? 'Changer' : 'Prendre / Charger'}</span>
                      </button>

                      {photoPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-1.5 py-1 rounded-md text-red-500 hover:bg-red-50 text-[10px] transition cursor-pointer"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prénom & Nom */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Prénom <span className="text-red-500">*</span></label>
                    <input {...register('firstName')} placeholder="Ex : Jean" className={inp} />
                    {errors.firstName && <p className="mt-0.5 text-[10px] text-red-600">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Nom <span className="text-red-500">*</span></label>
                    <input {...register('lastName')} placeholder="Ex : Dupont" className={inp} />
                    {errors.lastName && <p className="mt-0.5 text-[10px] text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={lbl}>E-mail <span className="text-red-500">*</span></label>
                  <input type="email" {...register('email')} placeholder="Ex : contact@email.com" className={inp} />
                  {errors.email && <p className="mt-0.5 text-[10px] text-red-600">{errors.email.message}</p>}
                </div>

                {/* Téléphone & Ville */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Téléphone</label>
                    <input {...register('phone')} placeholder="+241 ..." className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Ville</label>
                    <input {...register('city')} placeholder="Libreville" className={inp} />
                  </div>
                </div>

                {/* Type de bénéficiaire */}
                <div>
                  <label className={lbl}>Type de structure <span className="text-red-500">*</span></label>
                  <select {...register('type')} className={inp}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* -------------------------------------------------------------------
                  COLONNE 2 : Informations sur le projet
                 ------------------------------------------------------------------- */}
              <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                  <Building className="size-3.5 text-[#23c3b1]" />
                  <h3 className="text-xs font-bold text-slate-800">
                    2. Informations sur le projet
                  </h3>
                </div>

                {/* Nom du projet */}
                <div>
                  <label className={lbl}>Nom du projet / entreprise <span className="text-red-500">*</span></label>
                  <input {...register('project.name')} placeholder="Nom du projet ou raison sociale" className={inp} />
                  {errors.project?.name && <p className="mt-0.5 text-[10px] text-red-600">{errors.project.name.message}</p>}
                </div>

                {/* Secteur & Stade */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Secteur</label>
                    <select {...register('project.sectorId')} className={inp}>
                      <option value="">Sélectionner...</option>
                      {options.data?.sectors.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Stade</label>
                    <select {...register('project.stage')} className={inp}>
                      {Object.entries(STAGE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description succincte</label>
                  <textarea {...register('project.description')} rows={2} placeholder="Activité principale..." className={inp} />
                </div>

                {/* Spécifique Entreprise */}
                {isEnterprise && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={lbl}>Création <span className="text-red-500">*</span></label>
                        <input type="date" {...register('project.companyCreatedAt')} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Statut juridique <span className="text-red-500">*</span></label>
                        <input {...register('project.legalStatus')} placeholder="SARL, SAS..." className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Taille effectif</label>
                      <select {...register('project.companySize')} className={inp}>
                        <option value="">Non spécifié</option>
                        {Object.entries(SIZE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* -------------------------------------------------------------------
                  COLONNE 3 : Suivi & Accompagnement
                 ------------------------------------------------------------------- */}
              <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                  <Compass className="size-3.5 text-[#23c3b1]" />
                  <h3 className="text-xs font-bold text-slate-800">
                    3. Suivi & Accompagnement
                  </h3>
                </div>

                {/* Statut & Priorité */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Statut dossier</label>
                    <select {...register('status')} className={inp}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Priorité</label>
                    <select {...register('priority')} className={inp}>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Référent assigné */}
                <div>
                  <label className={lbl}>Conseiller référent (Coach, Agent, Direction)</label>
                  <select {...register('assignedAgentId')} className={inp}>
                    <option value="">Non assigné (Attribution ultérieure)</option>
                    {options.data?.agents?.filter(a => a.role?.code === 'COACH').length ? (
                      <optgroup label="🎯 Coachs & Mentors">
                        {options.data.agents.filter(a => a.role?.code === 'COACH').map(a => (
                          <option key={a.id} value={a.id}>Coach : {a.firstName} {a.lastName}</option>
                        ))}
                      </optgroup>
                    ) : null}
                    {options.data?.agents?.filter(a => a.role?.code === 'AGENT' || !a.role?.code).length ? (
                      <optgroup label="📋 Agents IML (Coordination)">
                        {options.data.agents.filter(a => a.role?.code === 'AGENT' || !a.role?.code).map(a => (
                          <option key={a.id} value={a.id}>Agent : {a.firstName} {a.lastName}</option>
                        ))}
                      </optgroup>
                    ) : null}
                    {options.data?.agents?.filter(a => a.role?.code === 'ADMIN' || a.role?.code === 'DIRECTION').length ? (
                      <optgroup label="👑 Direction du Programme">
                        {options.data.agents.filter(a => a.role?.code === 'ADMIN' || a.role?.code === 'DIRECTION').map(a => (
                          <option key={a.id} value={a.id}>Direction : {a.firstName} {a.lastName}</option>
                        ))}
                      </optgroup>
                    ) : null}
                  </select>
                </div>

                {/* Objectifs initiaux */}
                <div>
                  <label className={lbl}>Besoins prioritaires & Objectifs</label>
                  <textarea {...register('initialObjectives')} rows={2} placeholder="Objectifs fixés lors de l'entretien d'accueil..." className={inp} />
                </div>
              </div>

            </div>

            {/* -------------------------------------------------------------------
                SECTION 4 : DOCUMENTS PHYSIQUES DÉPOSÉS EN PRÉSENTIEL
               ------------------------------------------------------------------- */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/20 border border-slate-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>4. Documents & Pièces justificatives apportées en présentiel</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {attachedDocs.length} pièce{attachedDocs.length > 1 ? 's' : ''}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Numérisation ou fichiers apportés par le porteur : CNI, Statuts, Business Plan papier, Devis...
                    </p>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={docInputRef}
                  multiple
                  onChange={handleAddDocuments}
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer self-start sm:self-auto"
                >
                  <Upload className="size-3.5 text-[#23c3b1]" />
                  <span>Joindre des documents</span>
                </button>
              </div>

              {/* Liste des documents ajoutés */}
              {attachedDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {attachedDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Paperclip className="size-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-800 truncate block text-[11px]" title={doc.title}>
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(doc.file.size / 1024).toFixed(0)} Ko
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={doc.category}
                          onChange={(e) => handleUpdateDocCategory(doc.id, e.target.value)}
                          className="text-[10px] font-semibold py-1 px-2 rounded border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-[#23c3b1]"
                        >
                          <option value="IDENTITE">Pièce d'identité (CNI / Passeport)</option>
                          <option value="BUSINESS_PLAN">Business Plan / Prévisionnel</option>
                          <option value="JURIDIQUE">Statuts / RCCM / NIF</option>
                          <option value="FINANCIER">Devis / Relevé bancaire</option>
                          <option value="AUTRE">Autre pièce jointe</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="size-6 rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => docInputRef.current?.click()}
                  className="py-3 px-4 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:bg-slate-100/50 transition bg-white/50"
                >
                  <p className="text-[11px] text-slate-500 font-medium">
                    Glissez-déposez ici ou <strong className="text-[#23c3b1] underline">cliquez pour sélectionner</strong> les fichiers scannés (CNI, statuts, projet papier...)
                  </p>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* PIED DE MODALE FIXE */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-xl flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={createMut.isPending || isUploadingFiles}
            className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button 
            type="submit"
            form="create-beneficiary-form"
            onClick={() => setActionType('save')}
            disabled={createMut.isPending || isUploadingFiles}
            className="px-5 py-2 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {createMut.isPending || isUploadingFiles ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Enregistrement avec pièces...</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>Enregistrer le bénéficiaire</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
