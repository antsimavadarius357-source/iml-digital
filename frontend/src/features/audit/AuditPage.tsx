import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Loader2, Activity } from 'lucide-react';
import { api } from '../../lib/api';

export default function AuditPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api<{ items: any[] }>('/audit').then(r => r.items)
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-iml-700 text-white rounded-xl shadow-lg shadow-iml-700/20">
          <ShieldCheck className="size-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Journal d'Audit</h1>
          <p className="text-slate-500 mt-1">Traçabilité complète des actions de sécurité et des accès au système.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-sm border border-white/40">
        <div className="space-y-4">
          {isLoading && <div className="py-10 text-center"><Loader2 className="size-8 animate-spin mx-auto text-iml-500" /></div>}
          {!isLoading && logs?.length === 0 && <div className="text-center text-slate-500">Aucun journal d'audit enregistré.</div>}
          
          {logs?.map(log => (
            <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-slate-200">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg shrink-0">
                <Activity className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">
                  {log.action}
                </p>
                <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    <strong className="text-slate-700">Utilisateur:</strong>{' '}
                    {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.role.code})` : 'Système / Anonyme'}
                  </span>
                  <span><strong className="text-slate-700">Date:</strong> {new Date(log.createdAt).toLocaleString()}</span>
                  {log.ipAddress && <span><strong className="text-slate-700">IP:</strong> {log.ipAddress}</span>}
                  {log.entityType && <span><strong className="text-slate-700">Cible:</strong> {log.entityType} ({log.entityId})</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
