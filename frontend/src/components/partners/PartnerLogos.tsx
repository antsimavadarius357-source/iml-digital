// =========================================================================
// LOGOS VECTORIELS OFFICIELS REPRODUITS DE LA BANNIÈRE GEW 2025 LIBREVILLE
// =========================================================================

// 1. GLOBAL ENTREPRENEURSHIP WEEK (GEW) : Cercle segmenté multicolore
export function LogoGEW({ className = "h-8" }: { className?: string }) {
  // 16 segments colorés du cercle GEW officiel
  const colors = [
    '#e11d48', '#f97316', '#facc15', '#84cc16', 
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
    '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
    '#991b1b', '#0f766e', '#1e3a8a', '#475569'
  ];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full aspect-square shrink-0">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {colors.map((c, i) => {
          const dash = 14.5;
          const gap = 14.5 * (colors.length - 1);
          const offset = -(i * 15.5);
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={c}
              strokeWidth="15"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="#ffffff" />
      </svg>
      <div className="flex flex-col text-left leading-none justify-center">
        <span className="text-[11px] font-extrabold text-slate-900 tracking-wider">GLOBAL</span>
        <span className="text-[9px] font-bold text-slate-800 tracking-tight">ENTREPRENEURSHIP</span>
        <span className="text-[12px] font-black text-slate-950 tracking-widest mt-0.5">WEEK</span>
      </div>
    </div>
  );
}

// 2. APJA : Ruban violet + 3 triangles (teal, jaune, vert) + Agir Pour une Jeunesse Autonome
export function LogoAPJA({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 70" className="h-full w-auto shrink-0">
        {/* Ruban violet entrelacé */}
        <path
          d="M20 58 C16 45 10 32 18 18 C25 6 38 12 36 26 C34 38 22 50 15 65"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M28 20 C22 35 15 50 30 65"
          fill="none"
          stroke="#9333ea"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Typo APJA */}
        <text x="44" y="44" fill="#1e293b" fontSize="28" fontWeight="900" fontFamily="sans-serif">
          APJA
        </text>
        {/* 3 triangles géométriques au-dessus de JA */}
        <polygon points="98,16 108,16 103,6" fill="#0d9488" />
        <polygon points="106,24 116,24 111,14" fill="#eab308" />
        <polygon points="112,14 122,14 117,4" fill="#22c55e" />
        {/* Sous-titre */}
        <text x="44" y="58" fill="#64748b" fontSize="7.5" fontWeight="600" fontFamily="sans-serif">
          Agir Pour une Jeunesse Autonome
        </text>
      </svg>
    </div>
  );
}

// 3. MINISTÈRE DE L'ENTREPRENEURIAT, DU COMMERCE ET DES PME/PMI (Armoiries Gabon)
export function LogoMinisterePME({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 70 70" className="h-full aspect-square shrink-0">
        {/* Drapeau Gabon vert jaune bleu en en-tête */}
        <rect x="5" y="8" width="60" height="9" rx="2" fill="#009e49" />
        <rect x="5" y="17" width="60" height="9" fill="#fcd116" />
        <rect x="5" y="26" width="60" height="9" rx="2" fill="#0066b2" />
        {/* Écu central avec symbole de la République */}
        <circle cx="35" cy="21.5" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
        <path d="M31 15 L39 15 L40 22 L35 26 L30 22 Z" fill="#009e49" />
        <circle cx="35" cy="20" r="2.8" fill="#fcd116" />
        <path d="M28 25 Q35 29 42 25" stroke="#0066b2" strokeWidth="1.5" fill="none" />
        {/* Banderole UNION TRAVAIL JUSTICE */}
        <rect x="8" y="42" width="54" height="7" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <text x="35" y="47" textAnchor="middle" fill="#0f172a" fontSize="4.2" fontWeight="800" fontFamily="sans-serif">
          UNION • TRAVAIL • JUSTICE
        </text>
        <text x="35" y="58" textAnchor="middle" fill="#0f172a" fontSize="5" fontWeight="900" fontFamily="sans-serif">
          RÉPUBLIQUE GABONAISE
        </text>
      </svg>
      <div className="flex flex-col text-left leading-tight justify-center min-w-0">
        <span className="text-[7.5px] font-extrabold text-emerald-800 tracking-wider">RÉPUBLIQUE GABONAISE</span>
        <span className="text-[9.5px] font-black text-slate-900 leading-tight">MINISTÈRE DU COMMERCE</span>
        <span className="text-[8.5px] font-bold text-slate-700 leading-tight">& DES PME/PMI</span>
      </div>
    </div>
  );
}

