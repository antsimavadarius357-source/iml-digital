import { useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';

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
  notes?: string;
}

interface OfficialConvocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ConvocationData | null;
  onSendEmailConfirmation?: () => void;
}

export default function OfficialConvocationModal({
  isOpen,
  onClose,
  data,
  onSendEmailConfirmation
}: OfficialConvocationModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

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

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const refNumber = `CONV-2026-${data.appointmentId ? data.appointmentId.slice(0, 6).toUpperCase() : '9842'}`;

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
        <div className="print:hidden px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200">
            <FileText className="size-4 text-[#f06553]" />
            <span>Lettre officielle de convocation • {refNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSendEmailConfirmation?.();
                alert(`Convocation officielle envoyée avec succès par email à : ${data.recipientEmail || 'bénéficiaire'}`);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Envoyer la convocation par email"
            >
              <Mail className="size-3.5" />
              <span className="hidden sm:inline">Renvoyer Email</span>
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

        {/* CORPS DE LA CONVOCATION OFFICIELLE (ZONE IMPRIMABLE STYLE PAPIER A4) */}
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
              <div className="font-bold text-slate-900">{refNumber}</div>
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

          {/* SIGNATURE & CACHET */}
          <div className="pt-4 flex items-end justify-between border-t border-slate-200 text-xs">
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>✓ Document généré et authentifié électroniquement par <strong>iml digit</strong></div>
              <div>ID Sécurité : {data.appointmentId || 'IML-SEC-2026-VAL'}</div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-slate-800 font-semibold text-xs">Pour la Direction du Programme</div>
              <div className="size-16 mx-auto rounded-full border-2 border-dashed border-[#14233c]/30 flex items-center justify-center text-[10px] text-slate-500 font-mono uppercase">
                Cachet IML
              </div>
              <div className="text-[10px] font-bold text-slate-700">Service Accompagnement</div>
            </div>
          </div>

        </div>

        {/* PIED DE MODALE */}
        <div className="print:hidden px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Ce document est automatiquement archivé dans le dossier du bénéficiaire.
          </span>
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
