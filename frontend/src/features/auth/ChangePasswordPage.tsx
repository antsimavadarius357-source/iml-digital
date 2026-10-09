import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const passwordRules = z
  .string()
  .min(12, 'Au moins 12 caractères')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

const schema = z
  .object({ currentPassword: z.string().min(1, 'Requis'), newPassword: passwordRules, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Les mots de passe ne correspondent pas' });
type Values = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: v.currentPassword, newPassword: v.newPassword } });
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Changement impossible');
    }
  };
  const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-iml-400';

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-xl font-semibold text-iml-900">Choisissez votre mot de passe</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email} : le mot de passe temporaire doit être remplacé avant de continuer.</p>
        {([['currentPassword', 'Mot de passe temporaire', 'current-password'], ['newPassword', 'Nouveau mot de passe', 'new-password'], ['confirm', 'Confirmer', 'new-password']] as const).map(([name, label, ac]) => (
          <div key={name} className="mt-4">
            <label htmlFor={name} className="text-sm font-medium text-slate-700">{label}</label>
            <input id={name} type="password" autoComplete={ac} className={input} {...register(name)} />
            {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]?.message}</p>}
          </div>
        ))}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-iml-700 hover:bg-iml-900 text-white py-2.5 text-sm font-medium disabled:opacity-60">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />} Enregistrer
        </button>
        <button type="button" onClick={() => void logout()} className="mt-3 w-full text-sm text-slate-500 hover:underline">Se déconnecter</button>
      </form>
    </main>
  );
}
