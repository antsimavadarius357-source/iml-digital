import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, ArrowLeft, Mail, ShieldCheck, Sparkles } from 'lucide-react';
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

  const handleQuickFill = (roleEmail: string) => {
    setValue('email', roleEmail);
    setValue('password', 'Test@1234');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans relative selection:bg-[#f06553] selection:text-white bg-[#0b131e] overflow-y-auto lg:overflow-hidden lg:h-screen">
      <main className="flex-1 grid lg:grid-cols-12 min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden relative">
        
        {/* =========================================================================
            GAUCHE : Formulaire de connexion moderne & immersif (Mobile & Desktop)
           ========================================================================= */}
        <section className="lg:col-span-5 bg-gradient-to-b from-[#0e1926] via-[#122133] to-[#0a121c] text-white px-5 sm:px-10 py-6 flex flex-col justify-between relative z-10 overflow-y-auto h-full">
          
          {/* LUEURS D'AMBIANCE ARRIÈRE-PLAN (EFFET NÉON MODERNE) */}
          <div className="absolute -top-24 -left-24 size-80 bg-[#f06553]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 size-80 bg-[#23c3b1]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/3 size-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Navigation supérieure : Retour sur le site */}
          <div className="w-full flex items-center justify-between pb-3 relative z-10">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 px-3.5 py-1.5 rounded-full border border-slate-700/70 transition-all cursor-pointer shadow-md group backdrop-blur-xs"
            >
              <ArrowLeft className="size-3.5 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-white transition-transform" />
              <span>Retour sur le site</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Portail Pro v2.4</span>
            </span>
          </div>
          
          {/* CARTE CENTRALE EN GLASSMORPHISME POUR MOBILE & DESKTOP */}
          <div className="w-full max-w-[410px] mx-auto my-auto relative z-10 py-3">
            <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-4">
              
              {/* Logo officiel IML Digit & Badge d'autorité */}
              <div className="text-center space-y-2">
                <div className="inline-flex relative group mx-auto mb-1">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#f06553] via-[#23c3b1] to-[#f06553] rounded-2xl blur-md opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse" />
                  <div className="relative size-16 rounded-2xl bg-[#09131d] border border-slate-700 p-2 shadow-xl flex items-center justify-center overflow-hidden">
                    <img src="/logo.jpg" alt="IML Digit" className="w-full h-full object-contain rounded-xl" />
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800/90 text-[#23c3b1] border border-slate-700/80 shadow-xs mb-1">
                    <Sparkles className="size-3 text-[#23c3b1]" />
                    <span>Incubateur IML Digit Gabon</span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Espace Pro & Décisionnel
                  </h1>
                  <p className="text-xs text-slate-300 leading-snug mt-1 max-w-xs mx-auto">
                    Accès réservé aux coachs, experts-mentors et à la direction de l'incubateur.
                  </p>
                </div>
              </div>

              {/* Raccourcis 1-clic pour connexion rapide (très pratique sur smartphone) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  Rôles d'accès rapide :
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('coach@imldigit.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-[11px] font-bold text-slate-200 hover:text-white transition-all text-center flex items-center justify-center gap-1 cursor-pointer hover:border-[#23c3b1]/50"
                  >
                    <span>👔 Coach</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('agent@imldigit.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-[11px] font-bold text-slate-200 hover:text-white transition-all text-center flex items-center justify-center gap-1 cursor-pointer hover:border-[#23c3b1]/50"
                  >
                    <span>📋 Agent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('direction@imldigit.com')}
                    className="px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-[11px] font-bold text-slate-200 hover:text-white transition-all text-center flex items-center justify-center gap-1 cursor-pointer hover:border-[#f06553]/50"
                  >
                    <span>👑 Direction</span>
                  </button>
                </div>
              </div>

              {/* Formulaire de connexion */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-1">
                
                {/* Champ Identifiant */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Identifiant professionnel <span className="text-[#f06553]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="username"
                      placeholder="coach@imldigit.com"
                      {...register('email')}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#f06553] focus:ring-2 focus:ring-[#f06553]/25 transition-all shadow-inner"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#f87d6d]">{errors.email.message}</p>
                  )}
                </div>

                {/* Champ Mot de passe */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Mot de passe confidentiel <span className="text-[#f06553]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Entrez votre mot de passe"
                      {...register('password')}
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#f06553] focus:ring-2 focus:ring-[#f06553]/25 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f06553] transition-colors cursor-pointer p-1"
                      tabIndex={-1}
                      aria-label="Afficher ou masquer le mot de passe"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[#f87d6d]">{errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-200 text-xs rounded-xl text-center font-medium animate-in fade-in">
                    {error}
                  </div>
                )}

                {/* Bouton Accéder à mon espace (Vibrant & Pleine largeur) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-[#f06553] via-[#ff6b57] to-[#e04a27] hover:from-[#e04a27] hover:to-[#c83719] text-white font-black rounded-2xl shadow-xl shadow-[#f06553]/35 hover:shadow-[#f06553]/50 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        <span>Accéder à mon espace de travail</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sceau de confiance et sécurité */}
              <div className="pt-2 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>Connexion chiffrée SSL 256-bit • Libreville, Gabon</span>
                </p>
              </div>

            </div>
          </div>
          
          {/* Équilibreur d'alignement vertical */}
          <div className="h-4" />
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