// 4. PNPE : Globe tricolore avec carte blanche du Gabon + typo bleue
export function LogoPNPE({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 140 60" className="h-full w-auto shrink-0">
        {/* Globe en 3 tranches incurvées (vert, jaune, bleu) */}
        <defs>
          <clipPath id="pnpe-globe-clip">
            <circle cx="30" cy="30" r="24" />
          </clipPath>
        </defs>
        <g clipPath="url(#pnpe-globe-clip)">
          <path d="M6 14 Q30 8 54 14 L54 6 L6 6 Z" fill="#009e49" />
          <path d="M6 14 Q30 8 54 14 L54 36 Q30 30 6 36 Z" fill="#fcd116" />
          <path d="M6 36 Q30 30 54 36 L54 54 L6 54 Z" fill="#0066b2" />
          {/* Silhouette stylisée blanche de la carte du Gabon */}
          <path 
            d="M26 18 L34 20 L38 28 L36 38 L28 42 L22 36 L20 26 Z" 
            fill="#ffffff" 
            stroke="#1e3a8a" 
            strokeWidth="1.2" 
          />
        </g>
        <circle cx="30" cy="30" r="24" fill="none" stroke="#0066b2" strokeWidth="2" />
        
        {/* Texte PNPE */}
        <text x="60" y="36" fill="#1e40af" fontSize="26" fontWeight="900" fontFamily="sans-serif">
          PNPE
        </text>
        <text x="60" y="47" fill="#475569" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          PÔLE NATIONAL DE PROMOTION DE L'EMPLOI
        </text>
      </svg>
    </div>
  );
}

// 5. FEG : Globe maillé de points verts & argent + Typo FEG
export function LogoFEG({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 60" className="h-full w-auto shrink-0">
        {/* Globe composé de points stylisés */}
        <g fill="#16a34a">
          <circle cx="20" cy="14" r="2.5" />
          <circle cx="27" cy="12" r="2.8" />
          <circle cx="34" cy="14" r="2.5" />
          <circle cx="16" cy="20" r="2.8" />
          <circle cx="24" cy="19" r="3.2" />
          <circle cx="32" cy="19" r="3.2" />
          <circle cx="40" cy="20" r="2.8" />
        </g>
        <g fill="#475569">
          <circle cx="14" cy="27" r="3" />
          <circle cx="22" cy="26" r="3.5" />
          <circle cx="31" cy="26" r="3.5" />
          <circle cx="40" cy="27" r="3" />
          <circle cx="18" cy="34" r="3" />
          <circle cx="27" cy="34" r="3.2" />
          <circle cx="36" cy="34" r="3" />
          <circle cx="24" cy="40" r="2.5" />
          <circle cx="32" cy="40" r="2.5" />
        </g>
        {/* Typo FEG */}
        <text x="50" y="38" fill="#0f172a" fontSize="28" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
          FEG
        </text>
        <text x="50" y="48" fill="#64748b" fontSize="5.2" fontWeight="700" fontFamily="sans-serif">
          FÉDÉRATION DES ENTREPRISES DU GABON
        </text>
      </svg>
    </div>
  );
}

// 6. CHAMBRE DE COMMERCE DU GABON : Roue dentée verte + rameau de feuilles
export function LogoChambreCommerce({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 140 60" className="h-full w-auto shrink-0">
        {/* Rouage denté avec rameau d'olivier/arbre vert */}
        <circle cx="24" cy="30" r="16" fill="none" stroke="#047857" strokeWidth="4" strokeDasharray="6 3" />
        <circle cx="24" cy="30" r="8" fill="#ffffff" stroke="#047857" strokeWidth="2.5" />
        {/* Rameau de feuilles stylisé à gauche */}
        <path d="M12 18 Q16 12 24 10" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="15" cy="14" r="2.5" fill="#10b981" />
        <circle cx="20" cy="10" r="2.5" fill="#10b981" />
        <path d="M10 28 Q8 38 14 46" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="10" cy="36" r="2.5" fill="#10b981" />
        <circle cx="13" cy="44" r="2.5" fill="#10b981" />

        {/* Typo officielle */}
        <text x="46" y="24" fill="#047857" fontSize="13" fontWeight="900" fontFamily="sans-serif">
          Chambre
        </text>
        <text x="46" y="36" fill="#334155" fontSize="11" fontWeight="700" fontFamily="sans-serif">
          de Commerce
        </text>
        <text x="46" y="48" fill="#047857" fontSize="12" fontWeight="900" fontFamily="sans-serif">
          du GABON
        </text>
      </svg>
    </div>
  );
}

