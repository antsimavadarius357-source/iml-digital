import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ArrowRight, 
  MapPin, 
  Mail, 
  Phone, 
  LogIn, 
  Globe, 
  Clock 
} from 'lucide-react';
import AuthModal from '../../features/auth/AuthModal';
import ImlLogo from '../common/ImlLogo';

const LinkedinIcon = () => (
  <svg className="size-4 fill-current" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.3a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="size-4 fill-current" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'inscription' | 'connexion'>('connexion');
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF9F5] text-slate-900 selection:bg-[#FF5B37] selection:text-white antialiased">
      
      {/* =========================================================================
          1. HEADER / NAVBAR FLOTTANTE MODERNE
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center group py-1" title="Accueil IML Digit">
            <ImlLogo variant="icon" theme="light" size="xl" />
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
              href="/#impact" 
              className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-200/40 transition-colors"
            >
              Impact & Chiffres
            </a>

            <Link 
              to="/salle" 
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-semibold transition-colors ${
                location.pathname === '/salle' || location.pathname === '/espaces' ? 'text-slate-900 bg-stone-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/40'
              }`}
            >
              Réserver la salle
            </Link>

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
                href="/#impact" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 hover:bg-stone-200/50"
              >
                Impact & Chiffres
              </a>
              <Link 
                to="/salle" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-[#FF5B37] hover:bg-stone-200/50"
              >
                Réserver la salle
              </Link>
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
                <span>Déposer ma candidature</span>
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
          4. FOOTER NOBLE & MODERNE (DESIGN REVISITÉ & ÉPURÉ)
         ========================================================================= */}
      <footer className="bg-[#0b1320] text-slate-300 pt-10 pb-8 border-t border-slate-800/80 relative overflow-hidden">
        {/* Lueur d'ambiance discrète */}
        <div className="absolute top-0 left-1/4 w-96 h-32 bg-[#FF5B37]/5 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#23c3b1]/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8">
            
            {/* Colonne 1 : Présentation & Mission (Span 5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <ImlLogo variant="icon" theme="dark" size="sm" />
                <span className="font-bold text-white text-base tracking-tight">IML Digit</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Incubateur et accélérateur d'entreprises innovantes de Libreville — Mugheli Lab. Accompagnement, structuration et accès aux financements pour les entrepreneurs gabonais.
              </p>

              {/* Réseaux Sociaux */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn Mugheli Lab"
                  className="size-8 rounded-lg bg-slate-800/80 hover:bg-[#FF5B37] text-slate-400 hover:text-white border border-slate-700/70 hover:border-[#FF5B37] flex items-center justify-center transition-all duration-200 shadow-xs hover:scale-105"
                >
                  <LinkedinIcon />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook Mugheli Lab"
                  className="size-8 rounded-lg bg-slate-800/80 hover:bg-[#FF5B37] text-slate-400 hover:text-white border border-slate-700/70 hover:border-[#FF5B37] flex items-center justify-center transition-all duration-200 shadow-xs hover:scale-105"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram Mugheli Lab"
                  className="size-8 rounded-lg bg-slate-800/80 hover:bg-[#FF5B37] text-slate-400 hover:text-white border border-slate-700/70 hover:border-[#FF5B37] flex items-center justify-center transition-all duration-200 shadow-xs hover:scale-105"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="/"
                  aria-label="Portail Web IML Digit"
                  className="size-8 rounded-lg bg-slate-800/80 hover:bg-[#23c3b1] text-slate-400 hover:text-white border border-slate-700/70 hover:border-[#23c3b1] flex items-center justify-center transition-all duration-200 shadow-xs hover:scale-105"
                >
                  <Globe className="size-3.5" />
                </a>
              </div>
            </div>

            {/* Colonne 2 : Programmes d'incubation (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#FF5B37]" />
                Programmes
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="/#programmes" className="hover:text-white transition-colors">
                    Programme Émergence
                  </a>
                </li>
                <li>
                  <a href="/#programmes" className="hover:text-white transition-colors">
                    Accélération PME & Scale
                  </a>
                </li>
                <li>
                  <a href="/#programmes" className="hover:text-white transition-colors">
                    Filières & Coopératives
                  </a>
                </li>
                <li>
                  <a href="/#methodologie" className="hover:text-white transition-colors">
                    Méthodologie des 4 Jalons
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Espaces & Accès (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#23c3b1]" />
                Espaces & Accès
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/salle" className="text-white hover:text-[#FF8E75] font-semibold transition-colors flex items-center gap-1.5 group">
                    <span>Réserver une salle</span>
                  </Link>
                </li>
                <li>
                  <Link to="/candidater" className="text-white hover:text-[#FF8E75] font-semibold transition-colors flex items-center gap-1">
                    <span>Candidater au programme</span>
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

            {/* Colonne 4 : Contact & Siège (Span 3) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                Contact & Siège
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-[#FF5B37] shrink-0 mt-0.5" />
                  <span>Immeuble Espace PME, Quartier Awendjé, Libreville</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#FF5B37] shrink-0" />
                  <a href="mailto:imlGabon2@gmail.com" className="hover:text-white transition-colors">
                    imlGabon2@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#FF5B37] shrink-0" />
                  <a href="tel:+241066648488" className="hover:text-white transition-colors">
                    +241 066 64 84 88
                  </a>
                </li>
                <li className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                  <Clock className="size-3 text-slate-400 shrink-0" />
                  <span>Lun – Sam : 08h00 – 18h00</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright & Mentions */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © 2026 IML Digit • Incubateur Mugheli Lab. Tous droits réservés.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/contact" className="hover:text-slate-300 transition-colors">
                Support & Contact
              </Link>
              <Link to="/contact" className="hover:text-slate-300 transition-colors">
                Mentions légales
              </Link>
              <Link to="/connexion" className="hover:text-slate-300 transition-colors">
                Connexion Membre
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
