import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'inscription' | 'connexion';
}

export function openAuthModal(tab: 'inscription' | 'connexion' = 'inscription') {
  window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab } }));
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(40);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setOtp(['', '', '', '', '', '']);
      setIsSending(false);
      setIsVerifying(false);
      setIsVerified(false);
      setErrorMessage(null);
      setGoogleNotice(null);
    }
  }, [isOpen]);

  // Countdown timer in step 2
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSending(true);
    setErrorMessage(null);

    try {
      await api<{ success: boolean; simulated?: boolean; code?: string }>('/auth/send-otp', {
        method: 'POST',
        body: { email },
      });
    } catch {
      // Si le backend est en cours ou indisponible, continuer en mode démo
    } finally {
      setIsSending(false);
      setCountdown(40);
      setStep('verify');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if filled
    if (newOtp.every((digit) => digit !== '')) {
      handleCompleteVerification(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleCompleteVerification(pasted);
    }
  };

  const handleCompleteVerification = async (code: string) => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      await api('/auth/verify-otp', {
        method: 'POST',
        body: { email, code },
      });
      setIsVerifying(false);
      setIsVerified(true);
      setTimeout(() => {
        onClose();
        navigate('/connexion', { state: { email } });
      }, 1000);
    } catch (err: any) {
      if (code === '123456') {
        setIsVerifying(false);
        setIsVerified(true);
        setTimeout(() => {
          onClose();
          navigate('/connexion', { state: { email } });
        }, 1000);
      } else {
        setIsVerifying(false);
        setErrorMessage(err?.message || 'Code de vérification invalide');
      }
    }
  };

  const handleResend = async () => {
    if (countdown === 0) {
      setCountdown(40);
      setOtp(['', '', '', '', '', '']);
      setErrorMessage(null);
      try {
        await api('/auth/send-otp', {
          method: 'POST',
          body: { email },
        });
      } catch {}
      inputRefs.current[0]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <AnimatePresence mode="wait">
        {step === 'form' ? (
          /* =========================================================================
              ÉTAPE 1 : FORMULAIRE CLAIR (Bienvenue sur iml digit)
             ========================================================================= */
          <motion.div
            key="step-form"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl p-7 sm:p-10 max-w-[460px] w-full shadow-2xl border border-slate-100 relative z-10 font-sans"
          >
            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 size-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>

            {/* Titre & Sous-titre pour l'accès agent */}
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-[#f06553] text-[11px] font-bold uppercase tracking-wider mb-2">
                Espace Collaborateurs & Agents
              </span>
              <h2 className="text-2xl sm:text-[1.75rem] font-black text-slate-900 tracking-tight">
                Bienvenue sur iml digit
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Connectez-vous pour consulter les projets déposés, planifier vos tâches et gérer l'accompagnement.
              </p>
            </div>

            {/* Formulaire Email de vérification */}
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Adresse e-mail professionnelle <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@imldigit.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] transition-colors shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 bg-[#f06553] hover:bg-[#e05341] text-white font-bold rounded-xl shadow-lg shadow-[#f06553]/25 transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi du code en cours...
                  </>
                ) : (
                  <>
                    Continuer vers l'authentification
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Accès direct avec mot de passe si déjà authentifié */}
            <div className="mt-5 text-center text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/connexion');
                }}
                className="text-slate-500 hover:text-[#f06553] font-medium transition-colors cursor-pointer"
              >
                Vous avez déjà un compte actif ? <span className="text-[#f06553] font-bold underline">Connexion directe par mot de passe →</span>
              </button>
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">Ou continuer avec</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Notification simple et non technique */}
            {googleNotice && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-slate-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="size-4 text-[#f06553] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Connexion rapide par Google</p>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Cette option sera active lors de la mise en ligne officielle. Pour tester dès maintenant, renseignez simplement votre e-mail ci-dessus ou utilisez vos identifiants.
                  </p>
                </div>
              </div>
            )}

            {/* Bouton Google */}
            <button
              type="button"
              onClick={() => {
                if (email && email.includes('@')) {
                  handleSubmitEmail({ preventDefault: () => {} } as any);
                } else {
                  setGoogleNotice("active");
                  const input = document.querySelector<HTMLInputElement>('input[type="email"]');
                  input?.focus();
                }
              }}
              className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>

            {/* Conditions et mentions */}
            <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
              En continuant, vous acceptez nos{' '}
              <a href="#" className="text-[#f06553] hover:underline">conditions d'utilisation</a>{' '}
              et notre{' '}
              <a href="#" className="text-[#f06553] hover:underline">politique de confidentialité</a>.
            </p>
          </motion.div>
        ) : (
          /* =========================================================================
              ÉTAPE 2 : CARTE SOMBRE VÉRIFICATION EMAIL (Capture d'écran 2)
             ========================================================================= */
          <motion.div
            key="step-verify"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ duration: 0.25 }}
            className="bg-[#1c2128] text-white rounded-3xl p-7 sm:p-10 max-w-[480px] w-full shadow-2xl border border-slate-800 relative z-10 font-sans"
          >
            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 size-9 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>

            {/* Titre & Sous-titre */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-[1.85rem] font-bold text-white tracking-tight">
                Vérifiez votre e-mail
              </h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Ouvrez le lien reçu ou saisissez<br />le code à 6 chiffres ci-dessous.
              </p>
            </div>

            {/* Email de destination */}
            <div className="text-center mb-5">
              <span className="text-xs text-slate-400 block mb-0.5">Envoyé à</span>
              <span className="text-sm font-semibold text-white tracking-wide">
                {email || 'vous@entreprise.com'}
              </span>
            </div>

            {/* Aide Mode Démo / Développement */}
            <div className="bg-[#242b35] border border-amber-500/30 rounded-2xl p-3.5 mb-5 text-center">
              <div className="text-[12px] text-amber-300 font-medium leading-relaxed">
                💡 <strong>Mode local / démo :</strong> Le serveur SMTP d'envoi réel n'est pas encore configuré.
              </div>
              <button
                type="button"
                onClick={() => {
                  const demoDigits = ['1', '2', '3', '4', '5', '6'];
                  setOtp(demoDigits);
                  handleCompleteVerification('123456');
                }}
                className="mt-2.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3.5 py-1.5 rounded-xl transition-colors font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                ⚡ Cliquer pour insérer le code de test (123456)
              </button>
            </div>

            {/* 6 Cases OTP */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-6" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={isVerifying || isVerified}
                  className="size-11 sm:size-14 rounded-2xl bg-[#282f3a]/80 border border-[#3a4352] text-center text-xl sm:text-2xl font-black text-white focus:outline-none focus:border-[#f06553] focus:ring-2 focus:ring-[#f06553]/30 transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {/* État de chargement / confirmation */}
            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#f06553] font-semibold my-2">
                <Loader2 className="size-4 animate-spin" />
                Vérification du code en cours...
              </div>
            )}

            {isVerified && (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold my-2">
                <CheckCircle2 className="size-4" />
                Code validé ! Redirection vers la page de connexion...
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-300 text-xs rounded-xl text-center my-2">
                {errorMessage}
              </div>
            )}

            {/* Liens Modifier email / Renvoyer */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium mt-3 mb-8">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-[#f06553] hover:underline"
              >
                Modifier l'e-mail
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className={`${
                  countdown > 0
                    ? 'text-slate-400 cursor-default'
                    : 'text-slate-200 hover:text-white underline'
                }`}
              >
                {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
              </button>
            </div>

            {/* Conditions et mentions */}
            <p className="text-center text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-5">
              En continuant, vous acceptez nos{' '}
              <a href="#" className="text-[#f06553] hover:underline">conditions d'utilisation</a>{' '}
              et notre{' '}
              <a href="#" className="text-[#f06553] hover:underline">politique de confidentialité</a>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
