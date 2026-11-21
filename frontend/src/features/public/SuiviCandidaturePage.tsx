import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  ArrowLeft, 
  ArrowRight,
  MapPin, 
  Video, 
  Building2, 
  User, 
  CheckCircle2, 
  Hourglass, 
  FileText, 
  AlertCircle,
  Mail,
  Loader2,
  Eye,
  Printer,
  ExternalLink
} from 'lucide-react';
import { api } from '../../lib/api';

interface TrackedApplication {
  id: string;
  seqNumber: number;
  referenceCode: string;
  status: 'BROUILLON' | 'SOUMISE' | 'EN_COURS_EXAMEN' | 'ENTRETIEN' | 'ACCEPTEE' | 'REFUSEE';
  submittedAt?: string;
  applicantName: string;
  applicantEmail?: string | null;
  structureType: 'PORTEUR_IDEE' | 'STARTUP' | 'PME' | 'ORGANISATION';
  companyName: string;
  rccm?: string;
  nif?: string;
  interviewPreference: 'PRESENTIEL' | 'VIDEO';
  hasVideoEquipment?: boolean;
  needs: string[];
  stage: string;
  documents?: Array<{
    id: string;
    title: string;
    category?: string;
    status?: string;
    createdAt?: string;
  }>;
  appointment?: {
    id: string;
    datetime: string;
    duration: number;
    location: string;
    isVisio: boolean;
    videoUrl?: string | null;
    coachName: string;
    coachEmail?: string | null;
  } | null;
}

