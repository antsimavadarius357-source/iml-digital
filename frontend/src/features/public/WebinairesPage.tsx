import { useState } from 'react';
import { Video, Calendar, Play, Clock, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Webinar {
  id: string;
  status: 'upcoming' | 'replay';
  date: string;
  duration: string;
  title: string;
  speaker: string;
  role: string;
  description: string;
  attendees: number;
}

const WEBINARS_DATA: Webinar[] = [
  {
    id: 'webinar-1',
    status: 'upcoming',
    date: 'Jeudi 24 Octobre • 18:00',
    duration: '45 min + Q&R',
    title: 'Comment convaincre les VCs en Amorçage (Pre-seed & Seed) en 2026',
    speaker: 'Sarah Benali',
    role: 'Partner @ Alven Capital & Mentor IML',
    description: 'Les métriques indispensables, les questions pièges et ce qui fait pencher la décision d’investissement lors des premiers comités.',
    attendees: 184
  },
  {
    id: 'webinar-2',
    status: 'upcoming',
    date: 'Mardi 5 Novembre • 12:30',
    duration: '60 min',
    title: 'Automatiser sa prospection B2B sans spammer : les workflows qui marchent',
    speaker: 'Thomas Mercier',
    role: 'Head of Growth @ Spendesk',
    description: 'Découvrez comment identifier 100 décideurs qualifiés par semaine et déclencher des rendez-vous avec un taux de réponse de 28%.',
    attendees: 240
  },
  {
    id: 'webinar-3',
    status: 'replay',
    date: 'Session enregistrée',
    duration: '52 min',
    title: 'Masterclass : Définir son Pricing SaaS et arrêter de se brader',
    speaker: 'Alexandre Dupont',
    role: 'Ex-VP Pricing @ Doctolib',
    description: 'Structure de grille tarifaire, modèles Freemium vs Free Trial et stratégies de passage à l’échelle pour multiplier son ARPU par 3.',
    attendees: 512
  },
  {
    id: 'webinar-4',
    status: 'replay',
    date: 'Session enregistrée',
    duration: '48 min',
    title: 'Recruter ses 3 premiers développeurs sans budget pharaonique',
    speaker: 'Élodie Laurent',
    role: 'CTO in Residence @ IML Digital',
    description: 'Comment tester les compétences réelles, construire une culture technique attractive et structurer les stock-options (BSPCE).',
    attendees: 430
  }
];

export default function WebinairesPage() {
  const [registered, setRegistered] = useState<string[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handleRegister = (id: string) => {
    if (!registered.includes(id)) {
      setRegistered([...registered, id]);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20">
      <div className="max-w-[1240px] mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <Video className="size-4 text-teal-600" />
            Masterclasses & Webinaires en Direct
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Apprenez en direct avec les meilleurs fondateurs et experts
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Sessions interactives, études de cas concrètes et replays exclusifs réservés à notre communauté d'entrepreneurs.
          </p>
        </div>

        {/* Modal Vidéo Player Factice */}
        {playingVideo && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-800 text-white animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800/50">
                  Lecteur de Replay HD
                </span>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="text-slate-400 hover:text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-slate-800"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="aspect-video bg-slate-950 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-slate-800">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 animate-pulse">
                  <Play className="size-8 ml-1" />
                </div>
                <h4 className="text-base font-bold text-center px-6 text-slate-200">
                  {playingVideo}
                </h4>
                <p className="text-xs text-slate-500 mt-2">Diffusion haute définition activée • Chapitrage disponible</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Prochaines Sessions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="size-6 text-indigo-600" /> Prochaines masterclasses en direct
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {WEBINARS_DATA.filter(w => w.status === 'upcoming').map((webinar) => {
              const isDone = registered.includes(webinar.id);
              return (
                <div
                  key={webinar.id}
                  className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                        <Clock className="size-3" /> {webinar.date}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {webinar.attendees} inscrits
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">
                      {webinar.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {webinar.description}
                    </p>

                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        <User className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{webinar.speaker}</p>
                        <p className="text-[11px] text-slate-500">{webinar.role}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegister(webinar.id)}
                    disabled={isDone}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      isDone
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="size-4 text-teal-600" />
                        Place réservée ! Lien de connexion envoyé par email
                      </>
                    ) : (
                      <>Réserver ma place gratuite (Accès illimité)</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Replays */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Play className="size-6 text-teal-600" /> Replays disponibles à la demande
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {WEBINARS_DATA.filter(w => w.status === 'replay').map((webinar) => (
              <div
                key={webinar.id}
                className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 flex items-center gap-1.5">
                      <Play className="size-3 fill-teal-600 text-teal-600" /> Replay disponible
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {webinar.duration}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">
                    {webinar.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {webinar.description}
                  </p>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      <User className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{webinar.speaker}</p>
                      <p className="text-[11px] text-slate-500">{webinar.role}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPlayingVideo(webinar.title)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-indigo-600 text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="size-4" /> Visionner le replay vidéo maintenant
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="text-center py-12 px-6 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Envie d'intervenir comme intervenant invité ?</h3>
          <p className="text-sm text-slate-600 mb-6">
            Vous avez levé des fonds, vendu votre entreprise ou développé une expertise rare ? Partagez vos retours d'expérience avec notre écosystème.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Proposer une thématique de conférence <ArrowRight className="size-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
