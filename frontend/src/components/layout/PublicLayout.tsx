import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Phone, 
  LogIn, 
  CheckCircle2
} from 'lucide-react';
import AuthModal from '../../features/auth/AuthModal';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'inscription' | 'connexion'>('connexion');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle external open-auth-modal events
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'inscription' | 'connexion' }>;
      setAuthModalTab(customEvent.detail?.tab || 'connexion');
      setAuthModalOpen(true);
    };
    window.addEventListener('open-auth-modal', handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSent(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSent(false), 4000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF9F5] text-slate-900 selection:bg-[#FF5B37] selection:text-white antialiased">
      
      {/* =========================================================================
          1. HEADER / NAVBAR FLOTTANTE MODERNE
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-xl shadow-md border border-slate-700/60 group-hover:scale-105 transition-transform">
              <span className="text-[#FF5B37]">i</span>m
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                iml digit<span className="text-[#FF5B37]">.</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider -mt-1 hidden sm:block">
                Incubation & Accélération
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link 
              to="/" 
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold transition-colors ${
                location.pathname === '/' ? 'text-slate-900 bg-stone-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/40'
              }`}
            >
              Accueil
            </Link>
            
            <a 
              href="/#programmes" 
              className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/40 transition-colors"
            >
              Programmes
            </a>

            <a 
              href="/#methodologie" 
              className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/40 transition-colors"
            >
              Méthodologie
            </a>

            <a 
              href="/#impact" 
              className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/40 transition-colors"
            >
              Impact & Chiffres
            </a>

            <a 
              href="/#temoignages" 
              className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/40 transition-colors"
            >
              Témoignages
            </a>

            <Link 
              to="/contact" 
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold transition-colors ${
                location.pathname === '/contact' ? 'text-slate-900 bg-stone-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/40'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Actions CTA (Connexion Espace Membre) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              to="/connexion"
              className="px-4 py-2 rounded-full text-[13px] font-bold text-white bg-[#FF5B37] hover:bg-[#e04a27] transition-all flex items-center gap-2 shadow-md shadow-[#FF5B37]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="size-4 text-white" />
              <span>Espace Membre</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-stone-200/90 bg-[#FAF9F5] px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-1">
              <Link 
                to="/" 
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Accueil
              </Link>
              <a 
                href="/#programmes" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Programmes
              </a>
              <a 
                href="/#methodologie" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Méthodologie
              </a>
              <a 
                href="/#impact" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Impact & Chiffres
              </a>
              <a 
                href="/#temoignages" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Témoignages
              </a>
              <Link 
                to="/contact" 
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Contact
              </Link>
            </div>

            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              <Link
                to="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl font-bold text-sm bg-[#FF5B37] hover:bg-[#e04a27] text-white shadow-md shadow-[#FF5B37]/20 flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="size-4 text-white" />
                <span>Espace Membre</span>
              </Link>
              <Link
                to="/candidater"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Candidater à une cohorte</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          3. MAIN CONTENT (Child Page)
         ========================================================================= */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* =========================================================================
          4. FOOTER NOBLE & MODERNE
         ========================================================================= */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            
            {/* Colonne 1 : Présentation & Mission */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-br from-[#FF5B37] to-[#FA4620] text-white flex items-center justify-center font-black text-lg shadow-md">
                  i
                </div>
                <span className="text-2xl font-black tracking-tight text-white">
                  iml digit<span className="text-[#FF5B37]">.</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Dispositif national et souverain d'incubation et d'accélération. 
                Nous structurons l'écosystème entrepreneurial pour transformer les talents en entreprises durables, financées et génératrices d'emplois.
              </p>
              
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-300">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>Données souveraines & hébergées en conformité</span>
                </div>
              </div>
            </div>

            {/* Colonne 2 : Programmes d'incubation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Programmes
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="/#programmes" className="hover:text-white transition-colors">
                    Programme Émergence
                  </a>
                </li>
                <li>
                  <a href="/#programmes" className="hover:text-white transition-colors">
                    Accélération PME
                  </a>
                </li>
                <li>
                  <a href="/#programmes" className="hover:text-white transition-colors">
                    Filières & Coopératives
                  </a>
                </li>
                <li>
                  <a href="/#methodologie" className="hover:text-white transition-colors">
                    Cahier des 4 Jalons
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Accès & Candidature */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Espace & Accès
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to="/candidater" className="hover:text-white text-[#FF8E75] font-semibold transition-colors flex items-center gap-1">
                    <span>Déposer un dossier</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </li>
                <li>
                  <Link to="/connexion" className="hover:text-white transition-colors">
                    Espace Coachs & Mentors
                  </Link>
                </li>
                <li>
                  <Link to="/connexion" className="hover:text-white transition-colors">
                    Portail Entrepreneurs
                  </Link>
                </li>
                <li>
                  <a href="/#temoignages" className="hover:text-white transition-colors">
                    Témoignages de lauréats
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Contact & Siège */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Contact & Siège
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="size-4 text-[#FF5B37] shrink-0 mt-0.5" />
                  <span>Immeuble IML Digit, Libreville, Gabon</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-[#FF5B37] shrink-0" />
                  <span>contact@imldigit.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-[#FF5B37] shrink-0" />
                  <span>+241 01 00 00 00</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Newsletter Box */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <h4 className="text-sm font-bold text-white">Restez informé des prochains appels à projets</h4>
              <p className="text-xs text-slate-400 mt-0.5">Recevez le calendrier des cohortes et les opportunités d'accompagnement.</p>
            </div>
            {newsletterSent ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Merci ! Vous êtes bien inscrit aux alertes de cohorte.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex items-center gap-2 w-full md:w-auto">
                <input 
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Votre adresse email professionnelle"
                  required
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5B37] w-full sm:w-72"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#FF5B37] hover:bg-[#e94d29] text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  S'abonner
                </button>
              </form>
            )}
          </div>

          {/* Copyright & Mentions */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 IML Digit. Tous droits réservés. Plateforme Numérique d'Incubation & Accélération.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/contact" className="hover:text-slate-300 transition-colors">
                Support & Contact
              </Link>
              <Link to="/connexion" className="hover:text-slate-300 transition-colors">
                Connexion
              </Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Auth Modal if triggered */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialTab={authModalTab} 
      />

    </div>
  );
}
