import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { TYPE_LABELS, STATUS_LABELS, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type Options, type BeneficiaryDetail } from './types';

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
    sectorId: z.string().optional().nullable(),
    projectType: z.string().optional(),
    stage: z.enum(['IDEE', 'PROTOTYPE', 'LANCEMENT', 'CROISSANCE', 'MATURITE']),
    companyCreatedAt: z.string().optional(),
    legalStatus: z.string().optional(),
    companySize: z.enum(['MICRO', 'PETITE', 'MOYENNE', 'GRANDE']).optional().or(z.literal('')),
    priorityNeeds: z.string().optional(),
  }),
  programId: z.string().optional().nullable(),
  assignedAgentId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  initialObjectives: z.string().optional(),
  priority: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  status: z.enum(['EN_ATTENTE', 'ACTIF', 'EN_PAUSE', 'TERMINE', 'ABANDONNE']).default('EN_ATTENTE'),
}).superRefine((v, ctx) => {
  if (v.type === 'ENTREPRISE') {
    if (!v.project.companyCreatedAt) {
      ctx.addIssue({ code: 'custom', path: ['project', 'companyCreatedAt'], message: "Date de création requise" });
    }
    if (!v.project.legalStatus) {
      ctx.addIssue({ code: 'custom', path: ['project', 'legalStatus'], message: 'Statut juridique requis' });
    }
  }
});

type FormData = z.infer<typeof schema>;

const sel = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-sm px-3 py-2 border";
const inp = sel;

export default function BeneficiaryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState('');

  const { data: bRes, isLoading: isLoadingB } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => api<{ beneficiary: BeneficiaryDetail }>(`/beneficiaries/${id}`),
  });

  const options = useQuery({ queryKey: ['beneficiary-options'], queryFn: () => api<Options>('/beneficiaries/options'), staleTime: 300_000 });

  const b = bRes?.beneficiary;
  const p = b?.projects?.[0];

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (b) {
      reset({
        firstName: b.firstName,
        lastName: b.lastName,
        email: b.email,
        phone: b.phone || '',
        city: b.city || '',
        type: b.type as any,
        programId: b.program?.id || '',
        assignedAgentId: b.assignedAgent?.id || '',
        startDate: b.startDate ? b.startDate.substring(0, 10) : '',
        initialObjectives: b.initialObjectives || '',
        priority: b.priority as any,
        status: b.status as any,
        project: p ? {
          name: p.name,
          description: p.description || '',
          sectorId: p.sector?.id || '',
          projectType: p.projectType || '',
          stage: p.stage as any,
          companyCreatedAt: p.companyCreatedAt ? p.companyCreatedAt.substring(0, 10) : '',
          legalStatus: p.legalStatus || '',
          companySize: p.companySize as any || '',
          priorityNeeds: p.priorityNeeds || '',
        } : undefined as any,
      });
    }
  }, [b, p, reset]);

  const updateMut = useMutation({
    mutationFn: async (data: FormData) => {
      const { project, ...beneficiaryData } = data;
      // Convert empty strings to null for backend expectations
      Object.keys(beneficiaryData).forEach((k) => {
        if ((beneficiaryData as any)[k] === '') (beneficiaryData as any)[k] = null;
      });
      await api(`/beneficiaries/${id}`, { method: 'PATCH', body: beneficiaryData });
      if (p?.id) {
        Object.keys(project).forEach((k) => {
          if ((project as any)[k] === '') (project as any)[k] = null;
        });
        await api(`/beneficiaries/${id}/projects/${p.id}`, { method: 'PATCH', body: project });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      queryClient.invalidateQueries({ queryKey: ['beneficiary', id] });
      navigate(`/beneficiaires/${id}`);
    },
    onError: (err: any) => {
      setApiError(err.message || 'Une erreur est survenue.');
    }
  });

  const type = watch('type');
  const isEnterprise = type === 'ENTREPRISE';

  if (isLoadingB) {
    return <div className="flex justify-center p-12"><Loader2 className="size-8 animate-spin text-iml-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="size-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Modifier le bénéficiaire</h1>
          <p className="text-sm text-slate-500">{b?.firstName} {b?.lastName} - {b?.fileNumber}</p>
        </div>
      </div>

      {apiError && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{apiError}</div>}

      <form onSubmit={handleSubmit((d) => updateMut.mutate(d as any))} className="space-y-8">
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
              <select {...register('type')} className={sel}>
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
              <select {...register('project.sectorId')} className={sel}>
                <option value="">Sélectionner un secteur...</option>
                {options.data?.sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Stade d'avancement</label>
              <select {...register('project.stage')} className={sel}>
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
                  <select {...register('project.companySize')} className={sel}>
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
              <select {...register('status')} className={sel}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Niveau de priorité</label>
              <select {...register('priority')} className={sel}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Programme d'incubation</label>
              <select {...register('programId')} className={sel}>
                <option value="">Sélectionner un programme...</option>
                {options.data?.programs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Agent en charge</label>
              <select {...register('assignedAgentId')} className={sel}>
                <option value="">Non assigné</option>
                {options.data?.agents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date de début d'accompagnement</label>
              <input type="date" {...register('startDate')} className={inp} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Objectifs initiaux</label>
              <textarea {...register('initialObjectives')} rows={3} className={inp} />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={updateMut.isPending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-iml-700 text-white font-medium hover:bg-iml-900 transition-colors disabled:opacity-70">
            {updateMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            Mettre à jour le bénéficiaire
          </button>
        </div>
      </form>
    </div>
  );
}
