interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'icon';
}

export function Logo({ className = '', showText = true, variant = 'full' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Monogramme IML */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${variant === 'icon' ? 'w-10 h-10' : 'w-10 h-10'} shrink-0`}
        aria-label="Logo IML Digital"
      >
        {/* Fond arrondi optionnel */}
        <rect width="100" height="100" rx="20" fill="#0f2b46" />

        {/* Lettre I - Pilier gauche */}
        <rect x="20" y="25" width="12" height="50" rx="2" fill="white" />

        {/* Lettre M - Structure centrale ascendante */}
        <path
          d="M38 75V45L50 25L62 45V75"
          stroke="#14b8a6"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Lettre L - Base droite */}
        <path
          d="M68 25V63H88"
          stroke="white"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Point digital / accent */}
        <circle cx="88" cy="25" r="5" fill="#14b8a6" />
      </svg>

      {/* Texte wordmark */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight text-[#0f2b46]">
            IML
          </span>
          <span className="text-xs font-medium tracking-widest text-[#14b8a6] uppercase">
            Digital
          </span>
        </div>
      )}
    </div>
  );
}
