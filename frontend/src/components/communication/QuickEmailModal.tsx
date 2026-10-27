import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Send, User, Check, Sparkles, Mail, Copy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface QuickEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
}

interface RecipientItem {
  id: string;
  name: string;
  role: string;
  email: string;
  type: 'beneficiary' | 'coach' | 'partner';
}

const EMAIL_TEMPLATES = [
  {
    label: "Convocation entretien",
    subject: (name: string) => `[IML Digit] Convocation à votre entretien d'accompagnement - ${name}`,
    body: (name: string) => `Bonjour ${name},\n\nNous avons bien reçu votre demande d'accompagnement et nous avons le plaisir de vous inviter à votre entretien d'évaluation.\n\n📅 Date & Heure : [À préciser]\n📍 Modalité : \n- En présentiel à nos bureaux (Espace PME, Quartier B2, Libreville), OU\n- En visioconférence via le lien direct qui vous sera envoyé.\n\nMerci de bien vouloir vous munir ou nous transmettre par retour d'e-mail (ou par WhatsApp) les documents liés à votre activité (statuts, devis, plan de trésorerie, etc.).\n\nRestant à votre entière disposition.\n\nBien cordialement,\nL'équipe d'accompagnement IML Digit\nWhatsApp : +241 07 40 20 48`
  },
  {
    label: "Compte-rendu & Conseils",
    subject: (name: string) => `[IML Digit] Compte-rendu de votre séance d'accompagnement - ${name}`,
    body: (name: string) => `Bonjour ${name},\n\nFaisant suite à notre échange avec votre conseiller référent, voici la synthèse de votre séance et les prochaines actions à mener pour votre entreprise :\n\n1. [Action prioritaire 1]\n2. [Action prioritaire 2]\n\nVous trouverez en pièce jointe la fiche de synthèse de votre diagnostic.\n\nN'hésitez pas à nous écrire directement sur ce fil ou sur WhatsApp pour toute question.\n\nExcellente continuation dans vos démarches !\n\nL'équipe IML Digit`
  },
  {
    label: "Demande de pièces justificatives",
    subject: (name: string) => `[IML Digit] Pièces complémentaires pour votre dossier - ${name}`,
    body: (name: string) => `Bonjour ${name},\n\nAfin de finaliser l'instruction de votre dossier d'incubation, merci de bien vouloir nous transmettre par retour d'e-mail ou directement sur WhatsApp les éléments suivants :\n\n- Copie de votre pièce d'identité (CNI ou Passeport)\n- Justificatif d'activité ou documents d'immatriculation (si disponibles)\n- Éléments financiers ou devis en cours\n\nNous restons à votre entière disposition pour vous guider.\n\nCordialement,\nLe secrétariat IML Digit`
  },
  {
    label: "Bilan Final & Fin de Parcours",
    subject: (name: string) => `[IML Digit] Félicitations ! Validation de votre cycle d'accompagnement - ${name}`,
    body: (name: string) => `Bonjour ${name},\n\nToutes nos félicitations ! Vous avez validé avec succès votre cycle d'accompagnement entrepreneurial au sein de l'IML.\n\nVous trouverez ci-joint la synthèse finale de vos jalons validés et votre attestation de fin de parcours.\n\nNous vous souhaitons un franc succès dans le déploiement de vos activités !\n\nBien cordialement,\nLa Direction Générale de l'IML Digit`
  }
];

