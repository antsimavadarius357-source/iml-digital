import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import Iml3DShowcaseAnimation from './Iml3DShowcaseAnimation';

const schema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as any)?.email || '';

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail || '', password: '' }
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValue('email', prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  const onSubmit = async (v: FormValues) => {
    setError(null);
    try {
      const loggedUser = await login(v.email, v.password);
      if (loggedUser?.role === 'COACH') {
        navigate('/tableau-de-bord?vue=coach');
      } else if (loggedUser?.role === 'AGENT') {
        navigate('/tableau-de-bord?vue=agent');
      } else {
        navigate('/tableau-de-bord?vue=direction');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Identifiant ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans relative selection:bg-[#f06553] selection:text-white bg-[#1e2a38] overflow-y-auto lg:overflow-hidden lg:h-screen">
      <main className="flex-1 grid lg:grid-cols-12 min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden">
        
        {/* =========================================================================
            GAUCHE : Formulaire de connexion sombre (Conforme à la maquette de référence)
           ========================================================================= */}
        <section className="lg:col-span-5 bg-[#1a2533] text-white px-6 sm:px-12 py-6 flex flex-col justify-between relative z-10 overflow-y-auto h-full">
          
          {/* Bouton Retour sur le site */}
          <div className="w-full flex items-center justify-start pb-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-750 px-3.5 py-1.5 rounded-full border border-slate-700/80 transition-all cursor-pointer shadow-sm group"
            >
              <ArrowLeft className="size-3.5 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-white transition-transform" />
              <span>Retour sur le site</span>
            </button>
          </div>
          
          <div className="max-w-[360px] w-full mx-auto space-y-4 my-auto">
            {/* Titre épuré */}
            <div className="text-center space-y-1.5 pb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Connexion
              </h1>
              <p className="text-xs text-slate-300 leading-snug max-w-xs mx-auto">
                Pour vous connecter à votre compte, renseignez votre identifiant et votre mot de passe.
              </p>
            </div>

            {/* Formulaire de connexion */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              
              {/* Champ Identifiant */}
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Identifiant <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="Mon email"
                  {...register('email')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all shadow-inner"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#f87d6d]">{errors.email.message}</p>
                )}
              </div>

              {/* Champ Mot de passe */}
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Mot de passe <span className="text-[#f06553]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Entrez votre mot de passe"
                    {...register('password')}
                    className="w-full px-3.5 py-2.5 pr-20 rounded-lg bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#f06553] transition-all shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#f06553] hover:opacity-80 transition-opacity cursor-pointer p-0.5"
                      tabIndex={-1}
                      aria-label="Afficher ou masquer le mot de passe"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <Lock className="size-4 text-slate-400" />
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#f87d6d]">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg text-center">
                  {error}
                </div>
              )}

              {/* Bouton Se connecter (pilule arrondie corail centrée) */}
              <div className="flex justify-center pt-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-2.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-full shadow-lg shadow-[#f06553]/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span>Se connecter</span>
                  )}
                </button>
              </div>
            </form>

            {/* Liens Inscription & Mot de passe oublié */}
            <div className="text-center space-y-1 pt-1 text-xs">
              <p className="text-slate-300">
                Pas de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-[#f06553] font-semibold hover:underline cursor-pointer"
                >
                  Inscrivez-vous ici.
                </button>
              </p>
              <div>
                <a href="#" className="text-[#f06553] font-semibold hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

          </div>
          {/* Équilibreur d'alignement vertical */}
          <div className="hidden lg:block h-8" />
        </section>

        {/* =========================================================================
            DROITE : Grande Vitrine 3D IML animée en JavaScript (Parallaxe 3D, Particules, Reflets)
           ========================================================================= */}
        <section className="hidden lg:block lg:col-span-7 relative overflow-hidden bg-[#070d14]">
          <Iml3DShowcaseAnimation />
        </section>

      </main>


      {/* Modal d'authentification e-mail / Inscription */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="inscription"
      />
    </div>
  );
}
