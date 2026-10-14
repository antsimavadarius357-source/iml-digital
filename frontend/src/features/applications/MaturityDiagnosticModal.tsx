import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Target, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  Briefcase,
  Save
} from 'lucide-react';

interface MaturityDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  structureName: string;
  structureType?: string;
  onSaveDiagnostic: (summaryText: string, score: number) => void;
}

interface Pillar {
  id: string;
  name: string;
  shortName: string;
  desc: string;
  icon: any;
  value: number;
}

export default function MaturityDiagnosticModal({
  isOpen,
  onClose,
  candidateName,
  structureName,
  structureType,
  onSaveDiagnostic
}: MaturityDiagnosticModalProps) {
  const [pillars, setPillars] = useState<Pillar[]>([
    {
      id: 'governance',
      name: 'Gouvernance & Compétences du Dirigeant',
      shortName: 'Équipe / Dirigeant',
      desc: 'Expérience sectorielle, complémentarité de l’équipe, disponibilité et clarté de la vision.',
      icon: Briefcase,
      value: 3
    },
    {
      id: 'market',
      name: 'Marché & Traction Commerciale',
      shortName: 'Marché & Ventes',
      desc: 'Identification des clients cibles, validation du besoin, premiers devis/ventes, concurrence.',
      icon: TrendingUp,
      value: 3
    },
    {
      id: 'product',
      name: 'Produit / Service & Faisabilité',
      shortName: 'Produit / Service',
      desc: 'Qualité de l’offre, capacité de production, conformité technique et chaîne logistique.',
      icon: Layers,
      value: 3
    },
    {
      id: 'finance',
      name: 'Modèle Économique & Finances',
      shortName: 'Finances & Rentabilité',
      desc: 'Marges unitaires, suivi de la trésorerie, compte bancaire d’entreprise, visibilité du BFR.',
      icon: Coins,
      value: 2
    },
    {
      id: 'legal',
      name: 'Juridique, Fiscal & Conformité',
      shortName: 'Juridique & Fiscal',
      desc: 'Immatriculation (RCCM/NIF), contrats, baux commerciaux, régularité fiscale et sociale au Gabon.',
      icon: ShieldCheck,
      value: 2
    }
  ]);

  if (!isOpen) return null;

  const updatePillar = (id: string, val: number) => {
    setPillars(prev => prev.map(p => p.id === id ? { ...p, value: val } : p));
  };

  // Score total calculé sur 100
  const totalValue = pillars.reduce((acc, p) => acc + p.value, 0);
  const globalScore = Math.round((totalValue / 25) * 100);

  // Recommandation d'orientation Espace PME
  let recommendation = {
    title: "Parcours Idéation & Structuration Initiale",
    badge: "Accompagnement Fondamental",
    desc: "Nécessite un renforcement prioritaire sur le modèle économique, la formalisation juridique et l'étude terrain.",
    color: "bg-blue-50 text-blue-800 border-blue-200"
  };

  if (globalScore >= 70) {
    recommendation = {
      title: "Parcours Financement & Échelle PME",
      badge: "Accompagnement Avancé",
      desc: "Dossier solide et mature. Éligible pour une mise en relation bancaire, recherche de subventions et déploiement national.",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200"
    };
  } else if (globalScore >= 45) {
    recommendation = {
      title: "Parcours Accélération & Développement Commercial",
      badge: "Consolidation Marché",
      desc: "Bonne base opérationnelle. L'effort doit porter sur l'acquisition client, les marges et la digitalisation des processus.",
      color: "bg-amber-50 text-amber-800 border-amber-200"
    };
  }

  // Calcul des coordonnées SVG pour le Radar Chart (pentagone)
  const size = 260;
  const center = size / 2;
  const radius = center - 35;
  const numAxes = pillars.length;

  const getCoordinates = (axisIndex: number, valueRatio: number) => {
    const angle = (Math.PI * 2 / numAxes) * axisIndex - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Points du polygone de données
  const polygonPoints = pillars.map((p, idx) => {
    const coords = getCoordinates(idx, p.value / 5);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  const handleApply = () => {
    const summary = `
--- DIAGNOSTIC DE MATURITÉ ESPACE PME (QUARTIER B2) ---
Score Global : ${globalScore}/100 (${recommendation.title})
- ${pillars[0].name} : ${pillars[0].value}/5
- ${pillars[1].name} : ${pillars[1].value}/5
- ${pillars[2].name} : ${pillars[2].value}/5
- ${pillars[3].name} : ${pillars[3].value}/5
- ${pillars[4].name} : ${pillars[4].value}/5
Recommandation : ${recommendation.desc}
-------------------------------------------------------
    `.trim();

    onSaveDiagnostic(summary, globalScore);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* En-tête */}
        <div className="px-6 py-5 bg-[#14233c] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center">
              <Target className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Diagnostic de Maturité Entrepreneuriale</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f06553] text-white uppercase">
                  Espace PME
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Évaluation pour <strong>{structureName}</strong> ({candidateName}){structureType ? ` • ${structureType}` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Colonne gauche : Radar Chart & Score */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 text-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Empreinte de maturité (5 piliers)
                </span>
                
                {/* SVG Radar */}
                <div className="relative mx-auto my-2 w-[260px] h-[260px] flex items-center justify-center">
                  <svg width={size} height={size} className="overflow-visible">
                    {/* Cercles de grille 1 à 5 */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, i) => (
                      <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={radius * level}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeDasharray={i === 4 ? "none" : "2,2"}
                        strokeWidth="1"
                      />
                    ))}

                    {/* Lignes d'axes */}
                    {pillars.map((_, idx) => {
                      const coords = getCoordinates(idx, 1);
                      return (
                        <line
                          key={idx}
                          x1={center}
                          y1={center}
                          x2={coords.x}
                          y2={coords.y}
                          stroke="#94a3b8"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Polygone de données rempli */}
                    <polygon
                      points={polygonPoints}
                      fill="rgba(35, 195, 177, 0.35)"
                      stroke="#23c3b1"
                      strokeWidth="2.5"
                    />

                    {/* Points cliquables ou repères */}
                    {pillars.map((p, idx) => {
                      const coords = getCoordinates(idx, p.value / 5);
                      return (
                        <circle
                          key={idx}
                          cx={coords.x}
                          cy={coords.y}
                          r="4.5"
                          fill="#f06553"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      );
                    })}

                    {/* Libellés des axes */}
                    {pillars.map((p, idx) => {
                      const labelCoords = getCoordinates(idx, 1.18);
                      return (
                        <text
                          key={idx}
                          x={labelCoords.x}
                          y={labelCoords.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-[9px] font-bold fill-slate-700"
                        >
                          {p.shortName} ({p.value}/5)
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Score Global */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600">Score global de maturité</span>
                  <span className="text-xl font-black text-slate-900">{globalScore}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#23c3b1] to-[#f06553] transition-all duration-300"
                    style={{ width: `${globalScore}%` }}
                  />
                </div>
              </div>

              {/* Recommandation */}
              <div className={`p-3.5 rounded-xl border text-left space-y-1 ${recommendation.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">{recommendation.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/70">
                    {recommendation.badge}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {recommendation.desc}
                </p>
              </div>

            </div>

            {/* Colonne droite : Grille d'évaluation interactive */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Notation des 5 critères clés (1 = Faible, 5 = Excellent)
              </span>

              {pillars.map((pillar) => {
                const IconComp = pillar.icon;
                return (
                  <div 
                    key={pillar.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-[#23c3b1]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-slate-100 text-[#f06553] flex items-center justify-center shrink-0">
                          <IconComp className="size-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{pillar.name}</h4>
                      </div>
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#23c3b1]/15 text-[#1b9a8c]">
                        {pillar.value} / 5
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      {pillar.desc}
                    </p>

                    {/* Boutons d'échelle 1 à 5 */}
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updatePillar(pillar.id, val)}
                          className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            pillar.value === val
                              ? 'bg-[#14233c] text-white border-[#14233c] shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Pied de page avec actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Fermer sans insérer
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-[#23c3b1] hover:bg-[#1fb3a2] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="size-3.5" />
            <span>Enregistrer dans les notes d'évaluation</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
