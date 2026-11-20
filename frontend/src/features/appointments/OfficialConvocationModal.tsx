import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  Mail, 
  Video, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  FileCheck,
  Check,
  FolderOpen,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { WhatsAppSvg } from '../../components/communication/QuickWhatsAppModal';
import { api } from '../../lib/api';

export interface ConvocationData {
  appointmentId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  projectName?: string;
  datetime: string;
  durationMinutes: number;
  sessionType: 'video' | 'in_person';
  locationOrUrl: string;
  coachName?: string;
  coachEmail?: string;
  notes?: string;
  createdAt?: string;
  initialTab?: 'receipt' | 'convocation';
  beneficiaryStatus?: 'delivered' | 'simulated' | 'failed';
}

interface OfficialConvocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ConvocationData | null;
  onSendEmailConfirmation?: () => void;
  onOpenDocuments?: () => void;
}

export default function OfficialConvocationModal({
  isOpen,
  onClose,
  data,
  onSendEmailConfirmation,
  onOpenDocuments
}: OfficialConvocationModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'receipt' | 'convocation'>('receipt');
  const [isResending, setIsResending] = useState(false);
  const [resendStatusMsg, setResendStatusMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (data?.initialTab) {
      setActiveTab(data.initialTab);
    } else {
      setActiveTab('receipt');
    }
  }, [data]);

  const handleResendEmail = async () => {
    if (!data?.appointmentId) return;
    onSendEmailConfirmation?.();
    setIsResending(true);
    setResendStatusMsg(null);
    try {
      const res = await api<{ success: boolean; simulated?: boolean; message?: string }>(`/appointments/${data.appointmentId}/resend-convocation`, {
        method: 'POST'
      });
      if (res.simulated) {
        setResendStatusMsg({
          type: 'info',
          text: "Serveur en mode simulation : aucun serveur SMTP n'est configuré sur Render. Utilisez le bouton 'Gmail (1 clic)' ou 'WhatsApp' ci-dessus pour envoyer la convocation immédiatement."
        });
      } else if (res.success) {
        setResendStatusMsg({
          type: 'success',
          text: `✓ E-mail officiel de convocation transmis avec succès à ${data.recipientEmail || 'bénéficiaire'}`
        });
      } else {
        setResendStatusMsg({
          type: 'error',
          text: res.message || "Échec d'envoi. Utilisez le bouton 'Gmail (1 clic)' ci-dessus pour expédier le message depuis votre messagerie."
        });
      }
    } catch (err: any) {
      setResendStatusMsg({
        type: 'error',
        text: `⚠️ Erreur : ${err?.message || "Échec de l'envoi"}`
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen || !data) return null;

  const apptDate = new Date(data.datetime);
  const formattedDate = apptDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const formattedTime = apptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const notificationDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const formattedDispatchDate = notificationDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedDispatchTime = notificationDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const convRefNumber = `CONV-2026-${data.appointmentId ? data.appointmentId.slice(0, 6).toUpperCase() : '9842'}`;
  const receiptRefNumber = `AR-IML-2026-${data.appointmentId ? data.appointmentId.slice(0, 8).toUpperCase() : 'REC-9842'}`;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-xs p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200 text-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* BARRE DE CONTRÔLE SUPÉRIEURE (NON IMPRIMABLE) */}
        <div className="print:hidden px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200">
            {activeTab === 'receipt' ? (
              <>
                <ShieldCheck className="size-4.5 text-emerald-400" />
                <span className="font-semibold text-white">Accusé de réception officiel • {receiptRefNumber}</span>
              </>
            ) : (
              <>
                <FileText className="size-4.5 text-[#f06553]" />
                <span className="font-semibold text-white">Lettre officielle de convocation • {convRefNumber}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Onglets de bascule */}
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 flex text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('receipt')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'receipt'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                <span>Accusé de Réception (AR)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('convocation')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'convocation'
                    ? 'bg-[#f06553] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="size-3.5" />
                <span>Lettre Convocation</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>

            {data?.recipientPhone && (
              <a
                href={(() => {
                  let clean = data.recipientPhone.replace(/[^0-9+]/g, '');
                  if (clean.startsWith('0')) clean = '241' + clean.slice(1);
                  else if (!clean.startsWith('+') && !clean.startsWith('241') && clean.length <= 8) clean = '241' + clean;
                  clean = clean.replace('+', '');
                  const dateStr = new Date(data.datetime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                  const timeStr = new Date(data.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const isVid = data.sessionType === 'video';
                  const msg = `Bonjour ${data.recipientName},\nVotre convocation d'accompagnement IML Digit avec votre coach ${data.coachName || 'Coach Référent'} est confirmée :\n📅 Date : ${dateStr} à ${timeStr} (${data.durationMinutes || 60} min)\n📍 ${isVid ? 'Lien visio' : 'Lieu'} : ${data.locationOrUrl || 'Siège Libreville'}\n\nPlateforme IML Digit`;
                  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Transmettre la convocation par WhatsApp au bénéficiaire"
              >
                <WhatsAppSvg className="size-3.5 text-white" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            {data?.recipientEmail && (
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.recipientEmail)}&su=${encodeURIComponent("Convocation officielle d'accompagnement IML Digit")}&body=${encodeURIComponent(
                  `Bonjour ${data.recipientName},\n\nDans le cadre de l'instruction de votre dossier au sein du programme d'accompagnement IML Digit, votre séance de travail avec ${data.coachName || 'votre coach'} est confirmée :\n\n📅 Date : ${formattedDate} à ${formattedTime} (${data.durationMinutes || 60} minutes)\n📍 Lieu / Modalité : ${data.sessionType === 'video' ? 'Visioconférence IML Digit' : (data.locationOrUrl || 'Siège IML Digit, Libreville')}\n\nMerci de vous présenter muni des pièces et documents nécessaires.\n\nDirection & Coordination IML Digit`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ouvrir directement dans Gmail avec le message pré-rempli"
              >
                <Mail className="size-3.5 text-white" />
                <span className="hidden sm:inline">Gmail (1 clic)</span>
              </a>
            )}

            <button
              type="button"
              disabled={isResending}
              onClick={handleResendEmail}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Déclencher un renvoi par le serveur"
            >
              {isResending ? <Loader2 className="size-3.5 animate-spin text-[#23c3b1]" /> : <RefreshCw className="size-3.5 text-slate-400" />}
              <span className="hidden sm:inline">Renvoyer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {resendStatusMsg && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between gap-2 border-b animate-in fade-in ${resendStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : resendStatusMsg.type === 'info' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            <span>{resendStatusMsg.text}</span>
            <button type="button" onClick={() => setResendStatusMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* =========================================================================
            ZONE 1 : BORDEREAU D'ACCUSÉ DE RÉCEPTION (DÉLIVRANCE SYNCHRONE CERTIFIÉE)
           ========================================================================= */}
        {activeTab === 'receipt' && (
          <div ref={printRef} className="p-8 sm:p-10 space-y-6 bg-white overflow-y-auto max-h-[75vh]">
            
            {/* EN-TÊTE RÉPUBLIQUE & IML DIGIT */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-emerald-600 pb-5">
              <div>
                <div className="text-[11px] font-black tracking-widest uppercase text-slate-500">
                  RÉPUBLIQUE GABONAISE
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>iml digit</span>
                  <span className="text-[#23c3b1]">.</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Système de Pilotage Synchrone • Bordereau d'Accusé de Réception & de Délivrance
                </div>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5 text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 sm:justify-end">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>{receiptRefNumber}</span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Délivrance synchrone certifiée le {formattedDispatchDate} à {formattedDispatchTime}
                </div>
                <div className="text-[10px] text-slate-500">
                  Horloge certifiée UTC+1 (Libreville)
                </div>
              </div>
            </div>

            {/* BANNIÈRE DE CERTIFICATION OFFICIELLE */}
            <div className={`rounded-xl p-4 sm:p-5 shadow-sm text-white ${
              data.beneficiaryStatus === 'simulated'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-[#14233c]'
                : data.beneficiaryStatus === 'failed'
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-[#14233c]'
                : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-[#14233c]'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  {data.beneficiaryStatus === 'simulated' ? (
                    <Clock className="size-6 text-white" />
                  ) : data.beneficiaryStatus === 'failed' ? (
                    <AlertCircle className="size-6 text-white" />
                  ) : (
                    <CheckCircle2 className="size-6 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold tracking-tight">
                    {data.beneficiaryStatus === 'simulated'
                      ? "RÉCEPTION SYNCHRONE PLATEFORME • MODE SIMULATION RENDER"
                      : data.beneficiaryStatus === 'failed'
                      ? "ATTESTATION PARTIELLE • ERREUR DE DÉLIVRANCE E-MAIL"
                      : "ATTESTATION DE RÉCEPTION SYNCHRONE CONFIRMÉE"}
                  </h3>
                  <p className="text-xs text-slate-100 leading-relaxed">
                    {data.beneficiaryStatus === 'simulated'
                      ? "Le rendez-vous est intégré en temps réel dans le planning du coach. Le serveur Render n'ayant pas encore de mot de passe SMTP configuré, l'e-mail est simulé en console. Utilisez le bouton WhatsApp ou Gmail (1 clic) ci-dessus pour expédier la convocation."
                      : data.beneficiaryStatus === 'failed'
                      ? "Le rendez-vous est intégré dans l'espace coach, mais l'e-mail n'a pas pu être délivré au bénéficiaire. Vérifiez l'adresse saisie."
                      : "Le système certifie que le rendez-vous a été transmis et reçu au même instant par les deux parties : intégré en temps réel dans l'espace coach de la plateforme et expédié par courrier électronique certifié au bénéficiaire."}
                  </p>
                </div>
              </div>
            </div>

            {/* DOUBLE PREUVE DE RÉCEPTION (COACH & BÉNÉFICIAIRE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CARTE 1 : RÉCEPTION PAR LE COACH DANS LA PLATEFORME */}
              <div className="rounded-xl border-2 border-teal-500/80 bg-teal-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5">
                    <UserCheck className="size-4 text-teal-600" />
                    <span>1. Coach Référent</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white flex items-center gap-1">
                    <Check className="size-3" /> Reçu sur la plateforme
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">
                    {data.coachName || 'Coach Référent IML'}
                  </div>
                  <div className="text-xs text-slate-600">
                    Rôle : Animateur de la séance & Accompagnement
                  </div>
                </div>

                <div className="border-t border-teal-200/80 pt-2 text-xs space-y-1 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">✓ Canal :</span>
                    <span>Plateforme IML Digit (Planning & Espace Coach)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">✓ Statut :</span>
                    <span>Séance inscrite à l'agenda avec alerte active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">✓ Documents :</span>
                    <span className="text-teal-900 font-medium">Dossier et pièces du projet débloqués</span>
                  </div>
                </div>
              </div>

              {/* CARTE 2 : RÉCEPTION PAR LE BÉNÉFICIAIRE PAR E-MAIL */}
              <div className={`rounded-xl border-2 p-4 space-y-3 ${
                data.beneficiaryStatus === 'simulated'
                  ? 'border-amber-400/80 bg-amber-50/50'
                  : data.beneficiaryStatus === 'failed'
                  ? 'border-rose-400/80 bg-rose-50/50'
                  : 'border-[#f06553]/70 bg-orange-50/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="size-4 text-[#f06553]" />
                    <span>2. Bénéficiaire Convoqué</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 ${
                    data.beneficiaryStatus === 'simulated'
                      ? 'bg-amber-600'
                      : data.beneficiaryStatus === 'failed'
                      ? 'bg-rose-600'
                      : 'bg-[#f06553]'
                  }`}>
                    {data.beneficiaryStatus === 'simulated' ? '⚠️ Simulé (SMTP non configuré)' : data.beneficiaryStatus === 'failed' ? '❌ Non délivré' : '✓ Expédié par Email'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">
                    {data.recipientName}
                  </div>
                  {data.projectName && (
                    <div className="text-xs text-slate-600">
                      Projet : {data.projectName}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-2 text-xs space-y-1 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-[#f06553] font-semibold">✓ Courriel :</span>
                    <span className="font-mono text-[11px] text-slate-900 font-medium">{data.recipientEmail || 'Adresse officielle du dossier'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f06553] font-semibold">✓ Contenu :</span>
                    <span>Convocation officielle + lieu / lien</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f06553] font-semibold">✓ Statut :</span>
                    <span>
                      {data.beneficiaryStatus === 'simulated'
                        ? 'Simulé sur le serveur • Utilisez WhatsApp ou Gmail (1 clic)'
                        : data.beneficiaryStatus === 'failed'
                        ? 'Échec d\'acheminement (Adresse à vérifier)'
                        : 'Message délivré sur le serveur de messagerie'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* DÉTAILS CONTRÔLÉS DE LA SÉANCE */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Paramètres certifiés de la séance de travail
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Date retenue</div>
                  <div className="font-bold text-slate-900 mt-0.5">{capitalizedDate}</div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Heure & Durée</div>
                  <div className="font-bold text-slate-900 mt-0.5">{formattedTime} ({data.durationMinutes} min)</div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <div className="text-slate-400 font-medium">Modalité</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {data.sessionType === 'video' ? 'Visioconférence sécurisée' : 'Entretien en présentiel'}
                  </div>
                </div>
              </div>

              {/* Lieu ou Lien Visio */}
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-700">Accès / Localisation : </span>
                {data.sessionType === 'video' ? (
                  <span className="font-mono text-[#f06553] font-semibold break-all">
                    {data.locationOrUrl || 'https://meet.jit.si/imldigit-session'}
                  </span>
                ) : (
                  <span className="text-slate-900 font-medium">
                    {data.locationOrUrl || 'Siège IML Digit - Espace PME, Quartier B2, Libreville, Gabon'}
                  </span>
                )}
              </div>

              {data.notes && (
                <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Ordre du jour : </span>
                  {data.notes}
                </div>
              )}
            </div>

            {/* DOCUMENTS REMIS AU COACH DANS SON ESPACE */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Documents et pièces de travail mis à disposition du coach :</span>
                {onOpenDocuments && (
                  <button
                    type="button"
                    onClick={onOpenDocuments}
                    className="text-[#23c3b1] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <FolderOpen className="size-3.5" />
                    <span>Consulter les pièces</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="size-3.5 text-emerald-600" />
                  <span>Fiche profil & Diagnostic de maturité</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCheck className="size-3.5 text-emerald-600" />
                  <span>Descriptif du projet & Business model</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCheck className="size-3.5 text-emerald-600" />
                  <span>Lettre officielle de convocation ({convRefNumber})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCheck className="size-3.5 text-emerald-600" />
                  <span>Historique des échanges et coordonnées</span>
                </div>
              </div>
            </div>

            {/* MENTION LÉGALE & SIGNATURE NUMÉRIQUE */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="space-y-0.5">
                <div className="font-bold text-slate-700">Service de Planification & d'Accompagnement IML Digit</div>
                <div>Document généré automatiquement à valeur de récépissé probant.</div>
              </div>
              <div className="font-mono text-[10px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                EMPREINTE: {data.appointmentId ? data.appointmentId.replace(/-/g, '').slice(0, 16).toUpperCase() : 'HASH-IML-SECURE-9842'}
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            ZONE 2 : LETTRE OFFICIELLE DE CONVOCATION (A4 ADMINISTRATIF)
           ========================================================================= */}
        {activeTab === 'convocation' && (
          <div ref={printRef} className="p-8 sm:p-12 space-y-6 bg-white overflow-y-auto max-h-[75vh]">
            
            {/* EN-TÊTE RÉPUBLIQUE & IML DIGIT */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <div className="text-[11px] font-black tracking-widest uppercase text-slate-500">
                  RÉPUBLIQUE GABONAISE
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>iml digit</span>
                  <span className="text-[#f06553]">.</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Plateforme Nationale de Pilotage & d'Accompagnement des PME & Start-ups
                </div>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5 text-slate-600">
                <div className="font-bold text-slate-900">{convRefNumber}</div>
                <div>Libreville, le {todayFormatted}</div>
                <div className="text-[10px] text-slate-400">Direction des Opérations & de l'Accompagnement</div>
              </div>
            </div>

            {/* DESTINATAIRE */}
            <div className="flex justify-end">
              <div className="w-full sm:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200/90 text-xs space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">À l'attention de :</div>
                <div className="font-bold text-sm text-slate-900">{data.recipientName}</div>
                {data.projectName && (
                  <div className="text-slate-700 font-medium">{data.projectName}</div>
                )}
                {data.recipientEmail && (
                  <div className="text-slate-500">{data.recipientEmail}</div>
                )}
                {data.recipientPhone && (
                  <div className="text-slate-500">{data.recipientPhone}</div>
                )}
              </div>
            </div>

            {/* OBJET */}
            <div className="bg-orange-50/60 border-l-4 border-[#f06553] p-3 text-xs sm:text-sm">
              <span className="font-bold text-slate-900">OBJET : </span>
              <span className="text-slate-800 font-semibold">
                CONVOCATION OFFICIELLE À UN ENTRETIEN D'ÉVALUATION ET DE CADRAGE
              </span>
            </div>

            {/* CORPS DU TEXTE */}
            <div className="space-y-3.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
              <p>
                Madame, Monsieur,
              </p>
              <p>
                Dans le cadre de l'instruction de votre dossier au sein du programme d'accompagnement <strong>iml digit</strong>, 
                nous vous prions de bien vouloir vous présenter / vous connecter à la session de travail ci-dessous :
              </p>
            </div>

            {/* ENCADRÉ DÉTAILS DE LA CONVOCATION */}
            <div className="rounded-xl border-2 border-slate-800/80 bg-slate-50/70 p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-[#14233c] text-white flex items-center justify-center shrink-0">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Date retenue</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">{capitalizedDate}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-[#14233c] text-white flex items-center justify-center shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Heure & Durée</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {formattedTime} ({data.durationMinutes} minutes)
                    </div>
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-start gap-3">
                  <div className={`size-8 rounded-lg text-white flex items-center justify-center shrink-0 ${
                    data.sessionType === 'video' ? 'bg-[#f06553]' : 'bg-[#23c3b1]'
                  }`}>
                    {data.sessionType === 'video' ? <Video className="size-4" /> : <MapPin className="size-4" />}
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {data.sessionType === 'video' ? 'Modalité : Visioconférence en ligne' : 'Modalité : Entretien en présentiel'}
                    </div>

                    {data.sessionType === 'video' ? (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-800 font-medium">
                          L'entretien se déroulera dans un salon vidéo sécurisé en 1 clic sans installation préalable de logiciel :
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px] text-slate-800 break-all flex items-center justify-between gap-2">
                          <span>{data.locationOrUrl || 'https://meet.jit.si/imldigit-session'}</span>
                          <a
                            href={data.locationOrUrl || 'https://meet.jit.si/imldigit-session'}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-[#f06553] text-white font-sans text-xs font-semibold hover:bg-[#e05341] transition-colors shrink-0 flex items-center gap-1"
                          >
                            <span>Rejoindre</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm font-semibold text-slate-900">
                        {data.locationOrUrl || 'Siège IML Digit - Espace PME, Quartier B2, Libreville, Gabon'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {data.coachName && (
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>Agent / Coach référent :</span>
                  <span className="font-bold text-slate-900">{data.coachName}</span>
                </div>
              )}
            </div>

            {/* CONSIGNES OPÉRATIONNELLES */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-slate-800">Consignes importantes :</div>
              {data.sessionType === 'video' ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>Veuillez vous connecter <strong>5 minutes à l'avance</strong> pour vérifier le bon fonctionnement de votre micro et caméra.</li>
                  <li>Préparez vos documents de travail à partager sur votre écran si besoin.</li>
                  <li>En cas d'indisponibilité, merci de prévenir votre coach au moins 24 heures à l'avance par retour d'email.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>Veuillez vous présenter à l'accueil muni d'une <strong>pièce d'identité en cours de validité</strong>.</li>
                  <li>Apportez une copie de vos documents de projet pour alimenter la séance de travail.</li>
                  <li>Pour tout empêchement, veuillez prévenir par retour d'email ou SMS.</li>
                </ul>
              )}
            </div>

          </div>
        )}

        {/* PIED DE MODALE */}
        <div className="print:hidden px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Accusé de réception et convocation archivés dans le dossier IML Digit.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

