import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Crown, 
  Users, 
  Award, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import IssueCertificateModal from '../certificates/IssueCertificateModal';
import SendSurveyModal from '../surveys/SendSurveyModal';

export default function DirectionDashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modales d'action Direction
  const [isIssueCertificateOpen, setIsIssueCertificateOpen] = useState(false);
  const [isSendSurveyOpen, setIsSendSurveyOpen] = useState(false);

  // Nom affiché
  const adminName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Directeur IML Digit';

  // Dernières certifications numériques validées
  const recentCertificates = [
    {
      id: 'cert-1',
      recipient: 'SOPHIATECH GABON',
      type: 'PME',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Certification Parcours Restructuration & Digital',
      date: '10/10/2026',
      hash: 'IML-CERT-2026-8841',
      coach: 'Darius Coach IML'
    },
    {
      id: 'cert-2',
      recipient: 'Marine LOUPE',
      type: 'Start-up',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Validation Jalon Amorçage & Business Model',
      date: '02/10/2026',
      hash: 'IML-CERT-2026-7732',
      coach: 'Darius Coach IML'
    },
    {
      id: 'cert-3',
      recipient: 'COOPÉRATIVE AGRI-GABON',
      type: 'Organisation',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Attestation Structuration Gouvernance Collective',
      date: '28/09/2026',
      hash: 'IML-CERT-2026-6629',
      coach: 'Sarah BENALI'
    }
  ];

  // Performance des programmes
  const programPerformances = [
    {
      name: 'Programme Accélération Start-ups',
      count: 18,
      completionRate: 82,
      color: 'bg-purple-500'
    },
    {
      name: 'Programme Transformation & Relance PME',
      count: 14,
      completionRate: 76,
      color: 'bg-blue-500'
    },
    {
      name: 'Programme Structuration Organisations & Coopératives',
      count: 10,
      completionRate: 71,
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="w-full space-y-5 font-sans text-slate-800">
      
      {/* =========================================================================
          1. BANDEAU DE BIENVENUE DIRECTION
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#1a2533] via-[#243447] to-[#2c4056] rounded-xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-slate-900 flex items-center gap-1">
              <Crown className="size-3 fill-slate-900" />
              <span>Pilotage & Direction Générale</span>
            </span>
            <span className="text-xs text-slate-300">
              IML Digit • Tableau de bord de gouvernance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bonjour {adminName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Supervisez la performance globale de la plateforme, les indicateurs d'accompagnement (Start-ups, PME, Organisations) et les certifications délivrées.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <Link
            to="/audit"
            className="flex-1 md:flex-none text-center px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-colors"
          >
            Audit & Conformité
          </Link>
          <button
            type="button"
            onClick={() => setIsIssueCertificateOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[#23c3b1] hover:bg-[#1ba898] text-slate-900 text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Award className="size-3.5" />
            <span>Délivrer un certificat</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. KPI STRATÉGIQUES GLOBAUX
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Total structures suivies</span>
            <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">42</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>18 Start-ups • 14 PME • 10 Orga</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Équipe des coachs</span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">6</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>100% opérationnels et actifs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Heures de coaching délivrées</span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">348h</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            <span>+18% par rapport au T3</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-600">Certifications délivrées</span>
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">24</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Taux de complétion 78%</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ACTIONS RAPIDES DE DIRECTION
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setIsIssueCertificateOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-amber-400 hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-amber-400 text-slate-900 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Award className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700">Délivrer une certification</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Validation officielle de parcours</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/equipe')}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-[#23c3b1] hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#23c3b1] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-[#1ba898]">Superviser l'équipe</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Gestion des coachs & agents</div>
        </button>

        <button
          type="button"
          onClick={() => setIsSendSurveyOpen(true)}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-purple-400 hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-purple-500 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sparkles className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Enquête d'évaluation</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mesure de satisfaction & impact</div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/audit')}
          className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm text-left transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-md bg-[#1a2533] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Audit & Traçabilité</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Journal des actions & sécurité</div>
        </button>
      </div>

      {/* =========================================================================
          4. CORPS PRINCIPAL : PERFORMANCE DES PROGRAMMES + CERTIFICATIONS RÉCENTES
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLONNE GAUCHE (7/12) : Performance des programmes & répartition */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Performance des programmes d'accompagnement
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Taux de réussite et volume d'entreprises par filière
                </p>
              </div>
              <Link 
                to="/parcours"
                className="text-xs text-[#23c3b1] hover:underline font-medium flex items-center gap-1"
              >
                <span>Gérer parcours</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {programPerformances.map((prog, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{prog.name}</span>
                    <span className="text-slate-500 font-medium">{prog.count} entités suivies</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Taux de validation des jalons</span>
                      <span className="font-bold text-slate-700">{prog.completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`${prog.color} h-full rounded-full transition-all`}
                        style={{ width: `${prog.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Répartition par typologie */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Répartition des 42 entités accompagnées
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="font-bold text-purple-700 text-sm">43%</div>
                  <div className="text-[11px] text-purple-600 mt-0.5">Start-ups (18)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="font-bold text-blue-700 text-sm">33%</div>
                  <div className="text-[11px] text-blue-600 mt-0.5">PME (14)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="font-bold text-emerald-700 text-sm">24%</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">Organisations (10)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE (5/12) : Certifications officielles récentes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                Dernières certifications validées
              </h2>
              <button
                type="button"
                onClick={() => setIsIssueCertificateOpen(true)}
                className="text-[11px] text-[#f06553] hover:underline font-semibold"
              >
                + Délivrer
              </button>
            </div>

            <div className="space-y-3">
              {recentCertificates.map((cert) => (
                <div key={cert.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{cert.recipient}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.2 rounded border ${cert.badgeColor}`}>
                      {cert.type}
                    </span>
                  </div>
                  <div className="text-slate-600 font-medium text-[11px]">{cert.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Par {cert.coach}</span>
                    <span className="font-mono text-slate-500">{cert.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* MODALES D'ACTION */}
      <IssueCertificateModal
        isOpen={isIssueCertificateOpen}
        onClose={() => setIsIssueCertificateOpen(false)}
        onSuccess={() => {}}
      />

      <SendSurveyModal
        isOpen={isSendSurveyOpen}
        onClose={() => setIsSendSurveyOpen(false)}
      />

    </div>
  );
}
