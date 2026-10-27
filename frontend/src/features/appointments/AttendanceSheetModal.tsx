import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  FileText,
  CheckCircle2,
  Building,
  UserCheck
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

  const apptDate = new Date(data.datetime);
  const formattedDate = apptDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const formattedStartTime = apptDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const endDate = new Date(apptDate.getTime() + (data.durationMinutes || 60) * 60000);
  const formattedEndTime = endDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const hours = Math.floor((data.durationMinutes || 60) / 60);
  const minutes = (data.durationMinutes || 60) % 60;
  const durationText = hours > 0 
    ? `${hours}h${minutes > 0 ? `${String(minutes).padStart(2, '0')}` : '00'}` 
    : `${minutes} min`;

  const sheetRef = `EMARG-2026-${data.appointmentId ? data.appointmentId.slice(-6).toUpperCase() : '847291'}`;

  const isVisio = (data.location || '').toLowerCase().includes('visio') || 
                  (data.location || '').toLowerCase().includes('http') ||
                  (data.location || '').toLowerCase().includes('meet');

  return createPortal(
    <div 
      className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs p-2 sm:p-6 flex items-center justify-center animate-in fade-in duration-150 print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:static"
      onClick={onClose}
    >
      {/* Styles d'impression dédiés A4 et page unique sans coupure */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Masquer tout ce qui est en dehors de la feuille d'émargement */
          .print-hidden-zone {
            display: none !important;
          }
          .attendance-print-container {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Conteneur principal façon feuille papier A4 défilable */}
      <div 
        className="attendance-print-container relative w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col text-slate-800 overflow-hidden print:max-h-none print:overflow-visible print:w-full print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* BARRE D'ACTION SUPÉRIEURE FIXE (NON IMPRIMABLE) */}
        <div className="print-hidden-zone px-6 py-3.5 bg-[#101f2e] text-white flex items-center justify-between shrink-0 shadow-sm z-10 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-tight">
                Feuille d'émargement officielle de séance
              </div>
              <div className="text-[10px] text-slate-400">
                Format standard A4 • Réf. {sheetRef}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              title="Lancer l'impression ou exporter en PDF"
            >
              <Printer className="size-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            FEUILLE OFFICIELLE (ZONE IMPRIMABLE PROPRE, ÉPURÉE ET PARFAITEMENT DÉFILABLE)
           ========================================================================= */}
        <div 
          ref={printRef} 
          className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-slate-800 font-sans print:overflow-visible print:p-0 print:space-y-5"
        >
          
          {/* 1. EN-TÊTE ÉPURÉ & PROFESSIONNEL */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">IML DIGIT</span>
                <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-[#178578] font-bold text-[10px] tracking-wide uppercase">
                  Accompagnement d'entreprises
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600">
                Pôle d'Incubation & d'Accompagnement Opérationnel
              </p>
              <p className="text-[11px] text-slate-500">
                Espace PME • Libreville, Gabon • contact@imldigit.ga
              </p>
            </div>

            <div className="text-right space-y-1 shrink-0">
              <div className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 font-mono text-[11px] font-bold text-slate-900">
                {sheetRef}
              </div>
              <div className="text-[10px] text-slate-500">
                Émise le {new Date().toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="size-3 text-emerald-600" />
                <span>Séance Certifiée</span>
              </div>
            </div>
          </div>

          {/* 2. TITRE PRINCIPAL */}
          <div className="text-center py-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
              Feuille d'Émargement Officielle de Séance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Justificatif de réalisation de coaching et de pointage d'heures d'accompagnement
            </p>
          </div>

          {/* 3. CADRE RÉCAPITULATIF DE LA SÉANCE */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>1. Modalités & Horaires d'Exécution</span>
              <span className="text-[10px] font-semibold text-slate-600">Durée : {durationText}</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-0 text-xs">
              <div className="p-3">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Date</span>
                <span className="font-bold text-slate-900 capitalize">{capitalizedDate}</span>
              </div>
              <div className="p-3">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Plage horaire</span>
                <span className="font-bold text-slate-900">{formattedStartTime} — {formattedEndTime}</span>
              </div>
              <div className="p-3">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Durée validée</span>
                <span className="font-bold text-[#178578]">{durationText}</span>
              </div>
              <div className="p-3">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">Lieu / Modalité</span>
                <span className="font-bold text-slate-900 truncate block">
                  {isVisio ? 'Visioconférence sécurisée' : (data.location || 'Espace PME, Libreville')}
                </span>
              </div>
            </div>
          </div>

          {/* 4. LES PARTIES PRENANTES (Tableau épuré à 2 colonnes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Volet Bénéficiaire */}
            <div className="border border-slate-300 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="size-3.5 text-slate-500" />
                  Bénéficiaire Accompagné
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {data.beneficiaryType || 'Porteur de projet'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900">
                  {data.projectName || data.beneficiaryName}
                </div>
                {data.representativeName && (
                  <div className="text-slate-700">
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

            {/* Volet Conseiller / Expert */}
            <div className="border border-slate-300 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-teal-600" />
                  Conseiller Référent / Expert
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Accompagnant certifié
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900">
                  {data.coachName || 'Agent Référent IML Digit'}
                </div>
                <div className="text-slate-700">
                  Pôle Conseil Stratégique & Développement PME
                </div>
                <div className="text-slate-500 text-[11px]">
                  Espace PME • IML Digit
                </div>
              </div>
            </div>

          </div>

          {/* 5. TRAVAUX ET OBJECTIFS RÉALISÉS */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              2. Ordre du Jour & Synthèse de la Séance
            </div>
            <div className="p-3.5 space-y-2 text-slate-700 leading-relaxed">
              <div>
                <span className="font-bold text-slate-900">Objet de la séance & Travaux réalisés :</span>
                <p className="mt-0.5 text-slate-700">
                  {data.summary || "Entretien de cadrage stratégique, suivi d'avancement des objectifs d'entreprise, analyse opérationnelle et validation des livrables de parcours."}
                </p>
              </div>

              {data.nextActions && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Prochaines actions convenues :</span>
                  <p className="mt-0.5 text-slate-700">{data.nextActions}</p>
                </div>
              )}
            </div>
          </div>

          {/* 6. CADRE D'ÉMARGEMENT & SIGNATURES OFFICIELLES */}
          <div className="space-y-2 pt-1">
            <div className="text-center text-[10px] text-slate-500 italic">
              « Les parties soussignées attestent sur l'honneur l'exactitude des informations et la réalisation effective du temps de séance ci-dessus mentionné. »
            </div>

            <div className="grid grid-cols-2 gap-6 pt-1">
              
              {/* Signature Bénéficiaire */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 h-28 flex flex-col justify-between text-xs bg-slate-50/50 print:bg-white">
                <div>
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Pour le Bénéficiaire :
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Mention manuscrite « Lu et approuvé »
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-1 flex justify-between">
                  <span>Date : ____ / ____ / 2026</span>
                  <span>Signature :</span>
                </div>
              </div>

              {/* Signature Coach / Visa */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 h-28 flex flex-col justify-between text-xs bg-slate-50/50 print:bg-white">
                <div>
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Pour IML Digit (Le Conseiller Référent) :
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Visa & Signature de validation
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-1 flex justify-between">
                  <span>Date : ____ / ____ / 2026</span>
                  <span>Signature & Cachet :</span>
                </div>
              </div>

            </div>
          </div>

          {/* 7. BAS DE PAGE OFFICIEL */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
            <div>
              IML DIGIT — Plateforme Intelligente de Gestion et de Suivi de l'Accompagnement Entreprises & Start-ups.
            </div>
            <div>
              Document officiel à valeur de justification d'heures réelles d'incubation. Page 1 / 1
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}
