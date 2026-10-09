import { useQuery } from '@tanstack/react-query';
import { Briefcase, Loader2, UsersRound } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

interface Summary {
  activePrograms: number | null;
  activeUsers: number | null;
}

function Card({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Briefcase }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className="size-11 rounded-lg bg-iml-50 text-iml-500 grid place-items-center"><Icon className="size-5" /></div>
      <div>
        <div className="text-2xl font-bold text-iml-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api<Summary>('/dashboard/summary'),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-iml-900">Bonjour {user?.firstName}</h2>
        <p className="text-slate-500 text-sm">{user?.roleLabel}</p>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="size-4 animate-spin" /> Chargement…</div>}
      {isError && (
        <div role="alert" className="rounded-lg bg-red-50 text-red-700 text-sm p-4">
          Impossible de charger les indicateurs.{' '}
          <button className="underline" onClick={() => void refetch()}>Réessayer</button>
        </div>
      )}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.activePrograms !== null && <Card label="Programmes actifs" value={data.activePrograms} icon={Briefcase} />}
          {data.activeUsers !== null && <Card label="Utilisateurs actifs" value={data.activeUsers} icon={UsersRound} />}
        </div>
      )}
      {data && data.activePrograms === null && data.activeUsers === null && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Vos indicateurs apparaîtront ici dès que les modules de suivi seront disponibles.
        </p>
      )}
    </div>
  );
}
