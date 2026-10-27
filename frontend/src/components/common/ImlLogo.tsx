import React from 'react';

interface ImlLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Logo officiel vectoriel IML DIGIT
 * Inspiré directement de l'identité officielle de l'Incubateur Multisectoriel de Libreville :
 * - Fleur / bourgeon d'innovation : pétales bleu roi et flamme d'énergie orange
 * - Pilier 'I' vert émergence avec son socle de fondation
 * - Lettres 'M' et 'L' géométriques orange dynamique
 * - Extension numérique 'digit' et sous-titre institutionnel
 */
export const ImlSymbol: React.FC<{ className?: string; size?: number }> = ({ className = 'size-9', size = 36 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Dégradé Fleur / Flamme centrale */}
        <linearGradient id="iml-flame-grad" x1="50" y1="6" x2="50" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A45" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        {/* Dégradé Pétales latéraux bleu roi */}
        <linearGradient id="iml-petal-blue" x1="20" y1="12" x2="80" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Dégradé Pilier I Vert émergence */}
        <linearGradient id="iml-green-grad" x1="20" y1="36" x2="32" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Dégradé Orange M & L */}
        <linearGradient id="iml-orange-grad" x1="38" y1="40" x2="94" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6B4A" />
          <stop offset="100%" stopColor="#E04626" />
        </linearGradient>

        {/* Ombre douce */}
        <filter id="iml-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.15" />
        </filter>
      </defs>

      <g filter="url(#iml-shadow)">
        {/* =================================================================
            1. BOURGEON / FLEUR D'INNOVATION AU-DESSUS DU 'I'
           ================================================================= */}
        {/* Pétale gauche (Bleu roi) */}
        <path 
          d="M 44 26 C 36 25 24 22 22 14 C 20 8 28 6 35 11 C 42 16 45 22 44 26 Z" 
          fill="url(#iml-petal-blue)" 
        />
        
        {/* Pétale droit (Bleu roi) */}
        <path 
          d="M 56 26 C 64 25 76 22 78 14 C 80 8 72 6 65 11 C 58 16 55 22 56 26 Z" 
          fill="url(#iml-petal-blue)" 
        />

        {/* Coupe de liaison basse sous le bourgeon */}
        <path 
          d="M 33 22 C 40 28 60 28 67 22 C 63 31 37 31 33 22 Z" 
          fill="#1E40AF" 
        />

        {/* Flamme / Bourgeon central (Orange éclatant) */}
        <path 
          d="M 50 4 C 54 11 56 16 53 22 C 50 25 47 22 47 16 C 47 11 48 6 50 4 Z" 
          fill="url(#iml-flame-grad)" 
        />

        {/* =================================================================
            2. LETTRE 'I' (PILIER VERT ÉMERGENCE ET SOCLE)
           ================================================================= */}
        {/* Colonne verticale du 'I' */}
        <rect x="22" y="34" width="10" height="52" rx="2.5" fill="url(#iml-green-grad)" />

        {/* Socle horizontal sous le IML */}
        <path 
          d="M 14 86 L 94 86 C 95.5 86 96 87.5 96 89 C 96 90.5 95.5 92 94 92 L 14 92 C 12.5 92 12 90.5 12 89 C 12 87.5 12.5 86 14 86 Z" 
          fill="url(#iml-green-grad)" 
        />

        {/* =================================================================
            3. LETTRE 'M' (ORANGE GÉOMÉTRIQUE)
           ================================================================= */}
        <path 
          d="M 38 40 L 46 40 L 53 62 L 60 40 L 68 40 L 68 84 L 60 84 L 60 55 L 55 70 L 51 70 L 46 55 L 46 84 L 38 84 Z" 
          fill="url(#iml-orange-grad)" 
        />

        {/* =================================================================
            4. LETTRE 'L' (ORANGE GÉOMÉTRIQUE)
           ================================================================= */}
        <path 
          d="M 73 40 L 81 40 L 81 76 L 93 76 C 94 76 94.5 77 94.5 78.5 C 94.5 80 94 84 93 84 L 73 84 Z" 
          fill="url(#iml-orange-grad)" 
        />
      </g>
    </svg>
  );
};

export default function ImlLogo({
  className = '',
  variant = 'full',
  theme = 'light',
  size = 'md'
}: ImlLogoProps) {
  const isDark = theme === 'dark';

  // Tailles du symbole
  const symbolSize = size === 'sm' ? 32 : size === 'lg' ? 44 : 38;

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <ImlSymbol size={symbolSize} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Symbole officiel IML stylisé */}
      <div className="relative shrink-0 transition-transform group-hover:scale-105 duration-200">
        <ImlSymbol size={symbolSize} />
      </div>

      {/* Typographie de marque IML DIGIT */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            iml
          </span>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#f06553]">
            digit<span className="inline-block text-[#10B981] animate-pulse">.</span>
          </span>
        </div>

        {variant === 'full' && (
          <span 
            className={`text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.18em] mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Incubation & Accélération
          </span>
        )}
      </div>
    </div>
  );
}