// 7. AFRICA UNITED AIRLINES : Silhouette chef indien/guerrier rouge
export function LogoAfricaUnited({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 130 65" className="h-full w-auto shrink-0">
        {/* Cercle avec profil stylisé et coiffe de plumes rouges */}
        <circle cx="30" cy="30" r="22" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
        {/* Plumes stylisées */}
        <path d="M16 28 L30 14 L36 12 L28 24 Z" fill="#b91c1c" />
        <path d="M12 34 L32 20 L38 18 L26 30 Z" fill="#dc2626" />
        <path d="M14 40 L34 26 L42 24 L28 36 Z" fill="#ef4444" />
        {/* Visage / profil */}
        <circle cx="34" cy="32" r="7" fill="#dc2626" />
        <path d="M34 32 L44 33 L39 40 Z" fill="#991b1b" />

        {/* Typo AFRICA UNITED */}
        <text x="56" y="30" fill="#991b1b" fontSize="13" fontWeight="900" fontFamily="sans-serif">
          AFRICA
        </text>
        <text x="56" y="44" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif">
          UNITED
        </text>
        <text x="56" y="55" fill="#dc2626" fontSize="8" fontStyle="italic" fontWeight="600" fontFamily="sans-serif">
          airlines
        </text>
      </svg>
    </div>
  );
}

// 8. GABON MECA : Monogramme GM géométrique bleu roi
export function LogoGabonMeca({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 140 60" className="h-full w-auto shrink-0">
        {/* Monogramme GM géométrique */}
        <g fill="#1e3a8a">
          {/* Lettre G */}
          <path d="M6 14 L24 14 L24 22 L14 22 L14 38 L24 38 L24 30 L18 30 L18 24 L30 24 L30 46 L6 46 Z" />
        </g>
        <g fill="#0284c7">
          {/* Lettre M */}
          <path d="M34 14 L42 14 L48 28 L54 14 L62 14 L62 46 L54 46 L54 26 L49 38 L47 38 L42 26 L42 46 L34 46 Z" />
        </g>

        {/* Typo GABON MECA */}
        <text x="70" y="32" fill="#0284c7" fontSize="16" fontWeight="900" fontFamily="sans-serif">
          GABON
        </text>
        <text x="70" y="45" fill="#1e3a8a" fontSize="14" fontWeight="900" fontFamily="sans-serif">
          MECA
        </text>
        <text x="70" y="54" fill="#64748b" fontSize="5.5" fontWeight="700" fontFamily="sans-serif">
          LA SOLUTION BUREAU
        </text>
      </svg>
    </div>
  );
}

// 9. MULTIPRESS GABON : Personnage stylisé cylindre de presse bleu
export function LogoMultipress({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 130 60" className="h-full w-auto shrink-0">
        {/* Symbole rotatif presse / tête stylisée */}
        <circle cx="28" cy="16" r="6" fill="#1e3a8a" />
        <path d="M18 24 C18 24 28 20 38 24 C42 30 38 40 32 44 L24 44 C18 40 14 30 18 24 Z" fill="#1e3a8a" />
        <path d="M12 34 C12 34 28 28 44 34" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
        
        {/* Typo multipress gabon */}
        <text x="48" y="32" fill="#1e3a8a" fontSize="16" fontWeight="900" fontFamily="sans-serif">
          multi
        </text>
        <text x="48" y="45" fill="#1e3a8a" fontSize="16" fontWeight="900" fontFamily="sans-serif">
          press
        </text>
        <text x="48" y="56" fill="#0284c7" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          gabon
        </text>
      </svg>
    </div>
  );
}

// 10. CECA GADIS : Carré bleu nuit avec sceau argenté CG
export function LogoCecaGadis({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 60" className="h-full w-auto shrink-0">
        {/* Écusson carré bleu nuit */}
        <rect x="10" y="8" width="44" height="44" rx="8" fill="#0f172a" />
        {/* Monogramme circulaire CG */}
        <circle cx="32" cy="30" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
        <path d="M38 22 C30 18 22 24 22 30 C22 36 30 42 38 38 L38 32 L30 32" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 24 L36 30 L30 36" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Typo CECA GADIS */}
        <text x="62" y="30" fill="#0f172a" fontSize="14" fontWeight="900" fontFamily="sans-serif">
          CECA
        </text>
        <text x="62" y="46" fill="#0f172a" fontSize="14" fontWeight="900" fontFamily="sans-serif">
          GADIS
        </text>
      </svg>
    </div>
  );
}

