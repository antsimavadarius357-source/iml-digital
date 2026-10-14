import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck, 
  FileText, 
  Inbox, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Plus
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import AddDocumentWizardModal from '../documents/AddDocumentWizardModal';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';

export default function AgentDashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modales d'action de l'Agent
  const [isCreateBeneficiaryOpen, setIsCreateBeneficiaryOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);

  // Nom affiché
  const agentName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Alexandre Agent IML';

  // Candidatures entrantes à qualifier
  const incomingApplications = [
    {
      id: 'app-1',
      candidateName: 'Société AgriTech Libreville',
      type: 'ORGANISATION',
      typeLabel: 'Organisation',
      typeBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      program: 'Programme Croissance Verte',
      date: '13/10/2026 à 09:15',
      status: 'À qualifier',
      statusBadge: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'app-2',
      candidateName: 'Transport Transit SA',
      type: 'PME',
      typeLabel: 'PME',
      typeBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      program: 'Accompagnement PME Régional',
      date: '12/10/2026 à 16:40',
      status: 'En attente d\'un coach',
      statusBadge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'app-3',
      candidateName: 'Paul NGOUANDJILA',
      type: 'STARTUP',
      typeLabel: 'Start-up',
      typeBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      program: 'Incubation Numérique',
      date: '11/10/2026 à 11:20',
      status: 'Dossier complet',
      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  // Alertes globales de la plateforme
  const globalAlerts = [
    {
      id: 'alert-1',
      title: 'Bénéficiaire non assigné depuis 48h',
      desc: 'Le dossier Transport Transit SA est validé mais aucun coach n\'a encore été affecté.',
      priority: 'high',
      time: 'Il y a 3h'
    },
    {
      id: 'alert-2',
      title: 'Document légal manquant (Kbis / Statuts)',
      desc: 'Dossier #104 (Sophiatech Gabon) - Bilan financier d\'entrée non déposé.',
      priority: 'medium',
      time: 'Hier'
    },
    {
      id: 'alert-3',
      title: 'Fin de parcours en approche',
      desc: 'Marine LOUPE arrive à l\'échéance du jalon final. Préparer la délivrance de certification.',
      priority: 'normal',
      time: 'Il y a 2 jours'
    }
  ];

  // Répartition de la charge des coachs
  const coachWorkloads = [
    {
      id: 'c-1',
      name: 'Darius Coach IML',
      role: 'Coach principal',
      activeCount: 4,
      capacity: '60%',
      capacityColor: 'bg-[#23c3b1]'
    },
    {
      id: 'c-2',
      name: 'Sarah BENALI',
      role: 'Coach PME & Finance',
      activeCount: 3,
      capacity: '45%',
      capacityColor: 'bg-blue-500'
    },
    {
      id: 'c-3',
      name: 'Michel OBIANG',
      role: 'Coach Stratégie & Orga',
      activeCount: 2,
      capacity: '30%',
      capacityColor: 'bg-purple-500'
    }
  ];

  return (
    <div className="w-full space-y-5 font-sans text-slate-800">
      
      {/* =========================================================================
          1. BANDEAU DE BIENVENUE AGENT IML
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#17384a] to-[#1e4d66] rounded-xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#38d9a9] text-slate-900">
              Espace Coordination & Alertes
            </span>
            <span className="text-xs text-slate-300">
              Agent IML • Répartition & Gestion des flux
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bonjour {agentName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Pilotez les entrées en relation, qualifiez les nouvelles candidatures et dispatchez les bénéficiaires vers les coachs d'accompagnement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <Link
            to="/candidatures"
            className="flex-1 md:flex-none text-center px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-colors"
          >
            Toutes les candidatures
          </Link>
          <button
            type="button"
            onClick={() => setIsCreateBeneficiaryOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#38d9a9] hover:bg-[#2bc596] text-slate-900 text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Créer un bénéficiaire</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. INDICATEURS CLÉS DE COORDINATION
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Candidatures à qualifier</span>
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Inbox className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">3</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Nouvelles demandes reçues</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">En attente d'un coach</span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">2</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Dossiers validés à assigner</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Alertes plateforme</span>
            <div className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#f06553]">5</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>1 critique, 4 normales</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Dossiers actifs suivis</span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">12</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            <span>Répartis sur 3 coachs</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ACTIONS RAPIDES DE COORDINATION
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => navigate('/candidatures')}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#38d9a9] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#38d9a9] text-slate-900 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Inbox className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Traiter les candidatures</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Validation & éligibilité</div>
        </button>

        <button
          type="button"
          onClick={() => setIsCreateBeneficiaryOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#38d9a9] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#38d9a9] text-slate-900 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Plus className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Enregistrer bénéficiaire</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Saisie directe d'un dossier</div>
        </button>

        <button
          type="button"
          onClick={() => setIsAddDocumentOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#38d9a9] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#38d9a9] text-slate-900 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileText className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Déposer un document</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pièce officielle / contrat</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/equipe')}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#38d9a9] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#38d9a9] text-slate-900 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Équipe & Disponibilités</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Charge des coachs</div>
        </button>
      </div>

      {/* =========================================================================
          4. CORPS PRINCIPAL : CANDIDATURES À TRAITER + ALERTES & CHARGE COACHS
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLONNE GAUCHE (7/12) : Candidatures entrantes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Candidatures entrantes & Flux d'inscription
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Derniers dossiers déposés nécessitant qualification et affectation
                </p>
              </div>
              <Link 
                to="/candidatures"
                className="text-xs text-[#23c3b1] hover:underline font-medium flex items-center gap-1"
              >
                <span>Voir toutes (3)</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {incomingApplications.map((app) => (
                <div 
                  key={app.id}
                  onClick={() => navigate('/candidatures')}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#38d9a9] hover:bg-slate-50/50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">{app.candidateName}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${app.typeBadgeColor}`}>
                        {app.typeLabel}
                      </span>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${app.statusBadge}`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Programme : {app.program}</span>
                    <span>Reçu le {app.date}</span>
                  </div>

                  <div className="flex items-center justify-end text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                    <span>Qualifier et assigner un coach →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (5/12) : Alertes globales & Charge de l'équipe */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Alertes de coordination */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="size-4 text-[#f06553]" />
              Alertes globales plateforme
            </h2>

            <div className="space-y-2.5 text-xs">
              {globalAlerts.map((al) => (
                <div key={al.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">{al.title}</span>
                    <span className="text-[10px] text-slate-400">{al.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{al.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition de charge entre les coachs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Users className="size-4 text-[#23c3b1]" />
                Charge actuelle des coachs
              </h2>
              <Link to="/equipe" className="text-[11px] text-[#23c3b1] hover:underline font-medium">
                Voir équipe
              </Link>
            </div>

            <div className="space-y-3">
              {coachWorkloads.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({c.role})</span>
                    </div>
                    <span className="font-semibold text-slate-700 text-[11px]">{c.activeCount} dossiers</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`${c.capacityColor} h-full rounded-full transition-all`}
                      style={{ width: c.capacity }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODALES D'ACTION */}
      <CreateBeneficiaryModal
        isOpen={isCreateBeneficiaryOpen}
        onClose={() => setIsCreateBeneficiaryOpen(false)}
        onSuccess={() => {}}
      />

      <AddDocumentWizardModal
        isOpen={isAddDocumentOpen}
        onClose={() => setIsAddDocumentOpen(false)}
        onSuccess={() => {}}
      />

      <CreateAppointmentWizardModal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
        onSuccess={() => {}}
      />

    </div>
  );
}
