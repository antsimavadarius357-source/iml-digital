import { Link, Outlet } from 'react-router-dom';
import { 
  ChevronDown, 
  Globe, 
  Video, 
  MessageSquare, 
  Briefcase, 
  Send, 
  PhoneCall, 
  Sparkles, 
  PenTool, 
  Clock, 
  ShoppingBag, 
  Users, 
  UserCheck, 
  Calendar 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AuthModal, { openAuthModal } from '../../features/auth/AuthModal';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'inscription' | 'connexion'>('inscription');

  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'inscription' | 'connexion' }>;
      setAuthModalTab(customEvent.detail?.tab || 'inscription');
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#f06553] selection:text-white text-slate-900 bg-white">
      {/* Navbar White matching iml digit reference screenshot */}
      <header className="fixed top-0 inset-x-0 h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 shadow-sm transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-10">
            {/* Logo iml digit */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-[1.75rem] font-black tracking-tight text-slate-900 font-sans">
                iml digit<span className="text-[#f06553]">.</span>
              </span>
            </Link>

            {/* Main Nav */}
            <nav className="hidden lg:flex items-center gap-7 h-full">
              {/* Fonctionnalités Dropdown */}
              <div 
                className="relative h-full flex items-center group cursor-pointer"
                onMouseEnter={() => setMenuOpen(true)}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-1.5 text-[15px] font-semibold transition-colors ${
                    menuOpen ? 'text-[#f06553]' : 'text-slate-800 hover:text-[#f06553]'
                  }`}
                >
                  Fonctionnalités
                  <ChevronDown className={`size-4 transition-transform duration-200 ${menuOpen ? 'rotate-180 text-[#f06553]' : 'text-slate-400'}`} />
                </button>
                
                {/* Mega Menu Dropdown */}
                <div className={`absolute top-full -left-8 w-[840px] transition-all duration-200 z-50 ${
                  menuOpen ? 'visible opacity-100 translate-y-2' : 'invisible opacity-0 translate-y-4 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 p-8 grid grid-cols-2 gap-8">
                    {/* Colonne 1 : NOUVEAUTÉS */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#f06553] mb-5">
                        NOUVEAUTÉS
                      </h3>
                      <div className="space-y-3.5">
                        <Link 
                          to="/solutions/coach#nath" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <Sparkles className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Nath
                          </span>
                        </Link>

                        <Link 
                          to="/solutions/coach#notes" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <PenTool className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Prise de Notes
                          </span>
                        </Link>

                        <Link 
                          to="/solutions/cabinet#heures" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <Clock className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Compteur d'heures pour bilans de compétences
                          </span>
                        </Link>

                        <Link 
                          to="/offres#shopping" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <ShoppingBag className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Module Shopping
                          </span>
                        </Link>
                      </div>
                    </div>

                    {/* Colonne 2 : FONCTIONNALITÉS */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#f06553] mb-5">
                        FONCTIONNALITÉS
                      </h3>
                      <div className="space-y-3.5">
                        <Link 
                          to="/solutions/cabinet" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <Users className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Gestion des Accompagnants et Coachs
                          </span>
                        </Link>

                        <Link 
                          to="/solutions/coach" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <UserCheck className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Gestion des Bénéficiaires 360°
                          </span>
                        </Link>

                        <Link 
                          to="/solutions/coach" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <Globe className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Portail Bénéficiaire Web et Mobile
                          </span>
                        </Link>

                        <Link 
                          to="/solutions/coach" 
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3.5 p-2 rounded-2xl hover:bg-orange-50/50 group/item transition-colors"
                        >
                          <div className="size-10 rounded-full bg-orange-100/70 text-[#f06553] flex items-center justify-center shrink-0 group-hover/item:scale-105 transition-transform">
                            <Calendar className="size-5" />
                          </div>
                          <span className="text-[15px] font-semibold text-slate-800 group-hover/item:text-[#f06553] transition-colors">
                            Agenda et Planification
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pour les coachs */}
              <Link to="/solutions/coach" className="text-[15px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Pour les coachs
              </Link>

              {/* Pour les cabinets */}
              <Link to="/solutions/cabinet" className="text-[15px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Pour les cabinets
              </Link>

              {/* Tarifs */}
              <Link to="/tarifs" className="text-[15px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Tarifs
              </Link>

              {/* Blog */}
              <Link to="/ressources/guides" className="text-[15px] font-medium text-slate-700 hover:text-slate-900 transition-colors">
                Blog
              </Link>

              {/* Suivi de candidature en ligne */}
              <Link 
                to="/suivi-candidature" 
                className="text-[14px] font-semibold text-slate-700 hover:text-[#23c3b1] transition-colors flex items-center gap-1"
              >
                <span>Suivre mon dossier</span>
              </Link>

              {/* Déposer une candidature (PME, Startups, Porteurs) */}
              <Link 
                to="/candidater" 
                className="text-[14px] font-bold text-[#f06553] hover:text-[#e05341] transition-colors flex items-center gap-1.5 bg-orange-50/80 hover:bg-orange-100 px-3.5 py-1.5 rounded-full border border-orange-200"
              >
                <span>Candidater</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-black tracking-wider bg-[#f06553] text-white rounded">
                  PME & Startups
                </span>
              </Link>
            </nav>
          </div>

          {/* Actions de droite : Contactez-nous & Bouton Connexion réservé au personnel */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/contact" 
              className="px-5 py-2.5 rounded-full border border-slate-900 text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Contactez-nous
            </Link>
            <button 
              type="button"
              id="btn-header-connexion"
              onClick={() => {
                setAuthModalTab('connexion');
                setAuthModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white text-sm font-bold shadow-lg shadow-[#f06553]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="size-4" />
              Connexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with top padding matching h-20 header */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Modern Dark Navy Mega Footer matching iml digit */}
      <footer className="bg-[#0d1929] text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            {/* Col 1 : Brand & Newsletter */}
            <div className="lg:col-span-2 space-y-4 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  iml digit<span className="text-[#f06553]">.</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                La plateforme complète de gestion de l'accompagnement d'entrepreneurs pour coachs, cabinets, incubateurs et accélérateurs.
              </p>
              
              {/* Newsletter Form */}
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Restez informé de nos nouveautés</p>
                <form onSubmit={handleNewsletter} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Votre email professionnel"
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f06553]"
                  />
                  <button
                    type="submit"
                    aria-label="S'inscrire à la newsletter"
                    className="px-4 py-2.5 bg-[#f06553] hover:bg-[#e05341] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center shadow-md shadow-[#f06553]/25"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
                {newsletterSent && (
                  <p className="text-xs text-[#38d9a9] mt-2">Merci ! Vous êtes bien inscrit(e).</p>
                )}
              </div>
            </div>

            {/* Col 2 : Solutions */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm mb-4">Fonctionnalités</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/solutions/coach" className="hover:text-white transition-colors">Pour les coachs</Link></li>
                <li><Link to="/solutions/cabinet" className="hover:text-white transition-colors">Pour les cabinets</Link></li>
                <li><Link to="/tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={() => openAuthModal('connexion')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Connexion (Espace Équipe)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3 : Nouveautés */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm mb-4">Nouveautés</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/solutions/coach#nath" className="hover:text-white transition-colors">Nath (Assistant IA)</Link></li>
                <li><Link to="/solutions/coach#notes" className="hover:text-white transition-colors">Prise de Notes</Link></li>
                <li><Link to="/solutions/cabinet#heures" className="hover:text-white transition-colors">Compteur d'heures</Link></li>
                <li><Link to="/offres#shopping" className="hover:text-white transition-colors">Module Shopping</Link></li>
              </ul>
            </div>

            {/* Col 4 : Entreprise & Contact */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contactez-nous</Link></li>
                <li><Link to="/ressources/guides" className="hover:text-white transition-colors">Blog</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Sécurité & RGPD</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800/80 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span>© 2026 iml digit. Tous droits réservés.</span>
              <span className="text-slate-600">•</span>
              <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
              <span className="text-slate-600">•</span>
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <span className="text-slate-600">•</span>
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            </div>

            <div className="flex items-center gap-3">
              <a href="#" className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Briefcase className="size-3.5" />
              </a>
              <a href="#" className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <MessageSquare className="size-3.5" />
              </a>
              <a href="#" className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Video className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Instant WhatsApp / Support Button */}
      <a 
        href="https://wa.me/?text=Bonjour,%20je%20souhaite%20une%20d%C3%A9monstration%20de%20iml%20digit"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter le support par WhatsApp"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/40 transition-transform hover:scale-110 active:scale-95 group"
      >
        <PhoneCall className="size-6 group-hover:rotate-12 transition-transform" />
        <span className="sr-only">Contact WhatsApp</span>
      </a>

      {/* Authentication Modal (Image 1 and Image 2) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </div>
  );
}
