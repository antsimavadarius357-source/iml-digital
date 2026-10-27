import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Send, User, Check, Sparkles, Phone, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function WhatsAppSvg({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface QuickWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientPhone?: string;
  defaultRecipientName?: string;
}

interface RecipientItem {
  id: string;
  name: string;
  role: string;
  phone?: string;
  type: 'beneficiary' | 'coach' | 'partner';
}

const TEMPLATES = [
  {
    label: "Rappel de rendez-vous",
    text: (name: string) => `Bonjour ${name},\n\nNous vous rappelons votre prochain rendez-vous d'accompagnement avec votre conseiller IML. Merci de bien vouloir nous confirmer votre disponibilité.\n\nBien cordialement,\nL'équipe IML Digit`
  },
  {
    label: "Point d'étape & suivi",
    text: (name: string) => `Bonjour ${name},\n\nComment avancez-vous sur vos démarches et étapes clés ? Votre conseiller reste à votre entière disposition pour vous guider.\n\nÀ très vite !`
  },
  {
    label: "Demande de livrables",
    text: (name: string) => `Bonjour ${name},\n\nMerci de bien vouloir nous transmettre vos pièces justificatives ou livrables d'avancement directement sur ce fil WhatsApp ou par e-mail afin de valider l'étape en cours.\n\nBonne continuation !`
  },
  {
    label: "Prise de contact directe",
    text: (name: string) => `Bonjour ${name},\n\nJe vous contacte au sujet de votre accompagnement entrepreneurial au sein de l'IML.\n\nRestant à votre écoute pour échanger.`
  }
];

export default function QuickWhatsAppModal({
  isOpen,
  onClose,
  defaultRecipientPhone = '',
  defaultRecipientName = ''
}: QuickWhatsAppModalProps) {
  const [recipientTab, setRecipientTab] = useState<'all' | 'beneficiaries' | 'coaches'>('all');
  const [search, setSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientItem | null>(null);
  const [phoneInput, setPhoneInput] = useState(defaultRecipientPhone);
  const [nameInput, setNameInput] = useState(defaultRecipientName);
  const [message, setMessage] = useState(() => TEMPLATES[0].text(defaultRecipientName || ''));
  const [copied, setCopied] = useState(false);

  // Charger les bénéficiaires
  const { data: benefData } = useQuery({
    queryKey: ['quick-modal-beneficiaries'],
    queryFn: () => api<{ items: any[] }>('/beneficiaries?pageSize=50').catch(() => ({ items: [] })),
    enabled: isOpen
  });

  // Charger les utilisateurs (coachs, admins)
  const { data: usersData } = useQuery({
    queryKey: ['quick-modal-users'],
    queryFn: () => api<{ items?: any[] } | any[]>('/users?pageSize=50').catch(() => []),
    enabled: isOpen
  });

  const recipients = useMemo<RecipientItem[]>(() => {
    const list: RecipientItem[] = [];

    // Bénéficiaires
    const bItems = benefData?.items || [];
    bItems.forEach((b: any) => {
      const name = `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Bénéficiaire sans nom';
      list.push({
        id: b.id,
        name,
        role: b.fileNumber ? `Dossier ${b.fileNumber}` : 'Bénéficiaire',
        phone: b.phone || '+24177000000',
        type: 'beneficiary'
      });
    });

    // Coachs / Utilisateurs
    const uItems = Array.isArray(usersData) ? usersData : (usersData?.items || []);
    uItems.forEach((u: any) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Membre';
      list.push({
        id: u.id,
        name,
        role: u.role || 'Coach / Staff',
        phone: u.phone || '+24174000000',
        type: 'coach'
      });
    });

    // Contacts par défaut si la base est en cours d'initialisation
    if (list.length === 0) {
      list.push(
        { id: 'b1', name: 'Marine LOUPE', role: 'Dossier IML-2026-0003', phone: '+24177123456', type: 'beneficiary' },
        { id: 'b2', name: 'Alain MVE', role: 'Dossier IML-2026-0004', phone: '+24174987654', type: 'beneficiary' },
        { id: 'c1', name: 'Coach Principal IML', role: 'Coach référent', phone: '+24166112233', type: 'coach' }
      );
    }

    return list;
  }, [benefData, usersData]);

  const filteredRecipients = useMemo(() => {
    return recipients.filter(r => {
      if (recipientTab === 'beneficiaries' && r.type !== 'beneficiary') return false;
      if (recipientTab === 'coaches' && r.type !== 'coach') return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) || (r.phone && r.phone.includes(s)) || r.role.toLowerCase().includes(s);
    });
  }, [recipients, recipientTab, search]);

  const handleSelectRecipient = (r: RecipientItem) => {
    setSelectedRecipient(r);
    setNameInput(r.name);
    setPhoneInput(r.phone || '');
    // Appliquer le template avec le nom sélectionné
    setMessage(TEMPLATES[0].text(r.name));
  };

  const handleApplyTemplate = (tmplText: (name: string) => string) => {
    const targetName = nameInput || selectedRecipient?.name || '';
    setMessage(tmplText(targetName));
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phoneInput ? phoneInput.replace(/[^0-9+]/g, '') : '';
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <WhatsAppSvg className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                WhatsApp Direct IML Digit
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/30 text-emerald-100 border border-emerald-300/30">
                  Messagerie externe
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90">
                Contactez instantanément un bénéficiaire, un coach ou saisissez un numéro libre.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Sélection du destinataire */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="size-3.5 text-emerald-600" />
                1. Choisir un destinataire dans le carnet ou saisir directement
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setRecipientTab('all')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${recipientTab === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientTab('beneficiaries')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${recipientTab === 'beneficiaries' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Bénéficiaires
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientTab('coaches')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${recipientTab === 'coaches' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Coachs
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, rôle ou numéro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Liste horizontale / badges des contacts récents */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-h-24">
              {filteredRecipients.slice(0, 12).map((r) => {
                const isSelected = selectedRecipient?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRecipient(r)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="size-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[11px] leading-tight truncate max-w-[120px]">{r.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{r.phone || r.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saisie directe du numéro et du nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Nom du destinataire</label>
                <input
                  type="text"
                  placeholder="Ex: Marine LOUPE"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 mt-0.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Numéro de téléphone WhatsApp</label>
                <div className="relative mt-0.5">
                  <Phone className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Ex: +241 77 00 00 00"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modèles de messages */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-600" />
              2. Modèles de messages rapides
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl.text)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 text-[11px] font-medium text-center transition-colors cursor-pointer"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Éditeur de message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-emerald-600" />
                3. Message à envoyer via WhatsApp
              </label>
              <span className="text-[10px] text-slate-400">{message.length} caractères</span>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Saisissez votre message WhatsApp..."
              className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed font-sans"
            />
          </div>

        </div>

        {/* Pied de page & actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : null}
            <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 text-xs font-medium cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <WhatsAppSvg className="size-4" />
              <span>Ouvrir WhatsApp</span>
              <Send className="size-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
