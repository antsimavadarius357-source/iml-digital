import { useState, useEffect, useRef } from 'react';
import { Award, ShieldCheck, QrCode, Edit3, RotateCcw } from 'lucide-react';

export interface CertificateData {
  id?: string;
  certificateNumber?: string;
  recipientName: string;
  projectName?: string;
  structureType?: string;
  programName?: string;
  completionDate?: string;
  templateType?: 'incubation' | 'business_plan' | 'competences' | 'honneur';
  themeColor?: 'gold_emerald' | 'sapphire' | 'ruby_gold';
  coachName?: string;
  directorName?: string;
  editable?: boolean;
}

export const CERTIFICATE_TYPES = {
  incubation: {
    title: "CERTIFICAT DE FIN DE PARCOURS D'INCUBATION",
    subtitle: "PROGRAMME NATIONAL D'ACCOMPAGNEMENT ENTREPRENEURIAL",
    description: "Atteste que le récipiendaire a accompli avec assiduité et succès l'intégralité du cycle d'incubation, validé les jalons méthodologiques et démontré la viabilité opérationnelle de son modèle d'affaires.",
    badgeLabel: "INCUBATION VALIDÉE",
  },
  business_plan: {
    title: "CERTIFICAT DE VALIDATION DU BUSINESS PLAN",
    subtitle: "COMITÉ D'EXPERTISE & DE STRUCTURATION FINANCIÈRE",
    description: "Certifie la solidité économique, la robustesse prévisionnelle et la cohérence stratégique du plan d'affaires présenté et validé par le jury d'experts.",
    badgeLabel: "FINANCE & STRATÉGIE",
  },
  competences: {
    title: "ATTESTATION DE COMPÉTENCES ENTREPRENEURIALES",
    subtitle: "DÉVELOPPEMENT DES CAPACITÉS DE DIRECTION & DE LEADERSHIP",
    description: "Reconnaît la maîtrise des compétences clés en gestion d'entreprise, négociation commerciale, management d'équipe et modélisation de l'offre de valeur.",
    badgeLabel: "EXCELLENCE MANAGÉRIALE",
  },
  honneur: {
    title: "DIPLÔME D'HONNEUR DU MÉRITE ENTREPRENEURIAL",
    subtitle: "DISTINCTION SPÉCIALE DU DIRECTOIRE IML",
    description: "Décerné en reconnaissance de l'engagement exceptionnel, de l'innovation d'impact et de la résilience démontrés tout au long de la création et du déploiement du projet.",
    badgeLabel: "DISTINCTION D'HONNEUR",
  },
};

export const CERTIFICATE_THEMES = {
  gold_emerald: {
    name: "Prestige Émeraude & Or",
    primary: "#0d5c52", // Deep emerald
    accent: "#b8860b", // Rich gold
    borderOuter: "border-[#0d5c52]",
    borderInner: "border-[#c59b27]",
    ribbon: "from-[#c59b27] via-[#e5c158] to-[#9a7615]",
    bgGradient: "bg-gradient-to-br from-[#fbfdfc] via-[#f7faf8] to-[#f4f8f6]",
    badgeBg: "bg-[#0d5c52]",
    sealText: "text-[#d4af37]",
  },
  sapphire: {
    name: "Saphir & Platine Moderne",
    primary: "#102a43", // Deep sapphire
    accent: "#0ea5e9", // Vivid cyan / sky
    borderOuter: "border-[#102a43]",
    borderInner: "border-[#38bdf8]",
    ribbon: "from-[#0284c7] via-[#38bdf8] to-[#0369a1]",
    bgGradient: "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]",
    badgeBg: "bg-[#102a43]",
    sealText: "text-[#38bdf8]",
  },
  ruby_gold: {
    name: "Rubis Impérial & Or",
    primary: "#7f1d1d", // Deep ruby
    accent: "#d97706", // Amber gold
    borderOuter: "border-[#7f1d1d]",
    borderInner: "border-[#f59e0b]",
    ribbon: "from-[#d97706] via-[#fcd34d] to-[#b45309]",
    bgGradient: "bg-gradient-to-br from-[#fffdfa] via-[#fef7ee] to-[#fef2f2]",
    badgeBg: "bg-[#7f1d1d]",
    sealText: "text-[#fcd34d]",
  },
};

