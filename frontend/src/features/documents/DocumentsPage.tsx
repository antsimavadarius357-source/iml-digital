import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, UploadCloud, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import AddDocumentWizardModal from './AddDocumentWizardModal';

export default function DocumentsPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);
  const [isCreateBeneficiaryOpen, setIsCreateBeneficiaryOpen] = useState(false);
  const { data: bRes, isLoading: isLoadingB } = useQuery({ 
    queryKey: ['beneficiaries-list'], 
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100') 
  });
  const beneficiaries = bRes?.items || [];

  const { data: docRes, isLoading } = useQuery({
    queryKey: ['documents', selectedOwner],
    queryFn: () => api<{ items: any[] }>(`/documents?beneficiaryId=${selectedOwner}`),
    enabled: !!selectedOwner
  });
  const documents = docRes?.items || [];

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api(`/documents/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', selectedOwner] })
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestion Documentaire</h1>
      </div>

      {isLoadingB ? (
        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-[#23c3b1]" /></div>
      ) : beneficiaries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 sm:p-12 flex flex-col items-center text-center max-w-lg mx-auto my-6 animate-in fade-in duration-200">
          <div className="size-16 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center mb-5 text-slate-700 shadow-2xs">
            <FileText className="size-7 stroke-[1.5]" />
          </div>
          <h2 className="text-xl sm:text-[22px] font-semibold text-slate-800 tracking-tight mb-2.5">
            Envoyer un document
          </h2>
          <p className="text-slate-600 text-sm sm:text-[14.5px] leading-relaxed mb-7 max-w-sm font-normal">
            Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir envoyer un document.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateBeneficiaryOpen(true)}
            className="px-7 py-2.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-sm font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            Créer un bénéficiaire
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Sélectionner un bénéficiaire pour voir ou ajouter des documents</label>
          <select 
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="w-full max-w-md rounded-xl border-slate-300 shadow-sm focus:border-iml-500 focus:ring-iml-500 p-3 bg-white/50 backdrop-blur"
          >
            <option value="">-- Choisir un bénéficiaire --</option>
            {beneficiaries.map((b: any) => (
              <option key={b.id} value={b.id}>{b.firstName} {b.lastName} ({b.fileNumber})</option>
            ))}
          </select>
        </div>
      )}

      {selectedOwner && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Dossier sélectionné</h2>
            <button 
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-iml-700 text-white px-5 py-2.5 rounded-xl hover:bg-iml-900 transition-colors shadow-md"
            >
              <UploadCloud className="size-5" /> Ajouter un document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && <div className="col-span-full py-10 text-center"><Loader2 className="size-8 animate-spin mx-auto text-iml-500" /></div>}
            {!isLoading && documents.length === 0 && (
              <div className="col-span-full glass rounded-2xl p-10 text-center text-slate-500 border border-slate-200 border-dashed">
                Aucun document dans ce dossier.
              </div>
            )}
            
            {documents.map(doc => (
              <div key={doc.id} className="card-premium p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-iml-50 text-iml-700 rounded-xl">
                    <FileText className="size-7" />
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    doc.status === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                    doc.status === 'REJETE' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-800 mb-1 line-clamp-1" title={doc.title}>{doc.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{doc.category}</p>

                <div className="mt-auto space-y-3">
                  <a href={`http://localhost:4000/api/v1/documents/${doc.id}/download`} target="_blank" rel="noreferrer" className="block text-center w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                    Télécharger
                  </a>
                  
                  {can('applications:review') && doc.status === 'EN_ATTENTE' && (
                    <div className="flex gap-2">
                      <button onClick={() => statusMut.mutate({ id: doc.id, status: 'VALIDE' })} className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors">
                        <CheckCircle className="size-4" /> Valider
                      </button>
                      <button onClick={() => statusMut.mutate({ id: doc.id, status: 'REJETE' })} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors">
                        <XCircle className="size-4" /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assistant d'ajout de document en 5 étapes */}
      <AddDocumentWizardModal 
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['documents', selectedOwner] });
          setShowUpload(false);
        }}
      />

      {/* Modale de création au premier plan */}
      <CreateBeneficiaryModal 
        isOpen={isCreateBeneficiaryOpen}
        onClose={() => setIsCreateBeneficiaryOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
          queryClient.invalidateQueries({ queryKey: ['beneficiaries-count'] });
        }}
      />
    </div>
  );
}
