import { useState } from 'react';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  Send, 
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Renseignement sur une promotion d\'incubation',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await api('/contacts', {
        method: 'POST',
        body: formData,
      });
      setSubmitted(true);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('iml_last_submission', Date.now().toString());
        } catch {}
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Une erreur est survenue lors de la transmission. Veuillez réessayer ou nous contacter par téléphone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 bg-[#FAF9F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="px-3 py-1 rounded-full bg-orange-100 text-[#FF5B37] text-xs font-bold uppercase tracking-wider inline-block">
            Permanence & Écoute
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Contactez l'équipe IML Digit
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Que vous soyez porteur de projet, institution partenaire ou expert souhaitant intégrer notre réseau de coachs, nous vous répondons sous 24h.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Colonne gauche : Coordonnées & Présentation */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-3xl p-7 border border-stone-200/90 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Siège Opérationnel</h2>
              
              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-orange-50 text-[#FF5B37] flex items-center justify-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Adresse</div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      Immeuble Espace PME, Quartier Awendjé, Libreville, République Gabonaise
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Courrier électronique</div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      imlGabon2@gmail.com
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Permanence téléphonique</div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      +241 066 64 84 88
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Horaires du guichet</div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      Lundi au Vendredi : 08h00 – 17h00 (Heure de Libreville)
                    </div>
                  </div>
                </div>
              </div>
            </div>



          </div>

          {/* Colonne droite : Formulaire de contact */}
          <div className="lg:col-span-7 bg-white p-7 sm:p-9 rounded-3xl shadow-sm border border-stone-200/90">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Message transmis avec succès !</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Merci {formData.name}. Un conseiller d'orientation IML Digit a bien reçu votre demande et prendra contact avec vous dans les plus brefs délais.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: 'Renseignement sur une promotion d\'incubation', message: '' });
                    }}
                    className="px-6 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-stone-100 pb-4 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Formulaire de demande d'information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Renseignez vos coordonnées pour être rappelé.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom et Prénom *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nom et prénom"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] bg-stone-50/50" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Adresse email *</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre.email@domaine.ga"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] bg-stone-50/50" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone / WhatsApp</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+241 07 00 00 00"
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] bg-stone-50/50" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Objet de votre demande</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] bg-stone-50/50 cursor-pointer"
                    >
                      <option value="Renseignement sur une promotion d'incubation">Renseignement sur une promotion d'incubation</option>
                      <option value="Location de salle / Animation de masterclass">Location de salle / Animation de masterclass</option>
                      <option value="Postuler en tant que Mentor / Coach">Postuler en tant que Mentor / Coach</option>
                      <option value="Partenariat institutionnel / Bailleurs">Partenariat institutionnel / Bailleurs</option>
                      <option value="Autre demande">Autre demande</option>
                    </select>
                    {formData.subject === 'Location de salle / Animation de masterclass' && (
                      <p className="text-[11px] text-[#FF5B37] font-semibold mt-1">
                        💡 Vous pouvez aussi vérifier la disponibilité en direct et faire une demande express sur notre page <a href="/salle" className="underline font-bold">Louer la salle</a>.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Votre message *</label>
                  <textarea 
                    rows={4} 
                    required 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Précisez la nature de votre projet ou votre question..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs text-slate-900 focus:outline-none focus:border-[#FF5B37] bg-stone-50/50 resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#FF5B37] hover:bg-[#e94d29] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Transmission en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>Transmettre mon message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
