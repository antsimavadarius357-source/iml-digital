import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

const schema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (v: FormValues) => {
    setError(null);
    try {
      await login(v.email, v.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    }
  };

  const input =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-iml-400';

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-center p-16 text-white bg-gradient-to-br from-iml-900 via-iml-700 to-iml-500">
        <h1 className="text-4xl font-bold">IML <span className="text-iml-400">DIGITAL</span></h1>
        <p className="mt-4 text-lg text-white/80 max-w-md">
          La plateforme de suivi des porteurs de projets de l'Incubateur Multisectoriel de Libreville.
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-iml-900">Connexion</h2>
          <div className="mt-6">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">Adresse e-mail</label>
            <input id="email" type="email" autoComplete="username" className={input} {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="mt-4">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">Mot de passe</label>
            <input id="password" type="password" autoComplete="current-password" className={input} {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-iml-700 hover:bg-iml-900 text-white py-2.5 text-sm font-medium transition disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Se connecter
          </button>
        </form>
      </section>
    </main>
  );
}
