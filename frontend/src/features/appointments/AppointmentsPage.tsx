import { useState } from 'react';
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
  Printer
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import CreateBeneficiaryModal from '../beneficiaries/CreateBeneficiaryModal';
import BeneficiaryRequiredModal from '../beneficiaries/BeneficiaryRequiredModal';
import CreateAppointmentWizardModal from './CreateAppointmentWizardModal';
import OfficialConvocationModal, { type ConvocationData } from './OfficialConvocationModal';
import AttendanceSheetModal, { type AttendanceSheetData } from './AttendanceSheetModal';

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
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState<string | null>(null);
  const [isCreateBeneficiaryOpen, setIsCreateBeneficiaryOpen] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);
  const [convocationData, setConvocationData] = useState<ConvocationData | null>(null);
  const [isConvocationOpen, setIsConvocationOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceSheetData | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api<{ items: any[] }>('/appointments').then(r => r.items)
  });

  const { data: bRes } = useQuery({ 
    queryKey: ['beneficiaries-list'], 
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100') 
  });
  const beneficiaries = bRes?.items || [];

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api(`/appointments/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
  });

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Agendas & Prestations</h1>
        {can('appointments:manage') && (
          <button 
            type="button"
            onClick={() => {
              if (beneficiaries.length === 0) {
                setShowRequiredModal(true);
              } else {
                setShowModal(true);
              }
            }} 
            className="flex items-center gap-2 bg-[#23c3b1] hover:bg-[#1db09e] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            Nouveau RDV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : beneficiaries.length === 0 ? (
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
        ) : appointments?.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucun rendez-vous planifié.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments?.map(app => (
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
                      {app.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-4 text-slate-400" />
                          {app.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Lien Visio en 1 clic si présent */}
                    {app.location && (app.location.includes('http') || app.location.toLowerCase().includes('visio')) && (
                      (() => {
                        const match = app.location.match(/https?:\/\/[^\s\]]+/);
                        const url = match ? match[0] : null;
                        if (!url) return null;
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
                      })()
                    )}

                    {/* Bouton Lettre de Convocation Officielle */}
                    <button
                      type="button"
                      onClick={() => {
                        const isVideo = app.location && (app.location.includes('http') || app.location.toLowerCase().includes('visio'));
                        setConvocationData({
                          appointmentId: app.id,
                          recipientName: `${app.beneficiary.firstName} ${app.beneficiary.lastName}`,
                          recipientEmail: app.beneficiary.email,
                          datetime: app.datetime,
                          durationMinutes: app.duration || 60,
                          sessionType: isVideo ? 'video' : 'in_person',
                          locationOrUrl: app.location || 'Siège IML Digit, Libreville',
                          coachName: user ? `${user.firstName} ${user.lastName}` : 'Agent IML Digit',
                        });
                        setIsConvocationOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="Visualiser et imprimer la lettre de convocation officielle"
                    >
                      <FileText className="size-3.5 text-slate-500" />
                      <span>Convocation</span>
                    </button>

                    {/* Bouton Feuille d'Émargement Officielle de Séance */}
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceData({
                          appointmentId: app.id,
                          datetime: app.datetime,
                          durationMinutes: app.duration || 60,
                          beneficiaryName: `${app.beneficiary.firstName} ${app.beneficiary.lastName}`,
                          beneficiaryType: app.beneficiary.type,
                          representativeName: `${app.beneficiary.firstName} ${app.beneficiary.lastName}`,
                          representativeEmail: app.beneficiary.email,
                          representativePhone: app.beneficiary.phone,
                          coachName: user ? `${user.firstName} ${user.lastName}` : 'Agent IML Digit',
                          location: app.location || 'Espace PME, Quartier B2, Libreville',
                          summary: app.session?.summary,
                          nextActions: app.session?.nextActions,
                        });
                        setIsAttendanceOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="Générer la feuille d'émargement officielle de présence"
                    >
                      <Printer className="size-3.5" />
                      <span>Émargement</span>
                    </button>

                    {app.status === 'PLANIFIE' && (
                      <>
                        <button onClick={() => setShowSessionModal(app.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-sm font-medium transition-colors">
                          <CheckCircle2 className="size-4" /> Terminer / Saisir CR
                        </button>
                        <button onClick={() => statusMut.mutate({ id: app.id, status: 'ANNULE' })} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm transition-colors">
                          <XCircle className="size-4" /> Annuler
                        </button>
                      </>
                    )}
                    {app.session && (
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        Pointage: {app.session.durationHours}h
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

      {/* Modale d'attestation et feuille d'émargement officielle de séance */}
      <AttendanceSheetModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        data={attendanceData}
      />
    </div>
  );
}
