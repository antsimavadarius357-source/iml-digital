import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Sparkles,
  Camera, 
  FileText, 
  Upload, 
  Trash2, 
  Paperclip, 
  User 
} from 'lucide-react';
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

interface AttachedDocumentItem {
  id: string;
  file: File;
  title: string;
  category: 'IDENTITE' | 'BUSINESS_PLAN' | 'JURIDIQUE' | 'FINANCIER' | 'AUTRE';
}

const inp = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 sm:text-sm px-3 py-2 border";

export default function BeneficiaryFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const options = useQuery({ queryKey: ['beneficiary-options'], queryFn: () => api<Options>('/beneficiaries/options'), staleTime: 300_000 });

  const fromState = location.state as { fromApp?: string | number; applicant?: any; project?: any } | undefined;
  const applicant = fromState?.applicant;
  const project = fromState?.project;

  const defaultType = applicant?.structureType === 'PME' || applicant?.structureType === 'ORGANISATION' 
    ? 'ENTREPRISE' 
    : applicant?.structureType === 'STARTUP' 
      ? 'STARTUP' 
      : 'PORTEUR_IDEE';

  const defaultStage = project?.stage === 'COMMERCIAL' 
    ? 'LANCEMENT' 
    : (['IDEE', 'PROTOTYPE', 'LANCEMENT', 'CROISSANCE', 'MATURITE'].includes(project?.stage) ? project.stage : 'IDEE');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { 
      type: defaultType, 
      status: 'ACTIF', 
      priority: 'NORMALE',
      firstName: applicant?.firstName || '',
      lastName: applicant?.lastName || '',
      email: applicant?.email || '',
      phone: applicant?.phone || '',
      city: applicant?.city || 'Libreville',
      project: { 
        name: applicant?.companyName || project?.title || '',
        description: project?.description || '',
        stage: defaultStage,
        legalStatus: applicant?.legalStatus || (defaultType === 'ENTREPRISE' ? 'SARL' : ''),
        companyCreatedAt: applicant?.creationYear ? `${applicant.creationYear}-01-01` : (defaultType === 'ENTREPRISE' ? `${new Date().getFullYear()}-01-01` : ''),
        companySize: applicant?.companySize || (defaultType === 'ENTREPRISE' ? 'MICRO' : ''),
        priorityNeeds: Array.isArray(project?.needs) ? project.needs.join(', ') : (project?.needs || '')
      }
    },
  });

  const [apiError, setApiError] = useState('');
  const [actionType, setActionType] = useState<'save' | 'save_and_schedule'>('save');

  // Photo du bénéficiaire en présentiel
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Documents physiques apportés
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocumentItem[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

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
    mutationFn: (data: FormData) => api<{ beneficiary: any }>('/beneficiaries', { method: 'POST', body: data }),
    onSuccess: async (res) => {
      const newBeneficiary = res?.beneficiary;
      const bId = newBeneficiary?.id;

      if (bId) {
        setIsUploadingFiles(true);
        try {
          if (photoPreview) {
            localStorage.setItem(`iml_beneficiary_photo_${bId}`, photoPreview);
          }

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
      
      if (actionType === 'save_and_schedule' && bId) {
        navigate(`/beneficiaires/${bId}?tab=suivi`);
      } else if (bId) {
        navigate(`/beneficiaires/${bId}`);
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

      {fromState?.fromApp && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-2xs">
          <Sparkles className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong className="block font-bold mb-0.5">Dossier pré-rempli depuis la Candidature #{fromState.fromApp}</strong>
            <span>
              Les données soumises par <strong>{applicant?.firstName} {applicant?.lastName}</strong> ({applicant?.companyName || project?.title || 'Structure'}) ont été importées automatiquement. Vous pouvez ajuster ou compléter les informations avant d'enregistrer le dossier officiel.
            </span>
          </div>
        </div>
      )}

      {apiError && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{apiError}</div>}

      <form onSubmit={handleSubmit((d) => createMut.mutate(d as any))} className="space-y-8">
        {/* SECTION A: Informations personnelles */}
        <section className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">1. Informations personnelles & Photo du bénéficiaire</h2>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Inscription en présentiel
            </span>
          </div>

          {/* Photo portrait du bénéficiaire en présentiel */}
          <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-teal-300 flex items-center justify-center overflow-hidden shadow-2xs group-hover:border-teal-500 transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} alt="Portrait" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-9 h-9 text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
                title="Prendre / Choisir une photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-sm font-semibold text-slate-800">Photo d'identité du bénéficiaire</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">Recommandé en présentiel</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                Prenez ou chargez une photo nette du visage pour la fiche officielle du bénéficiaire et sa reconnaissance lors des ateliers et rendez-vous d'experts.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-600" />
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
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
              <label className="block text-sm font-medium text-slate-700">Référent assigné (Coach, Agent IML, Direction)</label>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Objectifs initiaux</label>
              <textarea {...register('initialObjectives')} rows={3} className={inp} />
            </div>
          </div>
        </section>

        {/* SECTION D: Documents & Pièces apportées en présentiel */}
        <section className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-800">4. Documents & Pièces justificatives apportées en présentiel</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">CNI, Statuts, Business Plan, Bilan...</span>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Téléversez les documents physiques scannés ou remis en main propre par le bénéficiaire lors de son passage à l'Espace PME. Ces pièces seront immédiatement consultables par l'expert lors de la mise en relation.
            </p>

            {/* Zone de drop/sélection de fichiers */}
            <div 
              onClick={() => docInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl p-5 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Glissez-déposez ou <span className="text-teal-600 font-semibold underline">cliquez pour sélectionner les documents</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, Images (CNI, RCCM, Devis, Plan d'affaires...)</p>
              <input
                ref={docInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAddDocuments}
              />
            </div>

            {/* Liste des documents ajoutés */}
            {attachedDocs.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    {attachedDocs.length} pièce(s) jointe(s) au dossier
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setAttachedDocs([])}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Tout retirer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {attachedDocs.map(doc => (
                    <div 
                      key={doc.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors text-xs"
                    >
                      <Paperclip className="w-4 h-4 text-teal-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate" title={doc.title}>
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(doc.file.size / 1024).toFixed(0)} Ko
                        </p>
                      </div>

                      {/* Sélecteur de catégorie */}
                      <select
                        value={doc.category}
                        onChange={(e) => handleUpdateDocCategory(doc.id, e.target.value)}
                        className="rounded border border-slate-300 bg-white text-[11px] py-1 px-2 text-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="IDENTITE">🪪 Pièce d'identité</option>
                        <option value="BUSINESS_PLAN">📊 Business Plan</option>
                        <option value="JURIDIQUE">⚖️ Juridique / RCCM</option>
                        <option value="FINANCIER">💰 Financier / Devis</option>
                        <option value="AUTRE">📁 Autre document</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Supprimer ce document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            disabled={createMut.isPending || isUploadingFiles} 
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] text-white font-medium shadow-sm transition-colors disabled:opacity-70 cursor-pointer"
          >
            {createMut.isPending || isUploadingFiles ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>{isUploadingFiles ? 'Envoi des documents...' : 'Enregistrement...'}</span>
              </>
            ) : (
              <>
                <Save className="size-5" />
                <span>Enregistrer le bénéficiaire</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