// 11. DGI (Direction Générale des Impôts) : Ellipse avec flèche or & bleu
export function LogoDGI({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 130 60" className="h-full w-auto shrink-0">
        {/* Ellipse orbitale */}
        <ellipse cx="65" cy="28" rx="55" ry="18" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeDasharray="70 20" />
        <path d="M20 34 C35 48 95 48 115 32" stroke="#eab308" strokeWidth="2.5" fill="none" />
        <polygon points="115,32 108,30 112,38" fill="#eab308" />

        {/* Lettres DGi */}
        <text x="45" y="35" fill="#1e3a8a" fontSize="24" fontWeight="900" fontFamily="sans-serif">
          DG<tspan fill="#0284c7" fontStyle="italic">i</tspan>
        </text>

        {/* Sous-titre */}
        <text x="65" y="52" textAnchor="middle" fill="#334155" fontSize="6.5" fontWeight="800" fontFamily="sans-serif">
          DIRECTION GÉNÉRALE DES IMPÔTS
        </text>
      </svg>
    </div>
  );
}

// 12. EDG : Lettres dégradées sunset
export function LogoEDG({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 110 50" className="h-full w-auto shrink-0">
        <defs>
          <linearGradient id="edg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>
        <text x="5" y="38" fill="url(#edg-grad)" fontSize="38" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
          EDG
        </text>
      </svg>
    </div>
  );
}

// 13. OGAPI : Lettres vertes avec globe germant
export function LogoOGAPI({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 50" className="h-full w-auto shrink-0">
        {/* O avec anneau orbital et pousse verte */}
        <circle cx="16" cy="26" r="10" fill="none" stroke="#16a34a" strokeWidth="3" />
        <path d="M8 26 Q16 18 24 26" stroke="#22c55e" strokeWidth="2" fill="none" />
        <path d="M16 16 L16 10 Q20 8 22 12" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Typo GAPI */}
        <text x="30" y="34" fill="#15803d" fontSize="24" fontWeight="900" fontFamily="sans-serif">
          GAPI
        </text>
        <text x="4" y="46" fill="#475569" fontSize="4.5" fontWeight="700" fontFamily="sans-serif">
          OFFICE GABONAIS DE LA PROPRIÉTÉ INDUSTRIELLE
        </text>
      </svg>
    </div>
  );
}

// 14. ONEC : Hexagone 3D isométrique bleu-vert
export function LogoONEC({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 130 55" className="h-full w-auto shrink-0">
        {/* Hexagone 3D */}
        <g transform="translate(18, 26)">
          <polygon points="0,-18 16,-9 16,9 0,18 -16,9 -16,-9" fill="#0284c7" />
          <polygon points="0,-18 16,-9 0,0 -16,-9" fill="#38bdf8" />
          <polygon points="0,0 16,-9 16,9 0,18" fill="#0369a1" />
          <polygon points="0,0 -16,-9 -16,9 0,18" fill="#0f766e" />
          {/* E blanc au centre */}
          <path d="M-6,-5 L6,-5 L6,-2 L-2,-2 L-2,0 L4,0 L4,2 L-2,2 L-2,5 L6,5" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Typo ONEC */}
        <text x="42" y="30" fill="#0f172a" fontSize="20" fontWeight="900" fontFamily="sans-serif">
          ONEC
        </text>
        <text x="42" y="42" fill="#64748b" fontSize="5" fontWeight="700" fontFamily="sans-serif">
          ORDRE DES EXPERTS COMPTABLES DU GABON
        </text>
      </svg>
    </div>
  );
}

// 15. AKEWA ACCÉLÉRATEUR : Flèche chevron rouge et verte
export function LogoAkewa({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 130 50" className="h-full w-auto shrink-0">
        {/* Chevrons formant le A */}
        <polygon points="4,32 14,14 20,24 12,38" fill="#15803d" />
        <polygon points="16,32 24,14 34,32 26,32 22,24 18,32" fill="#b91c1c" />
        <polygon points="26,14 36,32 44,18 34,14" fill="#059669" />

        {/* Typo AKEWA */}
        <text x="46" y="26" fill="#0f172a" fontSize="15" fontWeight="900" fontFamily="sans-serif">
          AKEWA
        </text>
        <text x="46" y="37" fill="#b91c1c" fontSize="7.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">
          ACCÉLÉRATEUR
        </text>
      </svg>
    </div>
  );
}

