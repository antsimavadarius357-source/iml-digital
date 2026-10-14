import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  FileText
} from 'lucide-react';

export interface AttendanceSheetData {
  appointmentId: string;
  datetime: string;
  durationMinutes: number;
  beneficiaryName: string;
  beneficiaryType?: string;
  projectName?: string;
  representativeName?: string;
  representativeEmail?: string;
  representativePhone?: string;
  coachName: string;
  location: string;
  summary?: string;
  nextActions?: string;
}

interface AttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AttendanceSheetData | null;
}

export default function AttendanceSheetModal({
  isOpen,
  onClose,
  data
}: AttendanceSheetModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(data.datetime).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = new Date(data.datetime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const hours = Math.floor(data.durationMinutes / 60);
  const minutes = data.durationMinutes % 60;
  const durationText = hours > 0 
    ? `${hours}h${minutes > 0 ? `${String(minutes).padStart(2, '0')}` : '00'}` 
    : `${minutes} minutes`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 print:border-none print:shadow-none print:max-h-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Barre d'action supérieure (masquée à l'impression) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="size-4.5 text-[#23c3b1]" />
            <span className="font-bold text-sm">Feuille d'émargement officielle de séance</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* CONTENU OFFICIEL IMPRIMABLE */}
        <div ref={printRef} className="p-8 sm:p-12 overflow-y-auto print:p-0 space-y-6 text-slate-900 font-sans">
          
          {/* En-tête Institutionnel */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                RÉPUBLIQUE GABONAISE
              </div>
              <div className="text-[10px] font-semibold text-slate-400">
                Union - Travail - Justice
              </div>
              <div className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                IML DIGIT • ESPACE PME
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Pôle d'accompagnement & d'incubation — Quartier B2, Libreville, Gabon
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-800">
                SÉANCE #{data.appointmentId.slice(-6).toUpperCase()}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">
                Fiche justificative d'heures réelles
              </div>
            </div>
          </div>

          {/* Titre du document */}
          <div className="text-center py-2 space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              Attestation & Feuille d'Émargement
            </h1>
            <p className="text-xs text-slate-500">
              Séance d'accompagnement individuel / coaching technique d'entreprise
            </p>
          </div>

          {/* Détails de la séance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
              <span className="font-bold text-slate-900 capitalize">{formattedDate}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Heure de début</span>
              <span className="font-bold text-slate-900">{formattedTime}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Durée pointée</span>
              <span className="font-bold text-[#23c3b1] text-sm">{durationText}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Lieu d'exécution</span>
              <span className="font-bold text-slate-900">{data.location.includes('Visioconférence') ? 'Visioconférence sécurisée' : 'Espace PME, B2 Libreville'}</span>
            </div>
          </div>

          {/* Fiches des parties */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            {/* Bénéficiaire / Entreprise */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Bénéficiaire / Entreprise
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                  {data.beneficiaryType || 'Structure'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900">
                  {data.projectName || data.beneficiaryName}
                </div>
                {data.representativeName && (
                  <div className="text-slate-600">
                    Représentant : <strong>{data.representativeName}</strong>
                  </div>
                )}
                {data.representativeEmail && (
                  <div className="text-slate-500 text-[11px]">{data.representativeEmail}</div>
                )}
                {data.representativePhone && (
                  <div className="text-slate-500 text-[11px]">{data.representativePhone}</div>
                )}
              </div>
            </div>

            {/* Coach / Conseiller référent */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Conseiller référent IML Digit
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                  Accompagnant agréé
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900">
                  {data.coachName || 'Agent IML Digit'}
                </div>
                <div className="text-slate-600">
                  Espace PME • Pôle Accompagnement B2
                </div>
                <div className="text-slate-500 text-[11px]">
                  contact@imldigit.ga
                </div>
              </div>
            </div>
          </div>

          {/* Ordre du jour & Synthèse de la séance */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-100 pb-2">
              Contenu & Travaux réalisés lors de la séance
            </span>
            <div className="space-y-1.5 text-slate-700 leading-relaxed">
              <p>
                <strong>Compte-rendu sommaire :</strong> {data.summary || 'Entretien d’évaluation et diagnostic des besoins prioritaires en accompagnement.'}
              </p>
              {data.nextActions && (
                <p>
                  <strong>Prochaines étapes convenues :</strong> {data.nextActions}
                </p>
              )}
            </div>
          </div>

          {/* Cadre d'émargement et signatures officielles */}
          <div className="pt-4 border-t-2 border-slate-200 space-y-3">
            <div className="text-center text-[10px] text-slate-400 italic">
              « Les parties soussignées certifient sur l'honneur l'exactitude des informations et la réalisation effective du pointage ci-dessus. »
            </div>

            <div className="grid grid-cols-2 gap-8 pt-2">
              {/* Signature Bénéficiaire */}
              <div className="border border-slate-300 rounded-xl p-4 h-32 flex flex-col justify-between text-xs">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Pour le Bénéficiaire / Dirigeant :
                </div>
                <div className="text-[10px] text-slate-400">
                  Date et Signature :
                </div>
              </div>

              {/* Signature Coach */}
              <div className="border border-slate-300 rounded-xl p-4 h-32 flex flex-col justify-between text-xs">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Pour IML Digit (Le Conseiller) :
                </div>
                <div className="text-[10px] text-slate-400">
                  Visa & Cachet Espace PME :
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
