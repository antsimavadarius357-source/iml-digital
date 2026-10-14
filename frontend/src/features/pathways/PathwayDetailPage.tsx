import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CheckCircle2, Circle, Clock, LayoutList } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

export default function PathwayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ['pathway', id],
    queryFn: () => api<{ pathway: any }>(`/pathways/${id}`),
  });

  const stepMut = useMutation({
    mutationFn: ({ stepId, status }: { stepId: string, status: string }) => 
      api(`/pathways/steps/${stepId}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pathway', id] })
  });

  if (isLoading) return <div className="p-10 text-center"><Loader2 className="size-6 animate-spin mx-auto text-slate-400" /></div>;
  const p = res?.pathway;
  if (!p) return <div className="p-10 text-center text-red-500">Parcours introuvable.</div>;

  const completed = p.steps.filter((s: any) => s.status === 'TERMINE').length;
  const total = p.steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link to="/parcours" className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft className="size-5 text-slate-500" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parcours: {p.template.name}</h1>
          <p className="text-slate-500">{p.beneficiary.firstName} {p.beneficiary.lastName}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
          <span>Progression globale</span>
          <span>{pct}% ({completed} / {total} étapes)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <LayoutList className="size-5 text-iml-600" />
          <h2 className="font-bold text-slate-800">Étapes du parcours</h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {p.steps.map((s: any, idx: number) => {
            const isDone = s.status === 'TERMINE';
            const isActive = s.status === 'EN_COURS';
            return (
              <div key={s.id} className={`p-6 flex flex-col md:flex-row gap-4 transition-colors ${isDone ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                <div className="flex-shrink-0 mt-1">
                  {isDone ? <CheckCircle2 className="size-6 text-emerald-500" /> : 
                   isActive ? <Clock className="size-6 text-amber-500" /> :
                   <Circle className="size-6 text-slate-300" />}
                </div>
                
                <div className="flex-grow">
                  <h3 className={`font-semibold text-lg ${isDone ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                    Étape {idx + 1} : {s.title}
                  </h3>
                  {s.description && <p className="text-slate-600 mt-1 text-sm">{s.description}</p>}
                </div>

                {can('pathways:manage') && (
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {!isDone && (
                      <button 
                        onClick={() => stepMut.mutate({ stepId: s.id, status: 'TERMINE' })}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                      >
                        Valider
                      </button>
                    )}
                    {isDone && (
                      <button 
                        onClick={() => stepMut.mutate({ stepId: s.id, status: 'A_FAIRE' })}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
