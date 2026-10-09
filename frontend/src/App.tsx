import { useQuery } from '@tanstack/react-query';

interface Health {
  status: string;
  database: string;
}

async function fetchHealth(): Promise<Health> {
  const res = await fetch('/api/v1/health');
  const body = (await res.json()) as Health;
  if (!res.ok) throw new Error(body.database);
  return body;
}

export default function App() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['health'], queryFn: fetchHealth, retry: false });

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-iml-900">
          IML <span className="text-iml-400">DIGITAL</span>
        </h1>
        <p className="mt-1 text-slate-500 text-sm">Incubateur Multisectoriel de Libreville</p>
        <div className="mt-6 text-sm" role="status">
          {isLoading && 'Vérification du serveur…'}
          {isError && <span className="text-red-600">API ou base de données indisponible</span>}
          {data && <span className="text-emerald-600">API : {data.status} · Base : {data.database}</span>}
        </div>
      </section>
    </main>
  );
}