// 16. VOCALCENTRE : Typo épurée avec icône et point
export function LogoVocalcentre({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
        vc
      </div>
      <div className="flex items-center">
        <span className="text-sm font-light text-slate-800 tracking-tight">vocal</span>
        <span className="text-sm font-black text-slate-950 tracking-tight">centre</span>
        <span className="size-1.5 rounded-full bg-[#FF5B37] ml-0.5 -mt-2" />
      </div>
    </div>
  );
}

// 17. CYBERSCHOOL - ENTREPRENEURIAT : Toit orange et silhouette
export function LogoCyberschool({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 140 55" className="h-full w-auto shrink-0">
        {/* Toit / Chapeau orange */}
        <path d="M12 24 L28 10 L44 24 L38 24 L28 15 L18 24 Z" fill="#ea580c" />
        {/* Rayons solaires */}
        <line x1="28" y1="5" x2="28" y2="2" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="8" x2="39" y2="6" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
        {/* Silhouette étudiant */}
        <circle cx="28" cy="22" r="3" fill="#1e3a8a" />
        <path d="M22 30 C22 26 34 26 34 30" fill="#1e3a8a" />

        {/* Typo */}
        <text x="50" y="22" fill="#1e3a8a" fontSize="9" fontWeight="900" fontFamily="sans-serif">
          CYBERSCHOOL
        </text>
        <text x="50" y="32" fill="#ea580c" fontSize="8" fontWeight="800" fontFamily="sans-serif">
          ENTREPRENEURIAT
        </text>
        <text x="50" y="44" fill="#64748b" fontSize="5.5" fontWeight="600" fontFamily="sans-serif">
          Incubateur NTIC • Logiciels
        </text>
      </svg>
    </div>
  );
}

// 18. EDN'COMM : Cercle jaune-citron avec 2 personnages dansants
export function LogoEDNComm({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 110 50" className="h-full w-auto shrink-0">
        {/* Cercle lime/jaune */}
        <circle cx="25" cy="25" r="18" fill="#d9f99d" stroke="#84cc16" strokeWidth="1.5" />
        {/* 2 personnages stylisés avec bras levés */}
        {/* Personnage 1 */}
        <circle cx="20" cy="18" r="3" fill="#15803d" />
        <path d="M14 28 Q20 22 26 28 L23 35 L17 35 Z" fill="#15803d" />
        {/* Personnage 2 */}
        <circle cx="29" cy="16" r="3" fill="#0f172a" />
        <path d="M23 26 Q30 20 37 26 L34 35 L27 35 Z" fill="#0f172a" />

        {/* Typo EDN'COMM */}
        <text x="50" y="31" fill="#0f172a" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
          EDN'COMM
        </text>
      </svg>
    </div>
  );
}

// 19. DTG+Net PROPRE : Goutte d'eau bleue avec balai rouge & main blanche
export function LogoDTGNet({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 130 55" className="h-full w-auto shrink-0">
        {/* Goutte d'eau bleue */}
        <path d="M25 8 C25 8 10 24 10 34 C10 42 17 48 25 48 C33 48 40 42 40 34 C40 24 25 8 25 8 Z" fill="#0284c7" />
        {/* Balai rouge incliné */}
        <path d="M18 28 L30 16 L33 19 L21 31 Z" fill="#dc2626" />
        <path d="M16 28 L24 36 L18 38 Z" fill="#ef4444" />
        {/* Main/éponge blanche */}
        <path d="M26 30 C28 28 32 30 34 32 C36 34 34 38 30 38 Z" fill="#ffffff" />

        {/* Typo DTG+Net PROPRE */}
        <text x="46" y="26" fill="#0f172a" fontSize="14" fontWeight="900" fontFamily="sans-serif">
          DTG<tspan fill="#dc2626">+</tspan>Net
        </text>
        <text x="46" y="40" fill="#0284c7" fontSize="10" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
          PROPRE
        </text>
      </svg>
    </div>
  );
}

// 20. HOKANO : Deux personnages embrassés bordeaux et gris
export function LogoHokano({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 50" className="h-full w-auto shrink-0">
        {/* Figure 1 bordeaux */}
        <circle cx="20" cy="20" r="4" fill="#991b1b" />
        <path d="M14 26 C14 22 26 22 26 26 C26 34 18 36 12 30" fill="#991b1b" />
        {/* Figure 2 grise */}
        <circle cx="32" cy="18" r="4" fill="#475569" />
        <path d="M26 24 C26 20 38 20 38 24 C38 32 30 34 24 28" fill="#475569" />

        {/* Typo H O K A N O */}
        <text x="46" y="30" fill="#475569" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="2.5">
          HOKANO
        </text>
      </svg>
    </div>
  );
}
