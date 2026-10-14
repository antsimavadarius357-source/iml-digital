import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type Options } from './types';

// Matching backend validation schema
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
      ctx.addIssue({ code: 'custom', path: ['project', 'companyCreatedAt'], message: "Date de création de l'entreprise requise" });
    }
    if (!v.project.legalStatus) {
      ctx.addIssue({ code: 'custom', path: ['project', 'legalStatus'], message: 'Statut juridique requis' });
    }
  }
});

type FormData = z.infer<typeof schema>;

const inp = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-sm px-3 py-2 border";

export default function BeneficiaryFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const options = useQuery({ queryKey: ['beneficiary-options'], queryFn: () => api<Options>('/beneficiaries/options'), staleTime: 300_000 });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: 'PORTEUR_IDEE', status: 'EN_ATTENTE', priority: 'NORMALE', project: { stage: 'IDEE' } },
  });

  const [apiError, setApiError] = useState('');
  const [actionType, setActionType] = useState<'save' | 'save_and_schedule'>('save');

  const createMut = useMutation({
    mutationFn: (data: FormData) => api('/beneficiaries', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      if (actionType === 'save_and_schedule') {
        navigate('/agendas');
      } else {
        navigate('/beneficiaires');
      }
    },
    onError: (err: any) => {
      setApiError(err.message || 'Une erreur est survenue.');
    }
  });

  const type = watch('type');
  const isEnterprise = type === 'ENTREPRISE';

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="size-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nouveau bénéficiaire</h1>
          <p className="text-sm text-slate-500">Ajouter un nouveau porteur de projet ou une entreprise.</p>
        </div>
      </div>

      {apiError && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{apiError}</div>}

      <form onSubmit={handleSubmit((d) => createMut.mutate(d as any))} className="space-y-8">
        {/* SECTION A: Informations personnelles */}
        <section className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-800">1. Informations personnelles</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Prénom <span className="text-red-500">*</span></label>
              <input {...register('firstName')} className={inp} />
              {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nom <span className="text-red-500">*</span></label>
              <input {...register('lastName')} className={inp} />
              {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail <span className="text-red-500">*</span></label>
              <input type="email" {...register('email')} className={inp} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Téléphone</label>
              <input {...register('phone')} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ville</label>
              <input {...register('city')} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Type de bénéficiaire <span className="text-red-500">*</span></label>
              <select {...register('type')} className={inp}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION B: Projet & Entreprise */}
        <section className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-800">2. Informations sur le projet</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Nom du projet / de l'entreprise <span className="text-red-500">*</span></label>
              <input {...register('project.name')} className={inp} />
              {errors.project?.name && <p className="mt-1 text-xs text-red-600">{errors.project.name.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea {...register('project.description')} rows={3} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Secteur d'activité</label>
              <select {...register('project.sectorId')} className={inp}>
                <option value="">Sélectionner un secteur...</option>
                {options.data?.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Stade d'avancement</label>
              <select {...register('project.stage')} className={inp}>
                {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            
            {isEnterprise && (
              <>
                <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Informations de l'entreprise (Obligatoire)</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date de création <span className="text-red-500">*</span></label>
                  <input type="date" {...register('project.companyCreatedAt')} className={inp} />
                  {errors.project?.companyCreatedAt && <p className="mt-1 text-xs text-red-600">{errors.project.companyCreatedAt.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Statut juridique <span className="text-red-500">*</span></label>
                  <input {...register('project.legalStatus')} placeholder="Ex: SARL, SAS..." className={inp} />
                  {errors.project?.legalStatus && <p className="mt-1 text-xs text-red-600">{errors.project.legalStatus.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Taille de l'entreprise</label>
                  <select {...register('project.companySize')} className={inp}>
                    <option value="">Non spécifié</option>
                    {Object.entries(SIZE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        </section>

        {/* SECTION C: Suivi & Assignation */}
        <section className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-800">3. Suivi et accompagnement</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Statut</label>
              <select {...register('status')} className={inp}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Niveau de priorité</label>
              <select {...register('priority')} className={inp}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Programme d'incubation</label>
              <select {...register('programId')} className={inp}>
                <option value="">Sélectionner un programme...</option>
                {options.data?.programs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Agent en charge</label>
              <select {...register('assignedAgentId')} className={inp}>
                <option value="">Non assigné</option>
                {options.data?.agents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Objectifs initiaux</label>
              <textarea {...register('initialObjectives')} rows={3} className={inp} />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button 
            type="submit" 
            onClick={() => setActionType('save')}
            disabled={createMut.isPending} 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white font-medium shadow-sm transition-colors disabled:opacity-70 cursor-pointer"
          >
            {createMut.isPending && actionType === 'save' ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            Enregistrer le bénéficiaire
          </button>

          <button 
            type="submit" 
            onClick={() => setActionType('save_and_schedule')}
            disabled={createMut.isPending} 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f06553] hover:bg-[#e05341] text-white font-medium shadow-sm transition-colors disabled:opacity-70 cursor-pointer"
          >
            {createMut.isPending && actionType === 'save_and_schedule' ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            Enregistrer et planifier un rendez-vous
          </button>
        </div>
      </form>
    </div>
  );
}
