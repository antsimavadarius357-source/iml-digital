import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Loader2, Tag, Briefcase } from 'lucide-react';
import { api } from '../../lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sectors' | 'programs'>('sectors');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const { data: sectors, isLoading: isLoadingSectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => api<{ items: any[] }>('/settings/sectors').then(r => r.items)
  });

  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: () => api<{ items: any[] }>('/settings/programs').then(r => r.items)
  });

  const createSectorMut = useMutation({
    mutationFn: (name: string) => api('/settings/sectors', { method: 'POST', body: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      setNewItemName('');
    }
  });

  const createProgramMut = useMutation({
    mutationFn: (data: any) => api('/settings/programs', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setNewItemName('');
      setNewItemDesc('');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'sectors') createSectorMut.mutate(newItemName);
    else createProgramMut.mutate({ name: newItemName, description: newItemDesc });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-iml-700 text-white rounded-xl shadow-lg shadow-iml-700/20">
          <Settings className="size-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Paramètres globaux</h1>
          <p className="text-slate-500 mt-1">Configurez les référentiels de la plateforme.</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-sm border border-white/40 flex flex-col md:flex-row">
        {/* Sidebar settings */}
        <div className="w-full md:w-64 bg-slate-50/80 border-r border-slate-200 p-4 space-y-2 shrink-0">
          <button 
            onClick={() => setActiveTab('sectors')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'sectors' ? 'bg-iml-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <Tag className="size-4" /> Secteurs d'activité
          </button>
          <button 
            onClick={() => setActiveTab('programs')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'programs' ? 'bg-iml-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
          >
            <Briefcase className="size-4" /> Programmes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 bg-white/60">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {activeTab === 'sectors' ? "Secteurs d'activité" : "Programmes d'incubation"}
          </h2>
          
          <form onSubmit={handleCreate} className="flex gap-4 items-start mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex-1 space-y-4">
              <input 
                type="text" 
                placeholder={activeTab === 'sectors' ? "Nouveau secteur..." : "Nom du programme..."} 
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                required
                className="w-full rounded-xl border-slate-300 shadow-sm focus:ring-iml-500 p-2.5 bg-slate-50"
              />
              {activeTab === 'programs' && (
                <textarea 
                  placeholder="Description du programme..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:ring-iml-500 p-2.5 bg-slate-50"
                />
              )}
            </div>
            <button 
              type="submit" 
              disabled={createSectorMut.isPending || createProgramMut.isPending}
              className="shrink-0 flex items-center gap-2 bg-iml-700 text-white px-5 py-2.5 rounded-xl hover:bg-iml-900 transition-colors shadow-md disabled:opacity-50"
            >
              {(createSectorMut.isPending || createProgramMut.isPending) ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
              Ajouter
            </button>
          </form>

          <div className="space-y-3">
            {(activeTab === 'sectors' ? isLoadingSectors : isLoadingPrograms) && <div className="text-center py-10"><Loader2 className="size-8 animate-spin mx-auto text-iml-500" /></div>}
            
            {activeTab === 'sectors' && sectors?.map(s => (
              <div key={s.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <Tag className="size-5 text-iml-500" />
                <span className="font-medium text-slate-800">{s.name}</span>
              </div>
            ))}
            
            {activeTab === 'programs' && programs?.map(p => (
              <div key={p.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-1">
                  <Briefcase className="size-5 text-iml-500" />
                  <span className="font-bold text-slate-800 text-lg">{p.name}</span>
                </div>
                {p.description && <p className="text-slate-500 text-sm ml-8">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