const STRUCTURE_LABELS: Record<string, { label: string; style: string }> = {
  PORTEUR_IDEE: { label: "Porteur d'idée / Créateur", style: "bg-blue-50 text-blue-700 border-blue-200" },
  STARTUP: { label: "Startup innovante", style: "bg-purple-50 text-purple-700 border-purple-200" },
  PME: { label: "TPE / PME existante", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ORGANISATION: { label: "Organisation / Coopérative", style: "bg-amber-50 text-amber-700 border-amber-200" },
};

const STATUS_DETAILS: Record<string, { title: string; desc: string; color: string; step: number }> = {
  SOUMISE: {
    title: "Dossier enregistré",
    desc: "Votre candidature est bien reçue par l'incubateur IML Digit. Elle est en cours de traitement pour être attribuée à un agent de l'incubateur.",
    color: "bg-blue-500",
    step: 1
  },
  EN_COURS_EXAMEN: {
    title: "En cours d'instruction",
    desc: "L'agent de l'incubateur IML Digit analyse actuellement la viabilité de votre projet et prépare l'entretien d'évaluation.",
    color: "bg-amber-500",
    step: 2
  },
  ENTRETIEN: {
    title: "Entretien d'évaluation programmé",
    desc: "Un rendez-vous d'échange a été fixé avec l'équipe de l'incubateur IML Digit pour faire le point sur votre projet.",
    color: "bg-teal-600",
    step: 3
  },
  ACCEPTEE: {
    title: "Candidature admise",
    desc: "Félicitations ! Votre structure a été retenue par l'incubateur IML Digit pour intégrer la promotion d'incubation.",
    color: "bg-emerald-600",
    step: 4
  },
  REFUSEE: {
    title: "Non retenu pour cette session",
    desc: "Votre dossier n'a pas été retenu pour cette promotion d'incubation. Vous pouvez demander un retour constructif ou repostuler lors du prochain appel.",
    color: "bg-slate-500",
    step: 2
  }
};

export default function SuiviCandidaturePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('code') || searchParams.get('q') || '';
  const initialView = searchParams.get('vue') === 'detail';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [isDetailView, setIsDetailView] = useState(initialView);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-track-app', activeQuery],
    queryFn: () => api<{ application: TrackedApplication }>(`/applications/public/track?q=${encodeURIComponent(activeQuery)}`),
    enabled: Boolean(activeQuery.trim()),
    retry: 1
  });

  const app = data?.application;

  useEffect(() => {
    if (initialQuery && initialQuery !== activeQuery) {
      setActiveQuery(initialQuery);
      setSearchInput(initialQuery);
    }
  }, [initialQuery]);

  // Si l'URL demande explicitement la vue détaillée et que les données arrivent
  useEffect(() => {
    if (searchParams.get('vue') === 'detail' && app) {
      setIsDetailView(true);
    }
  }, [searchParams, app]);

  // Recherche automatique dès que l'utilisateur saisit un email, téléphone ou code
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setActiveQuery('');
      return;
    }
    const isEmailLike = trimmed.includes('@') && trimmed.includes('.') && trimmed.length >= 6;
    const isCodeLike = /^(IML|CAND)?-?\d{2,4}-?\d+/i.test(trimmed);
    const isPhoneLike = trimmed.replace(/\D/g, '').length >= 8;

    if (isEmailLike || isCodeLike || isPhoneLike) {
      const timer = setTimeout(() => {
        setActiveQuery(trimmed);
        setSearchParams({ code: trimmed }, { replace: true });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchInput]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setActiveQuery(trimmed);
    setSearchParams({ code: trimmed });
  };

  const handleOpenDetail = () => {
    if (!app) return;
    setIsDetailView(true);
    setSearchParams({ code: app.referenceCode, vue: 'detail' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSearch = () => {
    setIsDetailView(false);
    setSearchParams({ code: searchInput, vue: 'recherche' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResendSummaryEmail = async () => {
    if (!app) return;
    setIsSendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await api<{ success: boolean; email: string; message: string }>('/applications/public/resend-summary', {
        method: 'POST',
        body: { q: app.referenceCode, email: app.applicantEmail || undefined },
      });
      if (res.success) {
        setEmailFeedback({
          type: 'success',
          message: res.message || `E-mail complet envoyé avec succès à ${res.email}`,
        });
      } else {
        setEmailFeedback({
          type: 'error',
          message: res.message || "Impossible d'envoyer l'e-mail pour le moment.",
        });
      }
    } catch (err: any) {
      setEmailFeedback({
        type: 'error',
        message: err?.message || "Erreur lors de l'envoi de l'e-mail récapitulatif.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const currentStatusInfo = app ? STATUS_DETAILS[app.status] || STATUS_DETAILS.SOUMISE : null;
  const currentStep = currentStatusInfo?.step || 1;

  // Détection d'une attestation ou certificat délivré pour ce bénéficiaire / projet
  const certificateData = useMemo(() => {
    if (!app) return null;
    try {
      const raw = localStorage.getItem('iml_issued_certificates');
      if (raw) {
        const parsed = JSON.parse(raw);
        const values: any[] = Object.values(parsed);
        const match = values.find(
          v => v.beneficiaryId === app.id || 
               v.projectName?.toLowerCase() === app.companyName?.toLowerCase() ||
               v.recipientName?.toLowerCase() === app.applicantName?.toLowerCase()
        );
        if (match) return match;
      }
    } catch {
      // ignore
    }
    return null;
  }, [app]);

  // =========================================================================
  // 1. VUE DÉTAILLÉE : L'UTILISATEUR "RENTRE" COMPLÈTEMENT DANS LA FICHE
  // =========================================================================
  if (isDetailView && app) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] font-sans selection:bg-[#f06553] selection:text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Navigation supérieure */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={handleBackToSearch}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#f06553] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Retour à la recherche</span>
              </button>
            </div>
          </div>

          {/* FICHE DÉTAILLÉE DU DOSSIER */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md space-y-8">
            
            {/* En-tête du dossier */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white">
                    Réf. {app.referenceCode}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STRUCTURE_LABELS[app.structureType]?.style || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {STRUCTURE_LABELS[app.structureType]?.label || "Structure"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {app.companyName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                  <User className="size-3.5 text-slate-400" />
                  <span>Représentant : <strong>{app.applicantName}</strong></span>
                  {app.submittedAt && (
                    <>
                      <span>•</span>
                      <span>Soumis le {new Date(app.submittedAt).toLocaleDateString('fr-FR')}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Badge Statut Courant */}
              <div className="text-left sm:text-right shrink-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Statut actuel
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-2xs ${currentStatusInfo?.color || 'bg-slate-700'}`}>
                  <span className="size-2 rounded-full bg-white animate-pulse" />
                  {currentStatusInfo?.title || app.status}
                </span>
              </div>
            </div>

            {/* Message d'explication du statut */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-3.5">
              <Hourglass className="size-5 text-[#f06553] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-0.5 text-sm">{currentStatusInfo?.title}</strong>
                {currentStatusInfo?.desc}
              </div>
            </div>

            {/* Stepper de progression institutionnel */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Parcours de sélection & d'intégration
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { stepNum: 1, title: "1. Réception", desc: "Dossier enregistré & vérifié" },
                  { stepNum: 2, title: "2. Instruction", desc: "Examen par l'agent de l'incubateur" },
                  { stepNum: 3, title: "3. Entretien", desc: "Échange avec le coach / visio" },
                  { stepNum: 4, title: "4. Admission", desc: "Comité & Direction de l'incubateur" },
                ].map((s) => {
                  const isDone = currentStep > s.stepNum || (currentStep === 4 && s.stepNum === 4);
                  const isCurrent = currentStep === s.stepNum && currentStep !== 4;
                  return (
                    <div 
                      key={s.stepNum}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDone 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                          : isCurrent 
                            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 text-amber-950' 
                            : 'bg-white border-slate-200/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider">
                          {s.title}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <Hourglass className="size-4 text-amber-600 animate-spin" />
                        ) : (
                          <span className="size-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <p className="text-[11px] leading-snug opacity-90">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ENCADRÉ CENTRAL : ENVOI DIRECT PAR E-MAIL DU DOSSIER COMPLET & LIEN D'ENTRETIEN */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#23c3b1]/20 text-[#23c3b1] uppercase tracking-wider">
                    <Mail className="size-3" />
                    <span>Réception directe par e-mail</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Recevoir la totalité de mon dossier & mon lien d'entretien par e-mail
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    Toutes vos informations (état d'admission, validation de vos documents, convocation avec <strong>lien direct de la vidéo</strong> ou <strong>adresse de l'entretien sur place</strong>) vous sont envoyées directement dans votre boîte e-mail{app.applicantEmail ? ` (${app.applicantEmail})` : ''}.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleResendSummaryEmail}
                  className="px-5 py-3 rounded-2xl bg-[#f06553] hover:bg-[#e05341] text-white text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  <span>{isSendingEmail ? 'Envoi en cours...' : "M'envoyer l'e-mail complet maintenant"}</span>
                </button>
              </div>

              {emailFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  emailFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                }`}>
                  {emailFeedback.type === 'success' ? <CheckCircle2 className="size-4 text-emerald-400 shrink-0" /> : <AlertCircle className="size-4 text-rose-400 shrink-0" />}
                  <span>{emailFeedback.message}</span>
                </div>
              )}
            </div>

            {/* SECTION CONVOCATION ENTRETIEN SI PROGRAMMÉ */}
            {app.appointment && (
              <div className="p-6 rounded-3xl bg-teal-50 border-2 border-teal-300 shadow-sm space-y-4 animate-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                      📅
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-300 uppercase tracking-wider inline-block mb-1">
                        {app.appointment.isVisio ? '🎥 Entretien Vidéo en Ligne Fixé' : '📍 Entretien Sur Place Fixé'}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {new Date(app.appointment.datetime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(app.appointment.datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </h3>
                      <p className="text-xs text-slate-700 mt-0.5">
                        Avec <strong>{app.appointment.coachName}</strong> · Modalité : <strong>{app.appointment.isVisio ? 'Visioconférence en ligne' : 'Sur place (Siège IML Digit - Espace PME, Libreville)'}</strong>
                      </p>
                      {!app.appointment.isVisio && (
                        <p className="text-xs text-teal-900 font-semibold mt-1">
                          📍 Lieu : {app.appointment.location || 'Siège IML Digit - Immeuble Espace PME, Quartier Awendjé, Libreville'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {app.appointment.isVisio && app.appointment.videoUrl && (
                      <a
                        href={app.appointment.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#f06553] hover:bg-[#e04a27] text-white text-xs font-bold shadow-md shadow-[#f06553]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Video className="size-4" />
                        <span>Rejoindre la visio</span>
                        <ExternalLink className="size-3 opacity-80" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION DOCUMENTS & PIÈCES JUSTIFICATIVES DU DOSSIER */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[#23c3b1]" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Documents & Pièces du dossier
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {app.documents?.length || 0} pièce(s)
                </span>
              </div>

              {app.documents && app.documents.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {app.documents.map((doc) => {
                    const isVal = doc.status === 'VALIDE';
                    const isRef = doc.status === 'REFUSE';
                    return (
                      <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{doc.title}</span>
                          {doc.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                              {doc.category}
                            </span>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          isVal
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRef
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isVal ? '✓ Validé' : isRef ? 'À mettre à jour' : '⏳ Reçu / En revue'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Votre fiche projet et votre formulaire administratif sont bien enregistrés dans le système.
                </p>
              )}
            </div>

            {/* SECTION CANDIDATURE ADMISE : PRISE EN CHARGE AVEC LE COACH */}
            {app.status === 'ACCEPTEE' && !certificateData && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 shadow-md space-y-4 animate-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="size-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                      🤝
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-wider inline-block mb-1">
                        Candidature Validée & Retenue
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Votre dossier est officiellement admis au sein de l'incubateur
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Félicitations ! Votre candidature est admise. Toutes vos convocations (avec le lien vidéo ou le lieu sur place) ainsi que les étapes avec votre coach vous sont envoyées directement par e-mail.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={handleResendSummaryEmail}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Mail className="size-4" />
                      <span>Recevoir ma lettre d'admission par e-mail</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION ATTESTATION OFFICIELLE DE FIN (UNIQUEMENT SI FIN DU CIRCUIT & DÉLIVRÉE) */}
            {certificateData && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-amber-400/80 shadow-md space-y-4 animate-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="size-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                      🎓
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 uppercase tracking-wider inline-block mb-1">
                        Attestation Officielle Disponible
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Certificat de Fin de Parcours & Validation IML Digit
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Félicitations ! Votre attestation officielle signée avec décor officiel, médaillon d'or et QR code infalsifiable est disponible.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <Link
                      to={`/certificat/${certificateData.id}?nom=${encodeURIComponent(certificateData.recipientName)}&projet=${encodeURIComponent(certificateData.projectName)}`}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="size-4" />
                      <span>Consulter mon diplôme</span>
                    </Link>

                    <a
                      href={`/certificat/${certificateData.id}?nom=${encodeURIComponent(certificateData.recipientName)}&projet=${encodeURIComponent(certificateData.projectName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Printer className="size-4 text-slate-600" />
                      <span>Imprimer / PDF</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Bloc Modalité d'Entretien Choisie */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {app.interviewPreference === 'VIDEO' ? (
                    <Video className="size-4 text-[#23c3b1]" />
                  ) : (
                    <MapPin className="size-4 text-[#f06553]" />
                  )}
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Modalité d'entretien & Réception des convocations
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {app.interviewPreference === 'VIDEO' ? 'Visioconférence en ligne' : 'Présentiel sur place'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {app.interviewPreference === 'VIDEO' ? (
                  <span>
                    Entretien à distance en ligne : dès que votre créneau est programmé, vous recevez <strong>directement par e-mail sur votre téléphone</strong> le lien cliquable de la salle vidéo sans avoir besoin de mot de passe.
                  </span>
                ) : (
                  <span>
                    Entretien sur place au siège de l'incubateur <strong>IML Digit (Immeuble Espace PME, Quartier Awendjé, Libreville)</strong> : vous recevez directement par e-mail votre convocation complète avec la date, l'horaire, le nom de votre coach et les documents à apporter.
                  </span>
                )}
              </p>
            </div>

            {/* Informations PME complémentaires si renseignées */}
            {(app.rccm || app.nif) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
                {app.rccm && (
                  <div>
                    <span className="text-slate-400 block font-medium">N° RCCM</span>
                    <span className="font-bold text-slate-800">{app.rccm}</span>
                  </div>
                )}
                {app.nif && (
                  <div>
                    <span className="text-slate-400 block font-medium">NIF</span>
                    <span className="font-bold text-slate-800">{app.nif}</span>
                  </div>
                )}
              </div>
            )}

            {/* Besoins déclarés */}
            {app.needs && app.needs.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Axes d'accompagnement sollicités
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {app.needs.map((need, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#f06553] text-xs font-medium border border-orange-100">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assistance & Contact */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5 text-slate-400" />
                  <span>Incubateur IML Digit, Libreville</span>
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-slate-400" />
                  <span>imlGabon2@gmail.com</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <FileText className="size-3.5" />
                <span>Imprimer le reçu de suivi</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. VUE RECHERCHE : FORMULAIRE DE CONSULTATION + PRÉVISUALISATION
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans selection:bg-[#f06553] selection:text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#f06553] transition-colors"
          >
            <ArrowLeft className="size-4" /> Retour à l'accueil
          </Link>
        </div>

        {/* Titre & Barre de recherche (Design institutionnel épuré et chaleureux) */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold tracking-wide">
              <span className="size-2 rounded-full bg-[#f06553]" />
              <span>Portail Public • Incubateur IML Digit</span>
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Suivi en direct de votre candidature
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Vous n'avez pas votre numéro de dossier sous la main ? Retrouvez instantanément l'avancement de votre projet avec votre <strong className="text-slate-800">adresse email</strong> ou votre <strong className="text-slate-800">numéro de téléphone</strong>.
              </p>
            </div>

            <form onSubmit={handleSearch} className="pt-2 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Votre email, votre numéro de téléphone ou code IML-2026-XXXX"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white focus:border-[#f06553] focus:ring-2 focus:ring-[#f06553]/20 transition-all shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white font-bold text-sm transition-all shadow-md shadow-[#f06553]/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  <span>Vérifier mon dossier</span>
                </button>
              </div>

              {/* Feedback immédiat dans la carte */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-700 pt-1 font-semibold">
                  <Loader2 className="size-3.5 animate-spin text-[#f06553]" />
                  <span>Recherche en cours pour « {activeQuery || searchInput} »...</span>
                </div>
              )}
              {isError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  <AlertCircle className="size-4 text-red-500 shrink-0" />
                  <span>Aucun dossier trouvé pour « {activeQuery} ». Vérifiez l'orthographe ou essayez votre numéro de téléphone.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* État de chargement */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Loader2 className="size-8 text-[#23c3b1] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Recherche de votre dossier en cours...</p>
          </div>
        )}

        {/* Erreur / Non trouvé */}
        {isError && (
          <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-center space-y-4">
            <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Dossier introuvable</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Aucun dossier ne correspond à la référence ou l'adresse email renseignée : <strong>« {activeQuery} »</strong>.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Vérifiez l'orthographe de votre email ou le numéro inscrit sur votre confirmation (ex: IML-2026-0001).
            </p>
          </div>
        )}

        {/* RÉSULTAT : CARTE D'APERÇU POUR ENTRER DANS LA PAGE */}
        {app && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-300 shadow-lg shadow-emerald-500/5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 text-white">
                    Réf. {app.referenceCode}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STRUCTURE_LABELS[app.structureType]?.style || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {STRUCTURE_LABELS[app.structureType]?.label || "Structure"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs ${currentStatusInfo?.color || 'bg-slate-700'}`}>
                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                    {currentStatusInfo?.title}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {app.companyName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
                  <User className="size-3.5 text-slate-400" />
                  <span>Porteur de projet : <strong>{app.applicantName}</strong></span>
                  {app.submittedAt && (
                    <>
                      <span>•</span>
                      <span>Soumis le {new Date(app.submittedAt).toLocaleDateString('fr-FR')}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleResendSummaryEmail}
                  className="px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4 text-[#23c3b1]" />}
                  <span>Recevoir tout par e-mail</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenDetail}
                  className="px-6 py-3.5 rounded-2xl bg-[#f06553] hover:bg-[#e05341] text-white font-extrabold text-sm transition-all shadow-md shadow-[#f06553]/25 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105 shrink-0"
                >
                  <span>Voir le détail du dossier</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>

            {emailFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                emailFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {emailFeedback.type === 'success' ? <CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> : <AlertCircle className="size-4 text-rose-600 shrink-0" />}
                <span>{emailFeedback.message}</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
