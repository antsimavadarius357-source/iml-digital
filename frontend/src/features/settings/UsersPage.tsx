import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, Plus, Search, UserCheck, UserX, X } from 'lucide-react';
import { api } from '../../lib/api';
import { passwordRules } from '../auth/ChangePasswordPage';
import { useAuth } from '../auth/AuthContext';

interface Row {
  id: string; email: string; firstName: string; lastName: string; isActive: boolean;
  lastLoginAt: string | null; role: { code: string; label: string };
}
interface Role { code: string; label: string }
interface Page { items: Row[]; total: number; page: number; pageSize: number }

const createSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  firstName: z.string().trim().min(1, 'Prénom requis'),
  lastName: z.string().trim().min(1, 'Nom requis'),
  role: z.string().min(1, 'Rôle requis'),
  temporaryPassword: passwordRules,
});
type CreateValues = z.infer<typeof createSchema>;

const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-iml-400';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-iml-900">{title}</h3>
          <button onClick={onClose} aria-label="Fermer"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateUserModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (v: CreateValues) => {
    setError(null);
    try {
      await api('/users', { method: 'POST', body: v });
      await qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création impossible');
    }
  };
  return (
    <Modal title="Nouvel utilisateur" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        {([['firstName', 'Prénom', 'text'], ['lastName', 'Nom', 'text'], ['email', 'Adresse e-mail', 'email']] as const).map(([n, l, t]) => (
          <div key={n}>
            <label htmlFor={`c-${n}`} className="text-sm font-medium text-slate-700">{l}</label>
            <input id={`c-${n}`} type={t} className={field} {...register(n)} />
            {errors[n] && <p className="text-xs text-red-600 mt-1">{errors[n]?.message}</p>}
          </div>
        ))}
        <div>
          <label htmlFor="c-role" className="text-sm font-medium text-slate-700">Rôle</label>
          <select id="c-role" className={field} defaultValue="" {...register('role')}>
            <option value="" disabled>Choisir…</option>
            {roles.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
          {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}
        </div>
        <div>
          <label htmlFor="c-pwd" className="text-sm font-medium text-slate-700">Mot de passe temporaire</label>
          <input id="c-pwd" type="password" autoComplete="new-password" className={field} {...register('temporaryPassword')} />
          {errors.temporaryPassword && <p className="text-xs text-red-600 mt-1">{errors.temporaryPassword.message}</p>}
          <p className="text-xs text-slate-500 mt-1">L'utilisateur devra le changer à sa première connexion. Transmettez-le par un canal sûr.</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center gap-2 rounded-lg bg-iml-700 hover:bg-iml-900 text-white py-2.5 text-sm font-medium disabled:opacity-60">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />} Créer le compte
        </button>
      </form>
    </Modal>
  );
}

function ResetModal({ user, onClose }: { user: Row; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pwd, setPwd] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/users/${user.id}/reset-password`, { method: 'POST', body: { temporaryPassword: pwd } }),
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  });
  const valid = passwordRules.safeParse(pwd).success;
  return (
    <Modal title={`Réinitialiser le mot de passe de ${user.firstName} ${user.lastName}`} onClose={onClose}>
      <label htmlFor="r-pwd" className="text-sm font-medium text-slate-700">Nouveau mot de passe temporaire</label>
      <input id="r-pwd" type="password" autoComplete="new-password" className={field} value={pwd} onChange={(e) => setPwd(e.target.value)} />
      <p className="text-xs text-slate-500 mt-1">12 caractères minimum, avec majuscule, minuscule et chiffre. Les sessions actives seront fermées.</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}
      <button disabled={!valid || m.isPending} onClick={() => m.mutate()} className="mt-4 w-full rounded-lg bg-iml-700 hover:bg-iml-900 text-white py-2.5 text-sm font-medium disabled:opacity-50">
        Réinitialiser
      </button>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Row | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ['users', search, page],
    queryFn: () => api<Page>(`/users?page=${page}&search=${encodeURIComponent(search)}`),
    placeholderData: (prev) => prev,
  });
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => api<{ items: Role[] }>('/users/roles') });

  const toggle = useMutation({
    mutationFn: (u: Row) => api(`/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } }),
    onSuccess: () => { setActionError(null); return qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e) => setActionError(e.message),
  });
  const changeRole = useMutation({
    mutationFn: (v: { id: string; role: string }) => api(`/users/${v.id}`, { method: 'PATCH', body: { role: v.role } }),
    onSuccess: () => { setActionError(null); return qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e) => setActionError(e.message),
  });

  const confirmToggle = (u: Row) => {
    const msg = u.isActive
      ? `Désactiver ${u.firstName} ${u.lastName} ? Ses sessions seront fermées immédiatement.`
      : `Réactiver ${u.firstName} ${u.lastName} ?`;
    if (window.confirm(msg)) toggle.mutate(u);
  };

  const data = users.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Rechercher un utilisateur" placeholder="Rechercher (nom, e-mail)…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-iml-400" />
        </div>
        <button onClick={() => setCreating(true)} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-iml-700 hover:bg-iml-900 text-white px-4 py-2 text-sm font-medium">
          <Plus className="size-4" /> Nouvel utilisateur
        </button>
      </div>

      {actionError && <p role="alert" className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{actionError}</p>}
      {users.isError && <p role="alert" className="rounded-lg bg-red-50 text-red-700 text-sm p-3">Impossible de charger les utilisateurs. <button className="underline" onClick={() => void users.refetch()}>Réessayer</button></p>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="p-3">Nom</th><th className="p-3">Rôle</th><th className="p-3">Statut</th><th className="p-3 hidden md:table-cell">Dernière connexion</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {users.isLoading && <tr><td colSpan={5} className="p-6 text-center text-slate-500"><Loader2 className="size-4 animate-spin inline" /> Chargement…</td></tr>}
            {data?.items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Aucun utilisateur trouvé.</td></tr>}
            {data?.items.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3"><div className="font-medium text-slate-800">{u.firstName} {u.lastName}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                <td className="p-3">
                  <select aria-label={`Rôle de ${u.firstName} ${u.lastName}`} value={u.role.code} disabled={u.id === me?.id || changeRole.isPending}
                    onChange={(e) => { if (window.confirm('Changer le rôle fermera les sessions de cet utilisateur. Continuer ?')) changeRole.mutate({ id: u.id, role: e.target.value }); }}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-60">
                    {roles.data?.items.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                  </select>
                </td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.isActive ? 'Actif' : 'Désactivé'}</span></td>
                <td className="p-3 hidden md:table-cell text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button title="Réinitialiser le mot de passe" aria-label="Réinitialiser le mot de passe" onClick={() => setResetting(u)} className="p-2 rounded-md hover:bg-slate-100"><KeyRound className="size-4" /></button>
                    {u.id !== me?.id && (
                      <button title={u.isActive ? 'Désactiver' : 'Réactiver'} aria-label={u.isActive ? 'Désactiver' : 'Réactiver'} onClick={() => confirmToggle(u)} className="p-2 rounded-md hover:bg-slate-100">
                        {u.isActive ? <UserX className="size-4 text-red-600" /> : <UserCheck className="size-4 text-emerald-600" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{data?.total ?? 0} utilisateur(s)</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-md border border-slate-300 disabled:opacity-40">Précédent</button>
          <span>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-md border border-slate-300 disabled:opacity-40">Suivant</button>
        </div>
      </div>

      {creating && <CreateUserModal roles={roles.data?.items ?? []} onClose={() => setCreating(false)} />}
      {resetting && <ResetModal user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
