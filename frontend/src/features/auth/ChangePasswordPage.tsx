import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ImlLogo from '../../components/common/ImlLogo';

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
  const input = 'mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all';

  return (
    <main className="min-h-screen grid place-items-center p-4 sm:p-6 bg-[#0f172a]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4">
        <div className="flex justify-center pb-1">
          <ImlLogo variant="full" size="md" />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-slate-900">Choisissez votre mot de passe</h1>
          <p className="text-xs text-slate-500 leading-snug">
            <span className="font-semibold text-slate-700">{user?.email}</span><br />
            Le mot de passe temporaire doit être remplacé avant d'accéder à votre espace IML Digit.
          </p>
        </div>
        {([['currentPassword', 'Mot de passe temporaire', 'current-password'], ['newPassword', 'Nouveau mot de passe', 'new-password'], ['confirm', 'Confirmer le nouveau mot de passe', 'new-password']] as const).map(([name, label, ac]) => (
          <div key={name} className="mt-3">
            <label htmlFor={name} className="text-xs font-semibold text-slate-700">{label}</label>
            <input id={name} type="password" autoComplete={ac} placeholder="" className={input} {...register(name)} />
            {errors[name] && <p className="mt-1 text-xs text-rose-600">{errors[name]?.message}</p>}
          </div>
        ))}
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs p-3 text-center">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white py-2.5 text-sm font-bold shadow-lg shadow-[#f06553]/25 transition-all disabled:opacity-60 cursor-pointer">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          <span>Valider et accéder à l'espace IML</span>
        </button>
        <div className="pt-2 text-center">
          <button type="button" onClick={() => void logout()} className="text-xs text-slate-500 hover:text-slate-700 hover:underline cursor-pointer">
            Se déconnecter
          </button>
        </div>
      </form>
    </main>
  );
}
