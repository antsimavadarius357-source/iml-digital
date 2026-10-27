import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Award, 
  Printer, 
  CheckCircle2, 
  ArrowLeft, 
  Share2, 
  ShieldCheck
} from 'lucide-react';
import DigitalCertificateView from '../certificates/DigitalCertificateView';

export default function PublicCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryName = searchParams.get('nom') || searchParams.get('name') || '';
  const queryProject = searchParams.get('projet') || searchParams.get('project') || '';

  // Recherche dans les certificats enregistrés localement
  const savedCertificate = useMemo(() => {
    try {
      const raw = localStorage.getItem('iml_issued_certificates');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (id && parsed[id]) return parsed[id];
        // Chercher par id ou par nom
        const values: any[] = Object.values(parsed);
        if (id) {
          const matchId = values.find(v => v.id === id || v.beneficiaryId === id);
          if (matchId) return matchId;
        }
        if (queryName) {
          const matchName = values.find(v => v.recipientName?.toLowerCase().includes(queryName.toLowerCase()));
          if (matchName) return matchName;
        }
        if (values.length > 0) return values[values.length - 1];
      }
    } catch {
      // ignore
    }
    return null;
  }, [id, queryName]);

  const recipientName = savedCertificate?.recipientName || queryName || "Marc Roul";
  const projectName = savedCertificate?.projectName || queryProject || "Boutique Restauration & Services";
  const structureType = savedCertificate?.structureType || "Porteur d'Idée / PME";
  const templateType = savedCertificate?.templateType || "incubation";
  const themeColor = savedCertificate?.themeColor || "gold_emerald";
  const certNumber = savedCertificate?.id || id || `CERT-IML-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Attestation Officielle IML Digit - ${recipientName}`,
        text: `Consultez l'attestation officielle de fin de parcours délivrée à ${recipientName} par l'Incubateur IML Digit Gabon.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans selection:bg-[#23c3b1] selection:text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Barre d'action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <Link
            to="/suivi-candidature"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#23c3b1] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Portail de suivi</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="size-3.5 text-slate-500" />
              <span>{copied ? 'Lien copié !' : 'Partager'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Imprimer / PDF</span>
            </button>
          </div>
        </div>

        {/* Bannière de certification officielle et d'authenticité */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900">
                  Document Officiel d'Incubation IML Digit
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  Authenticité Vérifiée
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Certificat délivré et enregistré avec succès dans le registre officiel de l'incubateur.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 text-xs text-slate-500 font-mono">
            <span className="block text-[10px] text-slate-400 uppercase font-sans">Identifiant unique</span>
            <strong className="text-slate-800">{certNumber}</strong>
          </div>
        </div>

        {/* Diplôme Haute Résolution */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-200/90 overflow-x-auto">
          <DigitalCertificateView
            recipientName={recipientName}
            projectName={projectName}
            structureType={structureType}
            templateType={templateType}
            themeColor={themeColor}
            coachName="Darius Coach IML"
            directorName="Directeur Général IML"
            certificateNumber={certNumber}
          />
        </div>

        {/* Notice d'accompagnement pour le bénéficiaire */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300/60 flex items-start gap-3.5 text-xs text-amber-950 leading-relaxed">
          <Award className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-amber-900">
              Conseils d'utilisation de votre attestation
            </strong>
            <p>
              Ce certificat numérique officiel peut être présenté à vos partenaires financiers, investisseurs, banques et institutions publiques partenaires de l'Incubateur IML Digit. Le QR code apposé permet à tout tiers de vérifier en direct la validité de votre parcours.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
