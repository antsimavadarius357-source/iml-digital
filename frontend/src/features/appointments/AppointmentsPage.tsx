import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Video, 
  FileText, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import BeneficiaryRequiredModal from '../beneficiaries/BeneficiaryRequiredModal';
import CreateAppointmentWizardModal from './CreateAppointmentWizardModal';
import OfficialConvocationModal, { type ConvocationData } from './OfficialConvocationModal';

const STATUS_LABELS: Record<string, string> = {
  PLANIFIE: 'Planifié',
  REALISE: 'Réalisé',
  ANNULE: 'Annulé',
  ABSENT: 'Absent'
};

const STATUS_STYLE: Record<string, string> = {
  PLANIFIE: 'bg-blue-50 text-blue-700',
  REALISE: 'bg-emerald-50 text-emerald-700',
  ANNULE: 'bg-slate-100 text-slate-700',
  ABSENT: 'bg-red-50 text-red-700'
};

export default function AppointmentsPage() {
  const { can, user } = useAuth();
  const isCoach = !!(user && (
    user.role === 'COACH' || 
    user.roleLabel?.toLowerCase().includes('coach') || 
    user.email?.toLowerCase().includes('coach')
  ));
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState<string | null>(null);
  const [isCreateBeneficiaryOpen, setIsCreateBeneficiaryOpen] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);
  const [convocationData, setConvocationData] = useState<ConvocationData | null>(null);
  const [isConvocationOpen, setIsConvocationOpen] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api<{ items: any[] }>('/appointments').then(r => r.items)
  });

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PLANIFIE' | 'PASSED'>('ALL');

  const counts = useMemo(() => {
    if (!appointments) return { total: 0, planifie: 0, passed: 0 };
    const planifie = appointments.filter(a => a.status === 'PLANIFIE').length;
    return {
      total: appointments.length,
      planifie,
      passed: appointments.length - planifie
    };
  }, [appointments]);

  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];

    const filtered = appointments.filter(a => {
      if (filterStatus === 'PLANIFIE') return a.status === 'PLANIFIE';
      if (filterStatus === 'PASSED') return a.status !== 'PLANIFIE';
      return true;
    });

    return [...filtered].sort((a, b) => {
      // 1. Les planifications (statut 'PLANIFIE') en haut, les séances déjà réalisées / passées en bas
      const isAPlanned = a.status === 'PLANIFIE';
      const isBPlanned = b.status === 'PLANIFIE';
      if (isAPlanned && !isBPlanned) return -1;
      if (!isAPlanned && isBPlanned) return 1;

      // 2. Dates les plus récentes en haut (ordre antéchronologique : plus récentes en premier)
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return dateB - dateA;
    });
  }, [appointments, filterStatus]);

  const { data: bRes } = useQuery({ 
    queryKey: ['beneficiaries-list'], 
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100') 
  });
  const beneficiaries = bRes?.items || [];

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api(`/appointments/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
  });

  const [editingAppt, setEditingAppt] = useState<any | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editLocation, setEditLocation] = useState('');

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api(`/appointments/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setEditingAppt(null);
    }
  });

  const handleOpenEditAppt = (app: any) => {
    setEditingAppt(app);
    const d = new Date(app.datetime);
    setEditDate(d.toISOString().split('T')[0]);
    setEditTime(d.toTimeString().slice(0, 5));
    setEditDuration(app.duration || 60);
    setEditLocation(app.location || '');
  };

  const handleSaveEditAppt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    const combined = new Date(`${editDate}T${editTime}:00`).toISOString();
    editMut.mutate({
      id: editingAppt.id,
      data: {
        datetime: combined,
        duration: Number(editDuration),
        location: editLocation
      }
    });
  };

  const sessionMut = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api(`/appointments/${id}/session`, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowSessionModal(null);
    }
  });

  const handleSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    sessionMut.mutate({
      id: showSessionModal!,
      data: {
        durationHours: parseFloat(fd.get('durationHours') as string),
        summary: fd.get('summary'),
        nextActions: fd.get('nextActions') || undefined
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {user?.role === 'COACH' ? 'Mon Planning de séances' : 'Rendez-vous & Agenda'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === 'COACH' 
              ? "Vos séances d'accompagnement programmées par l'agent de planification." 
              : 'Calendrier des rendez-vous et séances d\'accompagnement.'}
          </p>
        </div>
        {can('appointments:manage') && user?.role !== 'COACH' && (
          <button 
            type="button"
            onClick={() => {
              if (beneficiaries.length === 0) {
                setShowRequiredModal(true);
              } else {
                setShowModal(true);
              }
            }} 
            className="flex items-center gap-2 bg-[#23c3b1] hover:bg-[#1db09e] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Nouveau RDV
          </button>
        )}
      </div>

      {/* Onglets rapides : Tous, Planifiés, Réalisés / Historique */}
      {appointments && appointments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('PLANIFIE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'PLANIFIE'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="size-1.5 rounded-full bg-blue-500" />
              <span>Planifiés en cours ({counts.planifie})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('PASSED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'PASSED'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Réalisés & Historique ({counts.passed})</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : (beneficiaries.length === 0 && user?.role !== 'COACH') ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="size-16 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center mb-5 text-slate-700 shadow-2xs">
              <CalendarIcon className="size-7 stroke-[1.5]" />
            </div>
            <h2 className="text-xl sm:text-[22px] font-semibold text-slate-800 tracking-tight mb-2.5">
              Planifier un rendez-vous
            </h2>
            <p className="text-slate-600 text-sm sm:text-[14.5px] leading-relaxed mb-7 max-w-sm font-normal">
              Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir planifier un rendez-vous.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateBeneficiaryOpen(true)}
              className="px-7 py-2.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-sm font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              Créer un bénéficiaire
            </button>
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {filterStatus === 'PLANIFIE'
              ? 'Aucun rendez-vous actuellement planifié à venir.'
              : filterStatus === 'PASSED'
              ? 'Aucune séance réalisée dans l\'historique.'
              : user?.role === 'COACH'
              ? 'Aucun rendez-vous planifié par le chargé de projet pour le moment. Vos séances programmées apparaîtront ici.'
              : 'Aucun rendez-vous trouvé.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedAppointments.map(app => (
              <div key={app.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                      <h3 className="font-semibold text-slate-800">
                        {app.beneficiary.firstName} {app.beneficiary.lastName}
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="size-4 text-slate-400" />
                        {new Date(app.datetime).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-4 text-slate-400" />
                        {new Date(app.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} ({app.duration} min)
                      </div>
                      {app.location && (() => {
                        const lower = app.location.toLowerCase();
                        const isVisio = lower.includes('visio') || lower.includes('meet') || lower.includes('zoom') || lower.includes('teams') || app.location.includes('http');
                        
                        // Nettoyage visuel si balises structurées [EXPERT:...]
                        let cleanLocation = app.location;
                        if (app.location.includes('[EXPERT:') || app.location.includes('[MISSION:')) {
                          const missionMatch = app.location.match(/\[MISSION:(.*?)\]/);
                          const formatMatch = app.location.match(/\[FORMAT:(.*?)\]/);
                          const expertMatch = app.location.match(/\[EXPERT:(.*?)\]/);
                          const parts: string[] = [];
                          if (missionMatch) parts.push(missionMatch[1]);
                          if (formatMatch) parts.push(formatMatch[1]);
                          if (expertMatch) parts.push(`Expert : ${expertMatch[1]}`);
                          if (parts.length > 0) cleanLocation = parts.join(' • ');
                        }

                        return (
                          <div className="flex items-center gap-1.5">
                            {isVisio ? (
                              <Video className="size-4 text-[#f06553]" />
                            ) : (
                              <MapPin className="size-4 text-slate-400" />
                            )}
                            <span className={isVisio ? "font-medium text-slate-700" : ""}>{cleanLocation}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Bouton Rejoindre la visio affiché pour toutes les séances avec indicateur visio */}
                    {app.location && (() => {
                      const lower = app.location.toLowerCase();
                      const isVisio = lower.includes('visio') || lower.includes('meet') || lower.includes('zoom') || lower.includes('teams') || app.location.includes('http');
                      if (!isVisio) return null;

                      const match = app.location.match(/https?:\/\/[^\s\]]+/);
                      const cleanId = app.id ? app.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8) : 'seance';
                      const url = match ? match[0] : `https://meet.jit.si/imldigit-seance-${cleanId}`;

                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f06553] hover:bg-[#e05341] text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                          title="Rejoindre la salle de visioconférence en 1 clic"
                        >
                          <Video className="size-3.5" />
                          <span>Rejoindre la visio</span>
                          <ExternalLink className="size-3" />
                        </a>
                      );
                    })()}

                    {/* Bouton Lettre de Convocation Officielle */}
                    {!isCoach && (
                      <button
                        type="button"
                        onClick={() => {
                          const isVideo = app.location && (app.location.includes('http') || app.location.toLowerCase().includes('visio'));
                          const coachFullName = app.user ? `${app.user.firstName} ${app.user.lastName}` : (user ? `${user.firstName} ${user.lastName}` : 'Coach IML');
                          setConvocationData({
                            appointmentId: app.id,
                            recipientName: `${app.beneficiary.firstName} ${app.beneficiary.lastName}`,
                            recipientEmail: app.beneficiary.email,
                            recipientPhone: app.beneficiary.phone,
                            projectName: app.beneficiary?.projects?.[0]?.name,
                            datetime: app.datetime,
                            durationMinutes: app.duration || 60,
                            sessionType: isVideo ? 'video' : 'in_person',
                            locationOrUrl: app.location || 'Siège IML Digit, Libreville',
                            coachName: coachFullName,
                            coachEmail: app.user?.email,
                            createdAt: app.createdAt,
                            initialTab: 'convocation',
                          });
                          setIsConvocationOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="Visualiser et imprimer la lettre de convocation officielle"
                      >
                        <FileText className="size-3.5 text-slate-500" />
                        <span>Convocation</span>
                      </button>
                    )}

                    {/* Actions de planification (réservées au chargé de projet / agent) */}
                    {!isCoach && (
                      <>
                        {app.status === 'PLANIFIE' && (
                          <button onClick={() => statusMut.mutate({ id: app.id, status: 'ANNULE' })} className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-xs transition-colors cursor-pointer">
                            <XCircle className="size-3.5" /> Annuler
                          </button>
                        )}

                        {/* Bouton Modifier */}
                        <button 
                          type="button"
                          onClick={() => handleOpenEditAppt(app)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                          title="Modifier les détails du rendez-vous"
                        >
                          <Pencil className="size-3 text-slate-600" />
                          <span className="hidden sm:inline">Modifier</span>
                        </button>

                        {/* Bouton Supprimer */}
                        <button 
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Confirmez-vous la suppression définitive de ce rendez-vous ?`)) {
                              deleteMut.mutate(app.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
                          title="Supprimer définitivement ce rendez-vous"
                        >
                          <Trash2 className="size-3.5 text-rose-600" />
                        </button>
                      </>
                    )}
                    {app.session && (
                      <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Séance réalisée ({app.session.durationHours}h)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {app.session && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                    <p className="font-medium text-slate-700 mb-1">Compte-rendu :</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{app.session.summary}</p>
                    {app.session.nextActions && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="font-medium text-slate-700 mb-1">Prochaines actions :</p>
                        <p className="text-slate-600 whitespace-pre-wrap">{app.session.nextActions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateAppointmentWizardModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />

      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Saisir le Compte-Rendu</h2>
              <button onClick={() => setShowSessionModal(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pointage réel (heures)</label>
                <input type="number" name="durationHours" defaultValue={1} min={0.25} step={0.25} required className="w-full rounded-md border-slate-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Résumé de la séance</label>
                <textarea name="summary" rows={4} required className="w-full rounded-md border-slate-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prochaines actions</label>
                <textarea name="nextActions" rows={3} className="w-full rounded-md border-slate-300 shadow-sm p-2 border" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSessionModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={sessionMut.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">Valider et Pointer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avertissement bénéficiaire requis */}
      <BeneficiaryRequiredModal
        isOpen={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        onOpenCreateBeneficiary={() => setIsCreateBeneficiaryOpen(true)}
        title="Planifier un rendez-vous"
        message="Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir planifier un rendez-vous."
        icon={CalendarIcon}
      />

      {/* Création directe de bénéficiaire */}
      <CreateBeneficiaryModal
        isOpen={isCreateBeneficiaryOpen}
        onClose={() => setIsCreateBeneficiaryOpen(false)}
        onSuccess={() => {
          setIsCreateBeneficiaryOpen(false);
          setShowModal(true);
        }}
      />

      {/* Modale de visualisation et impression de la convocation officielle */}
      <OfficialConvocationModal
        isOpen={isConvocationOpen}
        onClose={() => setIsConvocationOpen(false)}
        data={convocationData}
      />

      {/* Modale de modification de rendez-vous */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#101f2e] text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Modifier le rendez-vous</h3>
                <p className="text-[11px] text-slate-300">
                  {editingAppt.beneficiary?.firstName} {editingAppt.beneficiary?.lastName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingAppt(null)} 
                className="text-slate-300 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditAppt} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={editDate} 
                    onChange={(e) => setEditDate(e.target.value)} 
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Heure *</label>
                  <input 
                    type="time" 
                    required 
                    value={editTime} 
                    onChange={(e) => setEditTime(e.target.value)} 
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Durée (minutes)</label>
                <select 
                  value={editDuration} 
                  onChange={(e) => setEditDuration(Number(e.target.value))} 
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure (60 min)</option>
                  <option value={90}>1 heure 30 (90 min)</option>
                  <option value={120}>2 heures (120 min)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Lieu ou Lien Visioconférence</label>
                <input 
                  type="text" 
                  value={editLocation} 
                  onChange={(e) => setEditLocation(e.target.value)} 
                  placeholder="Ex : Visioconférence [https://meet.jit.si/...] ou Siège IML Digit" 
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none" 
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setEditingAppt(null)} 
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={editMut.isPending} 
                  className="px-4 py-2 bg-[#23c3b1] hover:bg-[#1db09e] text-white rounded-md text-xs font-bold disabled:opacity-50 shadow-2xs"
                >
                  {editMut.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
