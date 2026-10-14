import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, Save, User, Building, Compass } from 'lucide-react';
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

interface CreateBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const inp = "mt-0.5 block w-full rounded border border-slate-200 shadow-2xs focus:border-[#23c3b1] focus:ring-1 focus:ring-[#23c3b1] text-xs px-2.5 py-1.5 bg-white text-slate-800 placeholder-slate-400 transition-colors";
const lbl = "block text-[11px] font-medium text-slate-600";

export default function CreateBeneficiaryModal({ isOpen, onClose, onSuccess }: CreateBeneficiaryModalProps) {
  const queryClient = useQueryClient();
  const options = useQuery({ 
    queryKey: ['beneficiary-options'], 
    queryFn: () => api<Options>('/beneficiaries/options'), 
    staleTime: 300_000,
    enabled: isOpen
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'save' | 'save_and_schedule'>('save');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { 
      type: 'PORTEUR_IDEE', 
      status: 'EN_ATTENTE', 
      priority: 'NORMALE', 
      project: { stage: 'IDEE' } 
    },
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) => api('/beneficiaries', { 
      method: 'POST', 
      body: data 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      reset();
      setApiError(null);
      if (onSuccess) onSuccess();
      onClose();
      if (actionType === 'save_and_schedule') {
        window.location.href = '/agendas';
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
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/55 backdrop-blur-[2px] p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Conteneur modal au premier plan */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-auto flex flex-col border border-slate-200/90 text-slate-800 animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* EN-TÊTE NET ET BIEN VISIBLE */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              Créer un bénéficiaire
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Renseignez le contact, le projet et les modalités d'accompagnement.
            </p>
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

        {/* CORPS : 3 COLONNES COMPACTES CÔTE-À-CÔTE BIEN AGENCÉES */}
        <div className="flex-1 overflow-y-auto max-h-[calc(85vh-130px)] p-4 sm:p-6">
          {apiError && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {apiError}
            </div>
          )}

          <form id="create-beneficiary-form" onSubmit={handleSubmit((d) => createMut.mutate(d as any))}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              
              {/* -------------------------------------------------------------------
                  COLONNE 1 : Informations personnelles
                 ------------------------------------------------------------------- */}
              <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/70">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                  <User className="size-3.5 text-[#23c3b1]" />
                  <h3 className="text-xs font-bold text-slate-800">
                    1. Informations personnelles
                  </h3>
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
                  <label className={lbl}>Type de bénéficiaire <span className="text-red-500">*</span></label>
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
              <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/70">
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
                      <label className={lbl}>Taille</label>
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
                  COLONNE 3 : Suivi et accompagnement
                 ------------------------------------------------------------------- */}
              <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/70">
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

                {/* Programme */}
                <div>
                  <label className={lbl}>Programme</label>
                  <select {...register('programId')} className={inp}>
                    <option value="">Sélectionner un programme...</option>
                    {options.data?.programs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Coach / Agent */}
                <div>
                  <label className={lbl}>Coach / Agent assigné</label>
                  <select {...register('assignedAgentId')} className={inp}>
                    <option value="">Non assigné</option>
                    {options.data?.agents.map(a => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Objectifs initiaux */}
                <div>
                  <label className={lbl}>Objectifs initiaux</label>
                  <textarea {...register('initialObjectives')} rows={2} placeholder="Objectifs fixés..." className={inp} />
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* PIED DE MODALE FIXE ET ÉPURÉ AVEC LES 3 BOUTONS */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-xl flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button 
            type="submit"
            form="create-beneficiary-form"
            onClick={() => setActionType('save')}
            disabled={createMut.isPending}
            className="px-4 py-1.5 rounded bg-[#23c3b1] hover:bg-[#1db09e] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {createMut.isPending && actionType === 'save' ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Enregistrer le bénéficiaire
          </button>

          <button 
            type="submit"
            form="create-beneficiary-form"
            onClick={() => setActionType('save_and_schedule')}
            disabled={createMut.isPending}
            className="px-4 py-1.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {createMut.isPending && actionType === 'save_and_schedule' ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Enregistrer et planifier un rendez-vous
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