/**
 * Champ de texte modifiable directement en ligne sur le diplôme
 */
function EditableField({
  value,
  onChange,
  className = '',
  style,
  as: Component = 'span',
  isEditable = true,
  placeholder = '',
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: any;
  isEditable?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = value;
    }
  }, [value]);

  if (!isEditable) {
    return (
      <Component className={className} style={style}>
        {value}
      </Component>
    );
  }

  return (
    <Component
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.textContent || '';
        onChange(text.trim() || placeholder || value);
      }}
      className={`${className} outline-none transition-all cursor-text hover:bg-amber-400/15 hover:ring-1 hover:ring-amber-400/60 focus:bg-white/90 focus:ring-2 focus:ring-amber-500 rounded px-1 -mx-1 inline-block print:hover:bg-transparent print:hover:ring-0 print:focus:bg-transparent print:focus:ring-0`}
      style={style}
      title="Cliquez pour modifier directement ce texte"
    >
      {value}
    </Component>
  );
}

export default function DigitalCertificateView({
  recipientName,
  projectName = "Projet Stratégique",
  structureType = "Startup & PME",
  programName = "Parcours d'Incubation Nationale IML Digit",
  completionDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
  templateType = 'incubation',
  themeColor = 'gold_emerald',
  coachName = "Darius Coach IML",
  directorName = "Direction Générale IML",
  certificateNumber = `IML-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  editable = true,
}: CertificateData) {
  const tpl = CERTIFICATE_TYPES[templateType] || CERTIFICATE_TYPES.incubation;
  const theme = CERTIFICATE_THEMES[themeColor] || CERTIFICATE_THEMES.gold_emerald;

  // État local des textes personnalisables en direct
  const [texts, setTexts] = useState({
    country: "RÉPUBLIQUE GABONAISE",
    motto: "Union • Travail • Justice",
    organization: "INCUBATEUR MULTISECTORIEL DE LIBREVILLE",
    program: `${programName} • IML Digit`,
    title: tpl.title,
    subtitle: tpl.subtitle,
    intro: "Le présent certificat officiel d'excellence est fièrement décerné à :",
    recipient: recipientName,
    project: projectName,
    structure: structureType,
    description: tpl.description,
    coach: coachName,
    coachTitle: "Coach Référent & Mentor",
    director: directorName,
    directorTitle: "Direction Générale de l'IML",
    datePlace: `Délivré à Libreville, le ${completionDate}`,
    certNumber: certificateNumber,
  });

  // Synchronisation lors du changement de modèle ou de bénéficiaire
  useEffect(() => {
    setTexts(prev => ({
      ...prev,
      title: tpl.title,
      subtitle: tpl.subtitle,
      description: tpl.description,
      recipient: recipientName || prev.recipient,
      project: projectName || prev.project,
      structure: structureType || prev.structure,
    }));
  }, [templateType, recipientName, projectName, structureType]);

  const updateField = (key: keyof typeof texts, val: string) => {
    setTexts(prev => ({ ...prev, [key]: val }));
  };

  const handleResetAll = () => {
    setTexts({
      country: "RÉPUBLIQUE GABONAISE",
      motto: "Union • Travail • Justice",
      organization: "INCUBATEUR MULTISECTORIEL DE LIBREVILLE",
      program: `${programName} • IML Digit`,
      title: tpl.title,
      subtitle: tpl.subtitle,
      intro: "Le présent certificat officiel d'excellence est fièrement décerné à :",
      recipient: recipientName,
      project: projectName,
      structure: structureType,
      description: tpl.description,
      coach: coachName,
      coachTitle: "Coach Référent & Mentor",
      director: directorName,
      directorTitle: "Direction Générale de l'IML",
      datePlace: `Délivré à Libreville, le ${completionDate}`,
      certNumber: certificateNumber,
    });
  };

  return (
    <div className="w-full print:p-0">

      {/* BANDEAU INDICATEUR DU MODE ÉDITION DIRECTE */}
      {editable && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 px-3.5 py-2 rounded-xl text-amber-900 text-xs mb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Edit3 className="size-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode modification directe actif :</strong> Cliquez directement sur n'importe quel texte du diplôme pour le modifier.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0 ml-2"
            title="Rétablir les textes d'origine"
          >
            <RotateCcw className="size-3 text-amber-600" />
            <span>Réinitialiser les textes</span>
          </button>
        </div>
      )}
      
      {/* CADRE DU DIPLÔME PAYSAGER HAUTE DÉFINITION */}
      <div 
        className={`relative w-full aspect-[1.414/1] min-h-[520px] sm:min-h-[620px] rounded-xl sm:rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden ${theme.bgGradient} border-8 ${theme.borderOuter} transition-all duration-300 font-sans`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 100px rgba(0, 0, 0, 0.02)'
        }}
      >
        
        {/* CADRE DOUBLE INTÉRIEUR GUILLOCHÉ EN OR */}
        <div className={`absolute inset-3 sm:inset-4 border-2 ${theme.borderInner} rounded-lg pointer-events-none opacity-90`} />
        <div className={`absolute inset-4 sm:inset-5 border border-dashed ${theme.borderInner} rounded-md pointer-events-none opacity-60`} />

        {/* ORNEMENTS D'ANGLES BAROQUES / GÉOMÉTRIQUES DORÉS */}
        {/* Coin Supérieur Gauche */}
        <div className="absolute top-5 left-5 size-12 sm:size-16 pointer-events-none opacity-85">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#c59b27]">
            <path d="M5 5 H45 M5 5 V45 M15 15 H40 M15 15 V40 M25 25 L5 5 M5 20 Q20 20 20 5 M10 30 Q30 30 30 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Coin Supérieur Droit */}
        <div className="absolute top-5 right-5 size-12 sm:size-16 pointer-events-none opacity-85 rotate-90">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#c59b27]">
            <path d="M5 5 H45 M5 5 V45 M15 15 H40 M15 15 V40 M25 25 L5 5 M5 20 Q20 20 20 5 M10 30 Q30 30 30 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Coin Inférieur Gauche */}
        <div className="absolute bottom-5 left-5 size-12 sm:size-16 pointer-events-none opacity-85 -rotate-90">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#c59b27]">
            <path d="M5 5 H45 M5 5 V45 M15 15 H40 M15 15 V40 M25 25 L5 5 M5 20 Q20 20 20 5 M10 30 Q30 30 30 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Coin Inférieur Droit */}
        <div className="absolute bottom-5 right-5 size-12 sm:size-16 pointer-events-none opacity-85 rotate-180">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-[#c59b27]">
            <path d="M5 5 H45 M5 5 V45 M15 15 H40 M15 15 V40 M25 25 L5 5 M5 20 Q20 20 20 5 M10 30 Q30 30 30 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* FILIGRANE DE SÉCURITÉ EN FOND (WATERMARK CENTRAL) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
          <div className="size-80 sm:size-96 rounded-full border-[18px] border-slate-900 flex items-center justify-center">
            <Award className="size-60 sm:size-72 text-slate-900" />
          </div>
        </div>

        {/* CONTENU PRINCIPAL DU CERTIFICAT */}
        <div className="relative z-10 h-full flex flex-col justify-between text-center px-4 sm:px-12 py-2">
          
          {/* 1. EN-TÊTE ÉTAT & INSTITUTION */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 sm:w-16 bg-[#c59b27]" />
              <EditableField
                value={texts.country}
                onChange={v => updateField('country', v)}
                className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#c59b27] uppercase"
                isEditable={editable}
              />
              <span className="h-px w-8 sm:w-16 bg-[#c59b27]" />
            </div>
            
            <div>
              <EditableField
                value={texts.motto}
                onChange={v => updateField('motto', v)}
                className="text-[8px] sm:text-[9px] tracking-widest text-slate-400 font-semibold uppercase"
                isEditable={editable}
              />
            </div>

            <div className="pt-1 space-y-0.5">
              <div>
                <EditableField
                  value={texts.organization}
                  onChange={v => updateField('organization', v)}
                  className="text-xs sm:text-sm font-extrabold tracking-wider text-slate-800 uppercase"
                  isEditable={editable}
                />
              </div>
              <div>
                <EditableField
                  value={texts.program}
                  onChange={v => updateField('program', v)}
                  className="text-[9px] sm:text-[10px] text-slate-500 tracking-wider uppercase font-medium"
                  isEditable={editable}
                />
              </div>
            </div>
          </div>

          {/* 2. TITRE DU CERTIFICAT */}
          <div className="my-2 sm:my-3">
            <EditableField
              as="h1"
              value={texts.title}
              onChange={v => updateField('title', v)}
              className="text-lg sm:text-2xl md:text-3xl font-serif font-black tracking-wide uppercase px-2 block"
              style={{ color: theme.primary }}
              isEditable={editable}
            />
            <div className="mt-1">
              <EditableField
                value={texts.subtitle}
                onChange={v => updateField('subtitle', v)}
                className="text-[9px] sm:text-xs font-semibold text-[#c59b27] tracking-widest uppercase"
                isEditable={editable}
              />
            </div>
          </div>

          {/* 3. DÉCERNÉ À (RÉCIPIENDAIRE) */}
          <div className="space-y-1 sm:space-y-2 my-1">
            <div>
              <EditableField
                value={texts.intro}
                onChange={v => updateField('intro', v)}
                className="text-[10px] sm:text-xs text-slate-500 font-serif italic tracking-wider"
                isEditable={editable}
              />
            </div>

            {/* NOM DU RÉCIPIENDAIRE EN MAJESTÉ */}
            <div className="relative inline-block mx-auto max-w-full">
              <div 
                className="text-xl sm:text-3xl md:text-4xl font-serif font-extrabold tracking-tight text-slate-900 px-6 py-1 border-b-2 border-[#c59b27]"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
              >
                <EditableField
                  value={texts.recipient}
                  onChange={v => updateField('recipient', v)}
                  isEditable={editable}
                />
              </div>
            </div>

            {/* PROJET ET STRUCTURE */}
            <div className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 flex-wrap">
              <span>Projet / Entreprise :</span>
              <span className="text-slate-900 font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                <EditableField
                  value={texts.project}
                  onChange={v => updateField('project', v)}
                  isEditable={editable}
                />
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">
                <EditableField
                  value={texts.structure}
                  onChange={v => updateField('structure', v)}
                  isEditable={editable}
                />
              </span>
            </div>
          </div>

          {/* 4. MENTION D'ACCOMPLISSEMENT */}
          <div className="max-w-2xl mx-auto px-4 my-1">
            <p className="text-[10px] sm:text-xs leading-relaxed text-slate-600 font-serif italic">
              « <EditableField
                value={texts.description}
                onChange={v => updateField('description', v)}
                isEditable={editable}
              /> »
            </p>
          </div>

          {/* 5. BAS DE PAGE : SCEAU D'OR, SIGNATURES & QR CODE */}
          <div className="pt-3 sm:pt-4 border-t border-slate-200/80 flex items-end justify-between gap-2 sm:gap-6 text-left">
            
            {/* Signature 1 : Coach Référent */}
            <div className="w-1/3 text-center space-y-1">
              <div className="h-10 sm:h-12 flex items-center justify-center">
                {/* Signature numérique manuscrite stylisée */}
                <span className="font-serif italic text-base sm:text-xl text-slate-600 rotate-[-4deg] select-none opacity-85">
                  {texts.coach.split(' ')[0]}
                </span>
              </div>
              <div className="h-px bg-slate-300 w-3/4 mx-auto" />
              <div className="text-[9px] sm:text-[11px] font-bold text-slate-800">
                <EditableField
                  value={texts.coach}
                  onChange={v => updateField('coach', v)}
                  isEditable={editable}
                />
              </div>
              <div className="text-[8px] sm:text-[9px] text-slate-400 font-medium">
                <EditableField
                  value={texts.coachTitle}
                  onChange={v => updateField('coachTitle', v)}
                  isEditable={editable}
                />
              </div>
            </div>

            {/* SCEAU D'OR CENTRAL EN RELIEF AVEC RUBANS */}
            <div className="w-1/3 flex flex-col items-center justify-center relative -mb-2">
              <div className="relative group cursor-pointer">
                
                {/* Rubans tombants en pointe sous le médaillon */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-12 h-14 flex justify-between pointer-events-none opacity-90">
                  <div className={`w-5 h-12 bg-gradient-to-b ${theme.ribbon} shadow-md rotate-[-12deg] rounded-b-xs`} 
                       style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }} />
                  <div className={`w-5 h-12 bg-gradient-to-b ${theme.ribbon} shadow-md rotate-[12deg] rounded-b-xs`}
                       style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' }} />
                </div>

                {/* Médaillon d'or rond cranté en relief */}
                <div className="size-16 sm:size-20 rounded-full bg-gradient-to-tr from-[#a67c1e] via-[#f7d56e] to-[#c59b27] p-1 shadow-lg flex items-center justify-center relative z-10 border-2 border-[#fff5cc]">
                  <div className="size-full rounded-full border border-dashed border-[#8c6714] flex flex-col items-center justify-center text-center p-1 bg-gradient-to-b from-[#f3cc5e] to-[#c29623] shadow-inner">
                    <ShieldCheck className="size-5 sm:size-6 text-[#523d06] stroke-[2.2]" />
                    <span className="text-[6px] sm:text-[7px] font-black tracking-tighter text-[#423103] uppercase mt-0.5 leading-none">
                      CERTIFIÉ
                    </span>
                    <span className="text-[5px] sm:text-[6px] font-bold text-[#5c4405] tracking-widest leading-none">
                      OFFICIEL
                    </span>
                  </div>
                </div>

              </div>
              
              <div className="text-[8px] sm:text-[9px] text-[#8c6714] font-bold uppercase tracking-widest mt-4">
                IML DIGIT CERTIFIED
              </div>
            </div>

            {/* Signature 2 : Direction Générale & Cachet */}
            <div className="w-1/3 text-center space-y-1 relative">
              
              {/* Cachet rond IML apposé en bleu d'encre d'état */}
              <div className="absolute -top-3 right-4 size-16 sm:size-20 rounded-full border-2 border-dashed border-blue-700/60 pointer-events-none rotate-[-15deg] flex items-center justify-center p-1 opacity-70">
                <div className="size-full rounded-full border border-blue-700/40 flex flex-col items-center justify-center text-[6px] font-bold text-blue-800 uppercase tracking-tighter">
                  <span>IML DIGIT</span>
                  <span className="text-[5px] text-blue-600 font-normal">DIRECTION</span>
                  <span className="text-[5px]">GABON</span>
                </div>
              </div>

              <div className="h-10 sm:h-12 flex items-center justify-center">
                <span className="font-serif italic text-base sm:text-xl text-slate-700 rotate-[3deg] select-none opacity-85">
                  {texts.director.split(' ')[0]}
                </span>
              </div>
              <div className="h-px bg-slate-300 w-3/4 mx-auto" />
              <div className="text-[9px] sm:text-[11px] font-bold text-slate-800">
                <EditableField
                  value={texts.director}
                  onChange={v => updateField('director', v)}
                  isEditable={editable}
                />
              </div>
              <div className="text-[8px] sm:text-[9px] text-slate-400 font-medium">
                <EditableField
                  value={texts.directorTitle}
                  onChange={v => updateField('directorTitle', v)}
                  isEditable={editable}
                />
              </div>
            </div>

          </div>

          {/* 6. PIED DE PAGE : IDENTIFIANT UNIQUE & HORODATAGE DE VÉRIFICATION */}
          <div className="pt-2 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <QrCode className="size-3.5 text-slate-600 shrink-0" />
              <span>
                N° : <strong className="text-slate-700">
                  <EditableField
                    value={texts.certNumber}
                    onChange={v => updateField('certNumber', v)}
                    isEditable={editable}
                  />
                </strong>
              </span>
            </div>
            <div>
              <EditableField
                value={texts.datePlace}
                onChange={v => updateField('datePlace', v)}
                className="font-semibold text-slate-700"
                isEditable={editable}
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
