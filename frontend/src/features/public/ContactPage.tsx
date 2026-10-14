export default function ContactPage() {
  return (
    <div className="py-24 bg-slate-50 min-h-screen border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-iml-600 font-bold tracking-wide uppercase text-sm mb-4">Nous Contacter</h1>
              <h2 className="text-4xl font-extrabold text-slate-900">Venez nous rencontrer</h2>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              Notre équipe est à votre disposition pour répondre à toutes vos questions concernant les programmes d'accompagnement de l'IML.
            </p>
            
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-iml-600 shrink-0 shadow-sm">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Adresse</div>
                  <div className="text-slate-600">Quartier Batterie IV, Libreville, Gabon</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-iml-600 shrink-0 shadow-sm">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Email</div>
                  <div className="text-slate-600">contact@iml.ga</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-iml-600 shrink-0 shadow-sm">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Téléphone</div>
                  <div className="text-slate-600">+241 11 00 00 00</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Message envoyé !'); }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input type="text" required className="w-full rounded-xl border-slate-300 shadow-sm focus:ring-iml-500 p-3 bg-slate-50" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required className="w-full rounded-xl border-slate-300 shadow-sm focus:ring-iml-500 p-3 bg-slate-50" placeholder="jean@exemple.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea rows={4} required className="w-full rounded-xl border-slate-300 shadow-sm focus:ring-iml-500 p-3 bg-slate-50" placeholder="Comment pouvons-nous vous aider ?"></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-iml-900 text-white font-semibold rounded-xl hover:bg-iml-800 transition-colors shadow-lg">
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