export default function QuickEmailModal({
  isOpen,
  onClose,
  defaultRecipientEmail = '',
  defaultRecipientName = ''
}: QuickEmailModalProps) {
  const [recipientTab, setRecipientTab] = useState<'all' | 'beneficiaries' | 'coaches'>('all');
  const [search, setSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientItem | null>(null);
  const [emailInput, setEmailInput] = useState(defaultRecipientEmail);
  const [nameInput, setNameInput] = useState(defaultRecipientName);
  const [subject, setSubject] = useState(() => EMAIL_TEMPLATES[0].subject(defaultRecipientName || 'Entrepreneur'));
  const [body, setBody] = useState(() => EMAIL_TEMPLATES[0].body(defaultRecipientName || 'Entrepreneur'));
  const [copied, setCopied] = useState(false);

  // Charger les bénéficiaires
  const { data: benefData } = useQuery({
    queryKey: ['quick-email-beneficiaries'],
    queryFn: () => api<{ items: any[] }>('/beneficiaries?pageSize=50').catch(() => ({ items: [] })),
    enabled: isOpen
  });

  // Charger les utilisateurs
  const { data: usersData } = useQuery({
    queryKey: ['quick-email-users'],
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
        email: b.email || `${(b.firstName || 'contact').toLowerCase()}@imldigit.ga`,
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
        email: u.email || 'coach@imldigit.ga',
        type: 'coach'
      });
    });

    if (list.length === 0) {
      list.push(
        { id: 'b1', name: 'Marine LOUPE', role: 'Dossier IML-2026-0003', email: 'marine.loupe@test.com', type: 'beneficiary' },
        { id: 'b2', name: 'Alain MVE', role: 'Dossier IML-2026-0004', email: 'alain.mve@test.com', type: 'beneficiary' },
        { id: 'c1', name: 'Coach Principal IML', role: 'Coach référent', email: 'coach.principal@imldigit.ga', type: 'coach' }
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
      return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.role.toLowerCase().includes(s);
    });
  }, [recipients, recipientTab, search]);

  const handleSelectRecipient = (r: RecipientItem) => {
    setSelectedRecipient(r);
    setNameInput(r.name);
    setEmailInput(r.email);
    setSubject(EMAIL_TEMPLATES[0].subject(r.name));
    setBody(EMAIL_TEMPLATES[0].body(r.name));
  };

  const handleApplyTemplate = (tmpl: typeof EMAIL_TEMPLATES[0]) => {
    const targetName = nameInput || selectedRecipient?.name || 'Entrepreneur';
    setSubject(tmpl.subject(targetName));
    setBody(tmpl.body(targetName));
  };

  const handleSendEmail = () => {
    const mailto = `mailto:${encodeURIComponent(emailInput)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleCopy = () => {
    if (navigator?.clipboard) {
      const fullText = `Destinataire : ${emailInput}\nObjet : ${subject}\n\n${body}`;
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-700 to-cyan-800 text-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <Mail className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                E-mail Direct IML Digit
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-400/30 text-teal-100 border border-teal-300/30">
                  Courrier officiel
                </span>
              </h2>
              <p className="text-xs text-teal-100/90">
                Préparez et envoyez un e-mail officiel à un bénéficiaire, un coach ou un partenaire.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                <User className="size-3.5 text-teal-600" />
                1. Choisir un destinataire ou saisir une adresse
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
                placeholder="Rechercher par nom, rôle ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
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
                        ? 'border-teal-500 bg-teal-50/80 text-teal-900 shadow-2xs ring-1 ring-teal-500'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="size-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[10px]">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[11px] leading-tight truncate max-w-[120px]">{r.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{r.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saisie directe du nom et de l'e-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Nom complet</label>
                <input
                  type="text"
                  placeholder="Ex: Marine LOUPE"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 mt-0.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium">Adresse e-mail</label>
                <div className="relative mt-0.5">
                  <Mail className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="Ex: marine.loupe@test.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modèles d'e-mails */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-teal-600" />
              2. Modèles de courriers officiels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {EMAIL_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-slate-700 text-[11px] font-medium text-center transition-colors cursor-pointer"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Objet de l'e-mail */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Objet de l'e-mail</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet du courrier..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Corps de l'e-mail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Corps du message</label>
              <span className="text-[10px] text-slate-400">{body.length} caractères</span>
            </div>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédigez votre message officiel..."
              className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 leading-relaxed font-sans"
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
            {copied ? <Check className="size-3.5 text-teal-600" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier l\'e-mail'}</span>
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
              onClick={handleSendEmail}
              disabled={!emailInput}
              className="px-4 py-2 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Mail className="size-4" />
              <span>Ouvrir ma messagerie</span>
              <Send className="size-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
