import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Map, Plus, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import BeneficiaryRequiredModal from '../beneficiaries/BeneficiaryRequiredModal';
import RecordServiceModal from '../services/RecordServiceModal';

export default function PathwaysPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [isCreateBeneficiaryOpen, setIsCreateBeneficiaryOpen] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);
  const [isRecordServiceOpen, setIsRecordServiceOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['pathways'], queryFn: () => api<{ items: any[] }>('/pathways').then(r => r.items) });
  const { data: bRes } = useQuery({ 
    queryKey: ['beneficiaries-list'], 
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100') 
  });
  const beneficiaries = bRes?.items || [];
  const { data: templatesRes } = useQuery({ queryKey: ['pathway-templates'], queryFn: () => api<{ templates: any[] }>('/pathways/templates') });
  const templates = templatesRes?.templates || [];

  const createMut = useMutation({
    mutationFn: (data: any) => api('/pathways', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      setShowModal(false);
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({ beneficiaryId: fd.get('beneficiaryId'), templateId: fd.get('templateId') });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Parcours d'Incubation & Prestations</h1>
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => {
              if (beneficiaries.length === 0) {
                setShowRequiredModal(true);
              } else {
                setIsRecordServiceOpen(true);
              }
            }}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Clock className="size-4 text-slate-500" /> Enregistrer une prestation
          </button>
          {can('pathways:manage') && (
            <button 
              type="button"
              onClick={() => {
                if (beneficiaries.length === 0) {
                  setShowRequiredModal(true);
                } else {
                  setShowModal(true);
                }
              }} 
              className="flex items-center gap-2 bg-[#23c3b1] hover:bg-[#1db09e] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="size-4" /> Démarrer un parcours
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <div className="col-span-full text-center p-10"><Loader2 className="size-6 animate-spin mx-auto text-slate-400" /></div>}
        {beneficiaries.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="size-16 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center mb-5 text-slate-700 shadow-2xs">
              <Clock className="size-7 stroke-[1.5]" />
            </div>
            <h2 className="text-xl sm:text-[22px] font-semibold text-slate-800 tracking-tight mb-2.5">
              Enregistrer une prestation
            </h2>
            <p className="text-slate-600 text-sm sm:text-[14.5px] leading-relaxed mb-7 max-w-sm font-normal">
              Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir enregistrer une prestation ou démarrer un parcours.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateBeneficiaryOpen(true)}
              className="px-7 py-2.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-sm font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              Créer un bénéficiaire
            </button>
          </div>
        ) : data?.length === 0 ? (
          <div className="col-span-full p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Aucun parcours en cours.</div>
        ) : null}
        
        {data?.map(p => (
          <Link key={p.id} to={`/parcours/${p.id}`} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:border-iml-400 hover:shadow-md transition-all p-5 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-iml-50 text-iml-700 rounded-lg group-hover:bg-iml-100 transition-colors">
                <Map className="size-6" />
              </div>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                {p.status}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-800 mb-1">{p.beneficiary.firstName} {p.beneficiary.lastName}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-grow">{p.template.name}</p>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Progression</span>
                <span>{p.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Démarrer un parcours</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bénéficiaire</label>
                <select name="beneficiaryId" required className="w-full rounded-md border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 p-2 border">
                  <option value="">Sélectionner...</option>
                  {beneficiaries.map((b: any) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName} ({b.fileNumber})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modèle de parcours</label>
                <select name="templateId" required className="w-full rounded-md border-slate-300 shadow-sm p-2 border">
                  <option value="">Sélectionner...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={createMut.isPending} className="px-4 py-2 bg-iml-700 text-white rounded-lg hover:bg-iml-900 disabled:opacity-50">Démarrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avertissement bénéficiaire requis */}
      <BeneficiaryRequiredModal
        isOpen={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        onOpenCreateBeneficiary={() => setIsCreateBeneficiaryOpen(true)}
        title="Démarrer un parcours"
        message="Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir démarrer un parcours d'accompagnement."
        icon={Clock}
      />

      {/* Modale de création d'un bénéficiaire */}
      <CreateBeneficiaryModal
        isOpen={isCreateBeneficiaryOpen}
        onClose={() => setIsCreateBeneficiaryOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
          queryClient.invalidateQueries({ queryKey: ['beneficiaries-count'] });
        }}
      />

      {/* Modale Enregistrement d'une prestation */}
      <RecordServiceModal
        isOpen={isRecordServiceOpen}
        onClose={() => setIsRecordServiceOpen(false)}
      />
    </div>
  );
}
