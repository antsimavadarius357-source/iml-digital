import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Send, 
  HelpCircle, 
  ShieldAlert, 
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { user } = useAuth();

  const [category, setCategory] = useState<'bug' | 'access' | 'help' | 'suggestion'>('bug');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    // Simulation enregistrement ticket support
    setTimeout(() => {
      const generatedTicketId = `IML-${Math.floor(1000 + Math.random() * 9000)}`;
      setIsSubmitting(false);
      setTicketSuccess(generatedTicketId);
    }, 600);
  };

  const handleReset = () => {
    setCategory('bug');
    setPriority('normal');
    setSubject('');
    setDescription('');
    setTicketSuccess(null);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-200"
      onClick={handleReset}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col text-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* EN-TÊTE */}
        <div className="py-4 px-6 bg-gradient-to-r from-[#102a43] to-[#1a3a5a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#23c3b1]/20 border border-[#23c3b1]/40 flex items-center justify-center text-[#23c3b1] shadow-inner">
              <Flag className="size-5 stroke-[2] animate-bounce" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Support & Signalement</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#23c3b1]/20 text-[#23c3b1] border border-[#23c3b1]/30">
                  IML Assistance
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Une anomalie, un blocage ou une question ? Notre équipe intervient rapidement.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="size-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CORPS */}
        <div className="p-6">
          {ticketSuccess ? (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
              <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Signalement transmis avec succès !
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Votre demande a été prise en compte sous le ticket officiel :
              </p>
              <div className="inline-block px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-800">
                Ticket n° {ticketSuccess}
              </div>
              <p className="text-[11px] text-slate-400">
                Une notification de prise en charge vous sera adressée par e-mail ou sur votre espace.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1eb3a2] text-white text-xs font-bold transition-all shadow-md shadow-[#23c3b1]/20 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type de demande */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Type de signalement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bug', label: 'Anomalie / Bug', icon: AlertTriangle, color: 'text-amber-600' },
                    { id: 'access', label: 'Problème d\'accès', icon: ShieldAlert, color: 'text-rose-600' },
                    { id: 'help', label: 'Assistance / Question', icon: HelpCircle, color: 'text-blue-600' },
                    { id: 'suggestion', label: 'Idée / Amélioration', icon: Lightbulb, color: 'text-emerald-600' },
                  ].map((cat) => {
                    const isSelected = category === cat.id;
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                          isSelected 
                            ? 'bg-[#23c3b1]/10 border-[#23c3b1] ring-2 ring-[#23c3b1]/20 shadow-2xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`size-4 ${cat.color} shrink-0`} />
                        <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Degré d'urgence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Priorité / Urgence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Normale', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
                    { id: 'urgent', label: 'Élevée', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { id: 'critical', label: 'Bloquante', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
                  ].map((p) => {
                    const isSelected = priority === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPriority(p.id as any)}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                          isSelected 
                            ? `${p.badge} ring-2 ring-slate-900/10 shadow-2xs` 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Objet du signalement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Objet du signalement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex : Erreur lors de la génération de document..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-2 focus:ring-[#23c3b1]/20 placeholder-slate-400 shadow-2xs"
                />
              </div>

              {/* Description détaillée */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description détaillée <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez ce qui s'est passé, les étapes pour reproduire ou votre besoin précis..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:border-[#23c3b1] focus:ring-2 focus:ring-[#23c3b1]/20 placeholder-slate-400 shadow-2xs resize-none"
                />
              </div>

              {/* Renseignements émetteur */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Émetteur : <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})</span>
                <span className="font-semibold text-slate-400">{user?.role || 'Membre IML'}</span>
              </div>

              {/* Boutons d'action */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !subject.trim() || !description.trim()}
                  className="px-5 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1eb3a2] text-white text-xs font-bold transition-all shadow-md shadow-[#23c3b1]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Transmission...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>Transmettre au support</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
