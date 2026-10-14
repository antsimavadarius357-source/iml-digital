import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import quentinSailboat from '../../assets/quentin-sailboat-ocean.jpg';

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
  const [cookieAccepted, setCookieAccepted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  type RoleType = 'COACH' | 'AGENT' | 'ADMIN';
  const [selectedRole, setSelectedRole] = useState<RoleType>('COACH');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail || 'coach@imldigit.com', password: 'Password123!' }
  });

  const handleSelectRole = (r: RoleType) => {
    setSelectedRole(r);
    if (r === 'COACH') {
      setValue('email', 'coach@imldigit.com');
      setValue('password', 'Password123!');
    } else if (r === 'AGENT') {
      setValue('email', 'agent@imldigit.com');
      setValue('password', 'Password123!');
    } else if (r === 'ADMIN') {
      setValue('email', 'admin@imldigit.com');
      setValue('password', 'Password123!');
    }
  };

  useEffect(() => {
    if (prefilledEmail) {
      setValue('email', prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  const onSubmit = async (v: FormValues) => {
    setError(null);
    try {
      const loggedUser = await login(v.email, v.password);
      const userRole = loggedUser?.role || selectedRole;
      if (userRole === 'COACH') {
        navigate('/tableau-de-bord?vue=coach');
      } else if (userRole === 'AGENT') {
        navigate('/tableau-de-bord?vue=agent');
      } else {
        navigate('/tableau-de-bord?vue=direction');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Identifiant ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative selection:bg-[#f06553] selection:text-white bg-[#1e2a38]">
      <main className="flex-1 grid lg:grid-cols-12 min-h-screen">
        
        {/* =========================================================================
            GAUCHE : Formulaire de connexion sombre (Capture d'écran de référence)
           ========================================================================= */}
        <section className="lg:col-span-5 bg-[#1a2533] text-white px-8 sm:px-12 py-6 flex flex-col justify-center relative z-10 overflow-y-auto">
          
          <div className="max-w-[360px] w-full mx-auto space-y-5 my-auto">
            {/* Logo iml digit / style Teasio */}
            <div className="text-center space-y-0.5">
              <Link to="/" className="inline-block group">
                <span className="text-[2.4rem] font-bold tracking-tight text-white font-sans lowercase">
                  iml digit<span className="text-[#f06553]">.</span>
                </span>
              </Link>
              <p className="text-xs font-semibold text-[#f06553] tracking-wide">
                si proche de vous
              </p>
            </div>

            {/* Titre Bonjour ! */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-[1.65rem] font-extrabold text-[#38d9a9] tracking-tight">
                Bonjour !
              </h1>
              <p className="text-[13px] text-slate-300 leading-snug max-w-xs mx-auto">
                Pour vous connecter à votre compte, renseignez votre identifiant et votre mot de passe.
              </p>
            </div>

            {/* Distinction des Rôles & Missions depuis le formulaire de connexion */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-slate-300 text-center uppercase tracking-wider">
                Espace de connexion
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/70 border border-slate-700/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSelectRole('COACH')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    selectedRole === 'COACH'
                      ? 'bg-[#38d9a9] text-[#1a2533] shadow-md shadow-[#38d9a9]/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Coach</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('AGENT')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    selectedRole === 'AGENT'
                      ? 'bg-[#38d9a9] text-[#1a2533] shadow-md shadow-[#38d9a9]/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Agent IML</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole('ADMIN')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    selectedRole === 'ADMIN'
                      ? 'bg-[#38d9a9] text-[#1a2533] shadow-md shadow-[#38d9a9]/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Direction</span>
                </button>
              </div>

              {/* Description de la mission selon le rôle sélectionné */}
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-[11px] text-slate-300 leading-snug">
                {selectedRole === 'COACH' && (
                  <div>
                    <span className="font-semibold text-[#38d9a9]">Missions Coach :</span> Accompagnement de start-ups, PME, entreprises et organisations : suivi direct, diagnostic stratégique, séances de coaching et validation des jalons de parcours.
                  </div>
                )}
                {selectedRole === 'AGENT' && (
                  <div>
                    <span className="font-semibold text-[#38d9a9]">Missions Agent :</span> Coordination, réception des alertes globales et répartition des candidatures.
                  </div>
                )}
                {selectedRole === 'ADMIN' && (
                  <div>
                    <span className="font-semibold text-[#38d9a9]">Missions Direction :</span> Pilotage stratégique, administration de l'équipe et reporting global.
                  </div>
                )}
              </div>
            </div>

            {/* Formulaire de connexion */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              
              {/* Champ Identifiant */}
              <div>
                <label className="block text-[11px] font-medium text-slate-200 mb-1">
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
                <label className="block text-[11px] font-medium text-slate-200 mb-1">
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
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* Bouton Je me connecte (pilule arrondie corail centrée) */}
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-9 py-2.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-full shadow-lg shadow-[#f06553]/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer min-w-[180px]"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Je me connecte'}
                </button>
              </div>
            </form>

            {/* Liens Inscription & Mot de passe oublié */}
            <div className="text-center space-y-1 pt-0.5 text-xs">
              <p className="text-slate-300">
                Première connexion ?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-[#f06553] font-semibold hover:underline cursor-pointer"
                >
                  Authentifier mon e-mail ici.
                </button>
              </p>
              <div>
                <a href="#" className="text-[#f06553] font-semibold hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            {/* Badges Stores Mobile (App Store et Google Play) */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {/* App Store Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-white border border-slate-700 cursor-pointer hover:bg-black/80 transition-colors">
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.97.05-2.18.66-2.88 1.48-.62.71-1.15 1.88-.99 2.99 1.1.08 2.22-.56 2.88-1.37z" />
                </svg>
                <div className="text-left leading-none py-0.5">
                  <div className="text-[7.5px] uppercase text-slate-300 tracking-wider">Télécharger dans</div>
                  <div className="text-[11px] font-bold font-sans">l'App Store</div>
                </div>
              </div>

              {/* Google Play Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black text-white border border-slate-700 cursor-pointer hover:bg-black/80 transition-colors">
                <svg className="size-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M3.6 2.4L13.7 12 3.6 21.6c-.4-.4-.6-1-.6-1.7V4.1c0-.7.2-1.3.6-1.7z" />
                  <path fill="#34A853" d="M17.1 8.7L13.7 12l3.4 3.3 3.8-2.2c1.1-.6 1.1-1.6 0-2.2l-3.8-2.2z" />
                  <path fill="#EA4335" d="M3.6 2.4l10.1 9.6 3.4-3.3L6.8 2.8c-1.1-.6-2.3-.6-3.2-.4z" />
                  <path fill="#FBBC05" d="M17.1 15.3l-3.4-3.3-10.1 9.6c.9.2 2.1.2 3.2-.4l10.3-5.9z" />
                </svg>
                <div className="text-left leading-none py-0.5">
                  <div className="text-[7.5px] uppercase text-slate-300 tracking-wider">DISPONIBLE SUR</div>
                  <div className="text-[11px] font-bold font-sans">Google Play</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            DROITE : Grande photo bateau (Capture exacte de référence sans doublon)
           ========================================================================= */}
        <section className="hidden lg:block lg:col-span-7 relative overflow-hidden bg-slate-900">
          <div 
            className="absolute inset-0 bg-cover bg-top"
            style={{
              backgroundImage: `url(${quentinSailboat})`
            }}
          />
        </section>

      </main>

      {/* =========================================================================
          Bandeau Cookies en bas de page (comme dans la capture d'écran)
         ========================================================================= */}
      {!cookieAccepted && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#162232]/95 backdrop-blur-sm text-slate-300 text-xs px-6 py-3 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center sm:text-left text-[11px] sm:text-xs">
            Ce site utilise des cookies pour améliorer votre expérience utilisateur. En poursuivant votre navigation, vous acceptez leur utilisation.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCookieAccepted(true)}
              className="px-4 py-1.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              J'accepte
            </button>
            <a
              href="#"
              className="px-3 py-1.5 rounded-md bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              En savoir plus
            </a>
          </div>
        </div>
      )}

      {/* Modal d'authentification e-mail pour agent */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="connexion"
      />
    </div>
  );
}
