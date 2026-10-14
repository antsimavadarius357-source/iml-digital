import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, FileText, Loader2, Mail, MapPin, Phone, User, Edit } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { TYPE_LABELS, STATUS_LABELS, STATUS_STYLE, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type BeneficiaryDetail } from './types';
import { useSetBreadcrumbs } from '../../components/layout/AppBreadcrumb';

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => api<{ beneficiary: BeneficiaryDetail }>(`/beneficiaries/${id}`),
  });

  const b = res?.beneficiary;

  useSetBreadcrumbs(
    b ? [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: `${b.firstName} ${b.lastName}`, icon: User }
    ] : [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: 'Dossier bénéficiaire', icon: User }
    ]
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-iml-500" />
      </div>
    );
  }

  if (isError || !b) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
        <p className="mb-4">Impossible de charger les détails du dossier.</p>
        <button onClick={() => void refetch()} className="font-medium underline hover:text-red-900">Réessayer</button>
      </div>
    );
  }

  const p = b.projects[0]; // Currently considering one project per beneficiary
  
  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/beneficiaires')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="size-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{b.firstName} {b.lastName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[b.status]}`}>
                {STATUS_LABELS[b.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Dossier n° {b.fileNumber} · Ajouté le {new Date(b.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        
        {can('beneficiaries:write') && (
          <Link to={`/beneficiaires/${id}/modifier`} className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Edit className="size-4" />
            Modifier le dossier
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Beneficiary Details */}
        <div className="space-y-6 lg:col-span-1">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Informations Contact</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="size-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-700">{TYPE_LABELS[b.type]}</div>
                  <div className="text-xs text-slate-500">Type de profil</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-5 text-slate-400 mt-0.5" />
                <div>
                  <a href={`mailto:${b.email}`} className="text-sm font-medium text-iml-700 hover:underline">{b.email}</a>
                  <div className="text-xs text-slate-500">E-mail</div>
                </div>
              </div>
              {b.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="size-5 text-slate-400 mt-0.5" />
                  <div>
                    <a href={`tel:${b.phone}`} className="text-sm font-medium text-slate-700 hover:underline">{b.phone}</a>
                    <div className="text-xs text-slate-500">Téléphone</div>
                  </div>
                </div>
              )}
              {b.city && (
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">{b.city}</div>
                    <div className="text-xs text-slate-500">Localisation</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Suivi & Accompagnement</h2>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Agent responsable</div>
                <div className="text-sm font-medium text-slate-800">
                  {b.assignedAgent ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` : <span className="text-slate-400 italic">Non assigné</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Programme d'incubation</div>
                <div className="text-sm font-medium text-slate-800">
                  {b.program?.name || <span className="text-slate-400 italic">Aucun programme</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Niveau de priorité</div>
                <div className="text-sm font-medium text-slate-800">{PRIORITY_LABELS[b.priority]}</div>
              </div>
              {b.startDate && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Date de début d'accompagnement</div>
                  <div className="text-sm font-medium text-slate-800">{new Date(b.startDate).toLocaleDateString('fr-FR')}</div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Project Details */}
        <div className="space-y-6 lg:col-span-2">
          {p ? (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="size-6 text-iml-600" />
                  <h2 className="text-xl font-bold text-slate-800">{p.name}</h2>
                </div>
                {p.sector && (
                  <div className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    Secteur : {p.sector.name}
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Description du projet</h3>
                  {p.description ? (
                    <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{p.description}</p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">Aucune description fournie.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Stade d'avancement</div>
                    <div className="text-sm font-medium text-slate-800">{STAGE_LABELS[p.stage]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Type de projet</div>
                    <div className="text-sm font-medium text-slate-800">{p.projectType || '—'}</div>
                  </div>
                  
                  {b.type === 'ENTREPRISE' && (
                    <>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Date de création</div>
                        <div className="text-sm font-medium text-slate-800">
                          {p.companyCreatedAt ? new Date(p.companyCreatedAt).toLocaleDateString('fr-FR') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Statut Juridique</div>
                        <div className="text-sm font-medium text-slate-800">{p.legalStatus || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Taille</div>
                        <div className="text-sm font-medium text-slate-800">{p.companySize ? SIZE_LABELS[p.companySize] : '—'}</div>
                      </div>
                    </>
                  )}
                </div>

                {p.priorityNeeds && (
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Besoins prioritaires</h3>
                    <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{p.priorityNeeds}</p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <FileText className="size-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Aucun projet</h3>
              <p className="text-slate-500 text-sm">Ce bénéficiaire n'a pas encore de projet associé.</p>
            </div>
          )}

          {b.initialObjectives && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Objectifs initiaux</h2>
              <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{b.initialObjectives}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
