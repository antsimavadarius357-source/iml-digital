import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  StickyNote, 
  AlertCircle, 
  Building2, 
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';
import RecordServiceModal from '../services/RecordServiceModal';
import CreateNoteDrawer from './CreateNoteDrawer';

export default function CoachDashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modales d'action du Coach
  const [isRecordServiceOpen, setIsRecordServiceOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);

  // Nom affiché
  const coachName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Darius Coach IML';

  // Structures suivies par le coach (Start-up, PME, Organisation, Entreprise)
  const myStructures = [
    {
      id: 'bene-1',
      name: 'Marine LOUPE',
      type: 'STARTUP',
      typeLabel: 'Start-up',
      typeBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      company: 'BioTech Solutions',
      country: 'FR',
      progress: 25,
      nextStep: 'Validation du business model',
      status: 'Parcours en cours',
      lastSession: '12/10/2026'
    },
    {
      id: 'bene-2',
      name: 'SOPHIATECH GABON',
      type: 'PME',
      typeLabel: 'PME',
      typeBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      company: 'Sophiatech Gabon SARL',
      country: 'GA',
      progress: 60,
      nextStep: 'Audit organisationnel & trésorerie',
      status: 'Parcours en cours',
      lastSession: '08/10/2026'
    },
    {
      id: 'bene-3',
      name: 'COOPÉRATIVE AGRI-GABON',
      type: 'ORGANISATION',
      typeLabel: 'Organisation',
      typeBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      company: 'Fédération Agricole & Développement',
      country: 'GA',
      progress: 40,
      nextStep: 'Cadrage gouvernance & modèle collectif',
      status: 'Parcours en cours',
      lastSession: '04/10/2026'
    },
    {
      id: 'bene-4',
      name: 'LOGISTIQUE EQUATORIALE',
      type: 'ENTREPRISE',
      typeLabel: 'Entreprise',
      company: 'Logistique Équatoriale SA',
      country: 'GA',
      progress: 75,
      nextStep: 'Validation plan d\'expansion sous-régionale',
      status: 'Parcours en cours',
      lastSession: '29/09/2026'
    }
  ];

  // Prochains rendez-vous de coaching
  const upcomingSessions = [
    {
      id: 's-1',
      beneficiary: 'SOPHIATECH GABON (PME)',
      topic: 'Point financier & modèle de rentabilité',
      date: 'Jeudi 15 Octobre 2026',
      time: '10:00 - 11:30',
      mode: 'Visioconférence'
    },
    {
      id: 's-2',
      beneficiary: 'Marine LOUPE (Start-up)',
      topic: 'Revue du pitch et adéquation marché',
      date: 'Lundi 19 Octobre 2026',
      time: '14:30 - 16:00',
      mode: 'Cabinet IML Digit'
    },
    {
      id: 's-3',
      beneficiary: 'COOPÉRATIVE AGRI-GABON (Organisation)',
      topic: 'Atelier gouvernance & comités paysans',
      date: 'Mercredi 21 Octobre 2026',
      time: '09:00 - 11:00',
      mode: 'Sur site / Présentiel'
    }
  ];

  // Alertes de suivi direct
  const coachAlerts = [
    {
      id: 'a-1',
      title: 'Jalon complété à valider',
      desc: 'Marine LOUPE a soumis son canevas de Business Model pour validation.',
      date: 'Il y a 2h',
      severity: 'high'
    },
    {
      id: 'a-2',
      title: 'Bilan d\'étape requis',
      desc: 'SOPHIATECH GABON atteint l\'étape 3/6. Prévoir la feuille d\'évaluation.',
      date: 'Hier',
      severity: 'medium'
    }
  ];

  return (
    <div className="w-full space-y-5 font-sans text-slate-800">
      
      {/* =========================================================================
          1. BANDEAU DE BIENVENUE DU COACH
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#1e3347] to-[#25425c] rounded-xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#23c3b1] text-slate-900">
              Espace Coach d'accompagnement
            </span>
            <span className="text-xs text-slate-300">
              Suivi direct • Start-ups, PME & Organisations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bonjour {coachName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Retrouvez vos structures accompagnées, planifiez vos prochaines séances de coaching et validez l'avancement des parcours certifiés.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <Link
            to="/messages"
            className="flex-1 md:flex-none text-center px-4 py-2 rounded-lg bg-[#23c3b1] hover:bg-[#1fb3a2] text-slate-900 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="size-4" />
            <span>Messages reçus (2)</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsRecordServiceOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Clock className="size-3.5" />
            <span>Enregistrer une prestation</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. STATISTIQUES RAPIDES DU COACH
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Structures actives</span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">4</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>1 Start-up, 1 PME, 2 Orga / Entr.</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Séances ce mois</span>
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">6</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>3 prochaines planifiées</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Temps d'accompagnement</span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">14h 30m</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            <span>✓ 100% prestations renseignées</span>
          </div>
        </div>

        <Link 
          to="/messages"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-[#23c3b1] hover:shadow-xs transition-all block group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600 group-hover:text-[#23c3b1]">Messages reçus</span>
            <div className="size-8 rounded-lg bg-teal-50 text-[#23c3b1] flex items-center justify-center">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">4 <span className="text-xs font-bold text-[#f06553]">(2 non lus)</span></div>
          <div className="text-[11px] text-[#23c3b1] mt-1 font-medium group-hover:underline">
            Consulter ma boîte de réception →
          </div>
        </Link>
      </div>

      {/* =========================================================================
          3. ACTIONS RAPIDES DU COACH
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setIsRecordServiceOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#23c3b1] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#23c3b1] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Clock className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-[#1ba898]">Enregistrer prestation</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Feuille de temps de suivi</div>
        </button>

        <button
          type="button"
          onClick={() => setIsCreateAppointmentOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#23c3b1] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#23c3b1] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Calendar className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-[#1ba898]">Planifier séance</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rendez-vous individuel</div>
        </button>

        <button
          type="button"
          onClick={() => setIsCreateNoteOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#23c3b1] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#23c3b1] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <StickyNote className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-[#1ba898]">Ajouter note de suivi</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Compte-rendu de séance</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/messages')}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#23c3b1] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#23c3b1] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <MessageSquare className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-[#1ba898]">Messages reçus</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Échanges avec bénéficiaires</div>
        </button>
      </div>

      {/* =========================================================================
          4. CORPS PRINCIPAL : MES STRUCTURES SUIVIES (GAUCHE) + RDV & ALERTES (DROITE)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLONNE GAUCHE (7/12) : Mes structures & bénéficiaires */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Mes structures & bénéficiaires accompagnés
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Start-ups, PME, organisations et entreprises en coaching actif
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                4 dossiers en suivi
              </span>
            </div>

            <div className="space-y-3">
              {myStructures.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => navigate('/messages')}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#23c3b1] hover:bg-slate-50/50 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">{s.name}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${s.typeBadgeColor}`}>
                        {s.typeLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{s.company}</span>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">{s.nextStep}</span>
                      <span className="font-semibold text-slate-700">{s.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#23c3b1] h-full rounded-full transition-all"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-100">
                    <span>Dernière session : {s.lastSession}</span>
                    <span className="text-[#23c3b1] font-medium hover:underline flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      Voir les échanges & messages →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (5/12) : Prochaines séances & Alertes de suivi */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Prochaines séances planifiées */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="size-4 text-[#23c3b1]" />
                Prochaines séances de coaching
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateAppointmentOpen(true)}
                className="text-[11px] text-[#f06553] hover:underline font-semibold"
              >
                + Planifier
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingSessions.map((sess) => (
                <div key={sess.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-[#1e3347]">{sess.date}</span>
                    <span className="text-slate-500 font-medium">{sess.time}</span>
                  </div>
                  <div className="font-medium text-slate-800">{sess.beneficiary}</div>
                  <div className="text-[11px] text-slate-500">{sess.topic}</div>
                  <div className="text-[10px] text-[#23c3b1] font-medium pt-1">
                    Mode : {sess.mode}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes de suivi direct */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <AlertCircle className="size-4 text-[#f06553]" />
              Alertes de mes bénéficiaires
            </h2>

            <div className="space-y-2.5 text-xs">
              {coachAlerts.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#f06553] text-xs">{a.title}</span>
                    <span className="text-[10px] text-slate-400">{a.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODALES D'ACTION */}
      <RecordServiceModal
        isOpen={isRecordServiceOpen}
        onClose={() => setIsRecordServiceOpen(false)}
        onSuccess={() => {}}
      />

      <CreateAppointmentWizardModal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
        onSuccess={() => {}}
      />

      <CreateNoteDrawer
        isOpen={isCreateNoteOpen}
        onClose={() => setIsCreateNoteOpen(false)}
        onSuccess={() => {}}
      />

    </div>
  );
}
