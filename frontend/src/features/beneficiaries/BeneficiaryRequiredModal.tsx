import { type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, type LucideProps } from 'lucide-react';

export interface BeneficiaryRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateBeneficiary: () => void;
  title?: string;
  message?: string;
  icon?: ComponentType<LucideProps>;
}

export default function BeneficiaryRequiredModal({
  isOpen,
  onClose,
  onOpenCreateBeneficiary,
  title = 'Envoyer un document',
  message = "Vous devez d'abord créer au moins un bénéficiaire avant de pouvoir envoyer un document.",
  icon: Icon = FileText,
}: BeneficiaryRequiredModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[75] overflow-y-auto bg-black/55 backdrop-blur-[2px] p-4 flex flex-col justify-start sm:justify-center items-center transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[460px] my-auto bg-white rounded-2xl shadow-2xl p-7 sm:p-9 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de fermeture en haut à droite */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* Cercle avec icône au centre */}
        <div className="size-16 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center mb-5 text-slate-700 shadow-2xs">
          <Icon className="size-7 stroke-[1.5]" />
        </div>

        {/* Titre */}
        <h3 className="text-xl sm:text-[22px] font-semibold text-slate-800 tracking-tight mb-2.5">
          {title}
        </h3>

        {/* Message d'avertissement */}
        <p className="text-slate-600 text-sm sm:text-[14.5px] leading-relaxed mb-7 max-w-sm font-normal">
          {message}
        </p>

        {/* Bouton Créer un bénéficiaire (corail) */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenCreateBeneficiary();
          }}
          className="px-7 py-2.5 rounded-md bg-[#f06553] hover:bg-[#e05341] text-white text-sm font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.98]"
        >
          Créer un bénéficiaire
        </button>
      </div>
    </div>,
    document.body
  );
}
