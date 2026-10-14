import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  Loader2, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Edit,
  Calendar,
  Filter,
  Download,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  X,
  Play
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { TYPE_LABELS, STATUS_LABELS, STATUS_STYLE, PRIORITY_LABELS, STAGE_LABELS, SIZE_LABELS, type BeneficiaryDetail } from './types';
import { useSetBreadcrumbs } from '../../components/layout/AppBreadcrumb';
import RecordServiceModal from '../services/RecordServiceModal';
import CreateAppointmentWizardModal from '../appointments/CreateAppointmentWizardModal';

interface PrestationItem {
  id: string;
  date: string;
  beneficiaryName: string;
  duration: string;
  project: string;
  pathway: string;
  company: string;
  description: string;
}

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = useAuth();

  // Navigation par onglets (Bénéficiaires | Historique de temps | Présentation)
  const rawTab = searchParams.get('tab');
  const activeTab: 'beneficiaires' | 'historique' | 'presentation' = 
    rawTab === 'historique' || rawTab === 'temps' || rawTab === 'time'
      ? 'historique'
      : rawTab === 'presentation'
      ? 'presentation'
      : 'beneficiaires';

  const handleTabChange = (tab: 'beneficiaires' | 'historique' | 'presentation') => {
    setSearchParams({ tab });
  };

  // Modales
  const [isRecordServiceModalOpen, setIsRecordServiceModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);

  // Notes rapides locales pour ce dossier
  const [quickNote, setQuickNote] = useState<string>('');

  // Toast temporaire
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtres date onglet Historique
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [localPrestations, setLocalPrestations] = useState<PrestationItem[]>([]);

  // 1. Récupération des données du bénéficiaire
  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => api<{ beneficiary: BeneficiaryDetail }>(`/beneficiaries/${id}`),
  });

  const b = res?.beneficiary;

  // Initialisation note locale
  useEffect(() => {
    if (id) {
      const savedNote = localStorage.getItem(`iml_beneficiary_note_${id}`);
      if (savedNote) setQuickNote(savedNote);
    }
  }, [id]);

  const handleSaveQuickNote = () => {
    if (id) {
      localStorage.setItem(`iml_beneficiary_note_${id}`, quickNote);
      showToast('✓ Note enregistrée pour ce dossier');
      setIsQuickNoteModalOpen(false);
    }
  };

  // 2. Récupération des rendez-vous et prestations du bénéficiaire
  const { data: appointmentsRes, refetch: refetchAppointments } = useQuery({
    queryKey: ['beneficiary-appointments', id],
    queryFn: () => api<{ items: any[] }>(`/appointments?beneficiaryId=${id}`).catch(() => ({ items: [] })),
    enabled: !!id,
  });

  // Construction de la liste des prestations
  const allPrestations = useMemo<PrestationItem[]>(() => {
    const apiItems: PrestationItem[] = (appointmentsRes?.items || [])
      .filter((appt: any) => appt.session || appt.status === 'REALISE')
      .map((appt: any) => {
        const d = new Date(appt.datetime);
        const hours = Math.floor(appt.duration / 60);
        const mins = appt.duration % 60;
        const durationStr = `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : hours === 0 ? '0m' : ''}`.trim();
        return {
          id: appt.id,
          date: d.toLocaleDateString('fr-FR'),
          beneficiaryName: b ? `${b.firstName} ${b.lastName}` : 'Marine LOUPE',
          duration: durationStr || '1h 00m',
          project: b?.projects?.[0]?.name || 'Projet emploi',
          pathway: appt.session?.nextActions?.replace('Parcours: ', '') || b?.program?.name || "Création d'entreprise",
          company: b?.type === 'ENTREPRISE' ? (b?.projects?.[0]?.name || 'IML Digit') : 'IML Digit',
          description: appt.session?.summary || appt.location || "Session d'accompagnement"
        };
      });
    return [...localPrestations, ...apiItems];
  }, [appointmentsRes, localPrestations, b]);

  // Filtrage des prestations
  const filteredPrestations = useMemo(() => {
    return allPrestations.filter(p => {
      if (historyStartDate.trim() && !p.date.includes(historyStartDate.trim())) return false;
      if (historyEndDate.trim() && !p.date.includes(historyEndDate.trim())) return false;
      return true;
    });
  }, [allPrestations, historyStartDate, historyEndDate]);

  // Séparation des rendez-vous : à venir vs à planifier
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return (appointmentsRes?.items || []).filter((appt: any) => {
      return appt.status === 'PLANIFIE' && new Date(appt.datetime) >= now;
    });
  }, [appointmentsRes]);

  const toPlanAppointments = useMemo(() => {
    return (appointmentsRes?.items || []).filter((appt: any) => {
      return appt.status === 'NON_ASSIGNE';
    });
  }, [appointmentsRes]);

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = "Date;Bénéficiaire;Durée;Projet emploi;Parcours;Société;Description\n";
    const rows = filteredPrestations.map(p => 
      `"${p.date}";"${p.beneficiaryName}";"${p.duration}";"${p.project}";"${p.pathway}";"${p.company}";"${p.description}"`
    ).join('\n');
    
    const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `feuille_prestations_${b?.firstName || 'beneficiaire'}_${b?.lastName || ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Export des prestations téléchargé (format CSV)');
  };

  const handleDeletePrestation = (pId: string) => {
    setLocalPrestations(prev => prev.filter(p => p.id !== pId));
    showToast('✓ Prestation supprimée de la liste');
  };

  useSetBreadcrumbs(
    b ? [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: `${b.firstName} ${b.lastName}`, icon: User }
    ] : [
      { label: 'Bénéficiaires', to: '/beneficiaires', icon: User },
      { label: 'Dossier bénéficiaire', icon: User }
    ]
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-iml-500" />
      </div>
    );
  }

  if (isError || !b) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
        <p className="mb-4">Impossible de charger les détails du dossier.</p>
        <button onClick={() => void refetch()} className="font-medium underline hover:text-red-900">Réessayer</button>
      </div>
    );
  }

  const p = b.projects[0];

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-5">
      
      {/* =========================================================================
          EN-TÊTE : NOM DU BÉNÉFICIAIRE, STATUT & ACTIONS
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/beneficiaires')} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Retour à la liste"
          >
            <ArrowLeft className="size-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{b.firstName} {b.lastName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[b.status]}`}>
                {STATUS_LABELS[b.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Dossier n° {b.fileNumber} · Ajouté le {new Date(b.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        
        {can('beneficiaries:write') && (
          <Link 
            to={`/beneficiaires/${id}/modifier`} 
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Edit className="size-3.5" />
            <span>Modifier le dossier</span>
          </Link>
        )}
      </div>

      {/* =========================================================================
          CARTE PRINCIPALE AVEC LES ONGLETS BLEU ARDOISE FONCÉ (#1e3347)
         ========================================================================= */}
      <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
        
        {/* Barre d'onglets foncée (Image 1) */}
        <div className="bg-[#1e3347] flex items-center border-b border-[#182a3a]">
          
          {/* Onglet 1 : Bénéficiaires */}
          <button
            type="button"
            onClick={() => handleTabChange('beneficiaires')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              activeTab === 'beneficiaires'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Bénéficiaires
          </button>

          {/* Onglet 2 : Historique de temps */}
          <button
            type="button"
            onClick={() => handleTabChange('historique')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              activeTab === 'historique'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Historique de temps
          </button>

          {/* Onglet 3 : Présentation */}
          <button
            type="button"
            onClick={() => handleTabChange('presentation')}
            className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
              activeTab === 'presentation'
                ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Présentation
          </button>

        </div>

        {/* =======================================================================
            ONGLET 1 : BÉNÉFICIAIRES (Image 2)
           ======================================================================= */}
        {activeTab === 'beneficiaires' && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Bandeau jaune / ambre : "Il vous reste 25 jour(s) gratuit(s)" */}
            <div className="flex justify-center">
              <div className="bg-[#fef08a] border border-[#fde047] text-amber-900 text-xs font-semibold px-4 py-1.5 rounded shadow-2xs">
                Il vous reste 25 jour(s) gratuit(s)
              </div>
            </div>

            {/* Section 1 : Rendez-vous à venir */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-normal text-slate-800">
                  Rendez-vous à venir
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="text-xs text-[#23c3b1] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Planifier un rendez-vous</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700">
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Date</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Parcours</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Étape ou titre</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Coach</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Type</th>
                      <th className="py-2.5 px-3 font-normal">Lieu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="size-11 rounded-full bg-[#23c3b1] text-white flex items-center justify-center mx-auto mb-3 shadow-2xs">
                            <Calendar className="size-5" />
                          </div>
                          <p className="text-xs text-slate-500 font-normal">
                            Il n'y a pas de rendez-vous
                          </p>
                        </td>
                      </tr>
                    ) : (
                      upcomingAppointments.map((appt: any) => {
                        const d = new Date(appt.datetime);
                        return (
                          <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">
                              {d.toLocaleDateString('fr-FR')} {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                              {b.program?.name || 'Parcours IML'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">
                              {appt.location || "Session d'accompagnement"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                              {b.assignedAgent ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` : 'Coach référent'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                              Individuel
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {appt.location || 'En ligne / Visio'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2 : Rendez-vous à planifier (max 10) */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs sm:text-sm font-normal text-slate-800">
                Rendez-vous à planifier (max 10)
              </h3>

              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700">
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Date</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Parcours</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Étape ou titre</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Coach</th>
                      <th className="py-2.5 px-3 font-normal border-r border-slate-200">Type</th>
                      <th className="py-2.5 px-3 font-normal">Lieu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toPlanAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="size-11 rounded-full bg-[#23c3b1] text-white flex items-center justify-center mx-auto mb-3 shadow-2xs">
                            <Calendar className="size-5" />
                          </div>
                          <p className="text-xs text-slate-500 font-normal">
                            Il n'y a pas de rendez-vous
                          </p>
                        </td>
                      </tr>
                    ) : (
                      toPlanAppointments.map((appt: any) => (
                        <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100">À définir</td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">{b.program?.name || 'Parcours IML'}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">{appt.location || "Séance à programmer"}</td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">{b.assignedAgent?.firstName || 'Coach'}</td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">Individuel</td>
                          <td className="py-2.5 px-3 text-slate-600">—</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================================
            ONGLET 2 : HISTORIQUE DE TEMPS (Image 1)
           ======================================================================= */}
        {activeTab === 'historique' && (
          <div className="space-y-0">
            
            {/* Zone supérieure de filtres & actions (Du / Au / Filtrer | Feuille / Exporter / + Ajouter) */}
            <div className="bg-[#f8fafc] p-4 sm:p-5 border-b border-slate-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                
                {/* Gauche : Filtres dates Du / Au / Filtrer */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-500" />
                    <span className="text-slate-600 font-medium">Du</span>
                    <input
                      type="text"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      placeholder="Ex : 00/00/..."
                      className="w-28 h-7 px-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f06553] shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-slate-500" />
                    <span className="text-slate-600 font-medium">Au</span>
                    <input
                      type="text"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      placeholder="Ex : 00/00/..."
                      className="w-28 h-7 px-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f06553] shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(`✓ Filtre appliqué : ${filteredPrestations.length} prestation(s)`)}
                    className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Filter className="size-3 fill-white" />
                    <span>Filtrer</span>
                  </button>
                </div>

                {/* Droite : 3 Boutons Corail */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTimesheetModalOpen(true)}
                      className="h-7 px-3 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <FileText className="size-3.5" />
                      <span>Feuille de prestations</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="h-7 px-3 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Exporter</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRecordServiceModalOpen(true)}
                    className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5 stroke-[2.5]" />
                    <span>Ajouter une prestation</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Zone inférieure : Légende + Tableau des temps */}
            <div className="p-4 sm:p-5 space-y-3 bg-white">
              
              {/* Légende en haut à droite */}
              <div className="flex justify-end">
                <div className="border border-slate-200 rounded px-2.5 py-1 bg-white text-[11px] text-slate-500 shadow-2xs">
                  Légende: <span className="text-slate-700">h</span> = heures, <span className="text-slate-700">m</span> = minutes
                </div>
              </div>

              {/* Tableau exact Image 1 */}
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-xs text-left border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700 font-normal">
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[90px]">Date</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[140px]">Bénéficiaire</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[70px]">Dur...</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[120px]">Projet empl</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[120px]">Parcours</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[80px]">Soc...</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 font-normal min-w-[180px]">Description</th>
                      <th className="py-2.5 px-3 font-normal text-center min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrestations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 font-normal">
                          Aucun temps enregistré pour ce bénéficiaire actuellement
                        </td>
                      </tr>
                    ) : (
                      filteredPrestations.map((pr) => (
                        <tr key={pr.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap border-r border-slate-100">{pr.beneficiaryName}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.duration}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.project}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.pathway}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{pr.company}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate border-r border-slate-100" title={pr.description}>{pr.description}</td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeletePrestation(pr.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                              title="Supprimer cette prestation"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* =======================================================================
            ONGLET 3 : PRÉSENTATION & DOSSIER STRUCTURÉ
           ======================================================================= */}
        {activeTab === 'presentation' && (
          <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche : Contact & Suivi */}
              <div className="space-y-6 lg:col-span-1">
                <section className="bg-slate-50/70 rounded-lg border border-slate-200 p-5">
                  <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Informations Contact
                  </h2>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <User className="size-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-slate-700">{TYPE_LABELS[b.type]}</div>
                        <div className="text-[11px] text-slate-500">Type de profil</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="size-4 text-slate-400 mt-0.5" />
                      <div>
                        <a href={`mailto:${b.email}`} className="font-medium text-[#23c3b1] hover:underline">{b.email}</a>
                        <div className="text-[11px] text-slate-500">E-mail</div>
                      </div>
                    </div>
                    {b.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="size-4 text-slate-400 mt-0.5" />
                        <div>
                          <a href={`tel:${b.phone}`} className="font-medium text-slate-700 hover:underline">{b.phone}</a>
                          <div className="text-[11px] text-slate-500">Téléphone</div>
                        </div>
                      </div>
                    )}
                    {b.city && (
                      <div className="flex items-start gap-3">
                        <MapPin className="size-4 text-slate-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-700">{b.city}</div>
                          <div className="text-[11px] text-slate-500">Localisation</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-slate-50/70 rounded-lg border border-slate-200 p-5">
                  <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                    Suivi & Accompagnement
                  </h2>
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Agent responsable</div>
                      <div className="font-medium text-slate-800">
                        {b.assignedAgent ? `${b.assignedAgent.firstName} ${b.assignedAgent.lastName}` : <span className="text-slate-400 italic">Non assigné</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Programme d'incubation</div>
                      <div className="font-medium text-slate-800">
                        {b.program?.name || <span className="text-slate-400 italic">Aucun programme</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-0.5">Niveau de priorité</div>
                      <div className="font-medium text-slate-800">{PRIORITY_LABELS[b.priority]}</div>
                    </div>
                    {b.startDate && (
                      <div>
                        <div className="text-[11px] text-slate-500 mb-0.5">Date de début d'accompagnement</div>
                        <div className="font-medium text-slate-800">{new Date(b.startDate).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Colonne droite : Projet & Besoins */}
              <div className="space-y-6 lg:col-span-2">
                {p ? (
                  <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 p-5">
                      <div className="flex items-center gap-3 mb-1.5">
                        <Building2 className="size-5 text-[#23c3b1]" />
                        <h2 className="text-lg font-bold text-slate-800">{p.name}</h2>
                      </div>
                      {p.sector && (
                        <div className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                          Secteur : {p.sector.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 text-xs">
                      <div className="mb-6">
                        <h3 className="font-semibold text-slate-800 mb-1.5">Description du projet</h3>
                        {p.description ? (
                          <p className="text-slate-600 whitespace-pre-line leading-relaxed">{p.description}</p>
                        ) : (
                          <p className="text-slate-400 italic">Aucune description fournie.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded border border-slate-100">
                        <div>
                          <div className="text-[11px] text-slate-500 mb-0.5">Stade d'avancement</div>
                          <div className="font-medium text-slate-800">{STAGE_LABELS[p.stage]}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 mb-0.5">Type de projet</div>
                          <div className="font-medium text-slate-800">{p.projectType || '—'}</div>
                        </div>
                        
                        {b.type === 'ENTREPRISE' && (
                          <>
                            <div>
                              <div className="text-[11px] text-slate-500 mb-0.5">Date de création</div>
                              <div className="font-medium text-slate-800">
                                {p.companyCreatedAt ? new Date(p.companyCreatedAt).toLocaleDateString('fr-FR') : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 mb-0.5">Statut Juridique</div>
                              <div className="font-medium text-slate-800">{p.legalStatus || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500 mb-0.5">Taille</div>
                              <div className="font-medium text-slate-800">{p.companySize ? SIZE_LABELS[p.companySize] : '—'}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {p.priorityNeeds && (
                        <div className="mt-6 border-t border-slate-100 pt-5">
                          <h3 className="font-semibold text-slate-800 mb-1.5">Besoins prioritaires</h3>
                          <p className="text-slate-600 whitespace-pre-line leading-relaxed">{p.priorityNeeds}</p>
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
                    <FileText className="size-10 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-sm font-medium text-slate-800 mb-1">Aucun projet</h3>
                    <p className="text-slate-500 text-xs">Ce bénéficiaire n'a pas encore de projet associé.</p>
                  </div>
                )}

                {b.initialObjectives && (
                  <section className="bg-white rounded-lg border border-slate-200 p-5 text-xs">
                    <h2 className="font-semibold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                      Objectifs initiaux
                    </h2>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed">{b.initialObjectives}</p>
                  </section>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* =========================================================================
          BOUTONS D'ACTION FLOTTANTS EN BAS À DROITE (Image 2)
         ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {/* Bouton 1 : Chronomètre / Enregistrer une prestation */}
        <button
          type="button"
          onClick={() => setIsRecordServiceModalOpen(true)}
          title="Pointer une prestation / Chrono"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer relative group"
        >
          <Clock className="size-5" />
          <Play className="size-2.5 fill-white text-white absolute bottom-2.5 right-2.5" />
        </button>

        {/* Bouton 2 : Bloc-notes rapide du dossier */}
        <button
          type="button"
          onClick={() => setIsQuickNoteModalOpen(true)}
          title="Note rapide pour ce bénéficiaire"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          <FileText className="size-5" />
        </button>

        {/* Bouton 3 : Messagerie */}
        <button
          type="button"
          onClick={() => navigate('/messages')}
          title="Messagerie instantanée"
          className="size-11 rounded-full bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          <MessageSquare className="size-5" />
        </button>
      </div>

      {/* =========================================================================
          MODALE 1 : ENREGISTRER UNE PRESTATION
         ========================================================================= */}
      <RecordServiceModal
        isOpen={isRecordServiceModalOpen}
        onClose={() => setIsRecordServiceModalOpen(false)}
        onSuccess={() => {
          refetchAppointments();
          showToast('✓ Prestation enregistrée avec succès');
          setIsRecordServiceModalOpen(false);
        }}
        defaultBeneficiaryId={b.id}
        defaultBeneficiaryName={`${b.firstName} ${b.lastName}`}
      />

      {/* =========================================================================
          MODALE 2 : PLANIFIER UN RENDEZ-VOUS
         ========================================================================= */}
      <CreateAppointmentWizardModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={() => {
          refetchAppointments();
          showToast('✓ Rendez-vous planifié avec succès');
          setIsAppointmentModalOpen(false);
        }}
        defaultBeneficiaryId={b.id}
      />

      {/* =========================================================================
          MODALE 3 : FEUILLE DE PRESTATIONS
         ========================================================================= */}
      {isTimesheetModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">
                    Feuille de prestations
                  </h3>
                  <p className="text-[11px] text-slate-500">Bénéficiaire : {b.firstName} {b.lastName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimesheetModalOpen(false)}
                className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded border border-slate-200">
                <div>
                  <p className="text-slate-500 text-[11px]">Période</p>
                  <p className="font-semibold text-slate-800">
                    Mois en cours ({new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px]">Total d'heures enregistrées</p>
                  <p className="font-bold text-[#f06553] text-sm">
                    {filteredPrestations.length > 0 ? `${filteredPrestations.length} session(s)` : '0h 00m'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                      <th className="p-2 border-b border-slate-200">Date</th>
                      <th className="p-2 border-b border-slate-200">Projet</th>
                      <th className="p-2 border-b border-slate-200">Durée</th>
                      <th className="p-2 border-b border-slate-200">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPrestations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          Aucune prestation pour ce mois.
                        </td>
                      </tr>
                    ) : (
                      filteredPrestations.map(pr => (
                        <tr key={pr.id}>
                          <td className="p-2 text-slate-600">{pr.date}</td>
                          <td className="p-2 font-medium text-slate-800">{pr.project}</td>
                          <td className="p-2 text-slate-600">{pr.duration}</td>
                          <td className="p-2 text-slate-600">{pr.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>Télécharger l'état (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          MODALE 4 : NOTE RAPIDE DU DOSSIER
         ========================================================================= */}
      {isQuickNoteModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                  <FileText className="size-3.5" />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">
                  Bloc-notes rapide · {b.firstName} {b.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickNoteModalOpen(false)}
                className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                  Mémo & Notes d'accompagnement internes
                </label>
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  rows={6}
                  placeholder="Écrivez vos notes de suivi, observations ou rappels pour ce bénéficiaire..."
                  className="w-full text-xs p-3 rounded border border-slate-200 focus:outline-none focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="h-8 px-4 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickNote}
                  className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          TOAST NOTIFICATION FLOTTANT
         ========================================================================= */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-6 z-[80] animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#23c3b1] animate-ping" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
