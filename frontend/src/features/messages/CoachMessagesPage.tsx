import { useState } from 'react';
import { 
  Search, 
  Send, 
  CheckCheck, 
  Inbox,
  CheckCircle2,
  Mail,
  Smartphone,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export interface MessageItem {
  id: string;
  senderName: string;
  senderRole: string;
  senderType: 'PORTAL' | 'STARTUP' | 'PME' | 'ORGANISATION' | 'AGENT' | 'DIRECTION';
  senderEmail: string;
  subject: string;
  content: string;
  createdAt: string;
  timeAgo: string;
  isRead: boolean;
  replies?: { author: string; text: string; date: string; channel?: string }[];
}

const DEFAULT_MESSAGES: MessageItem[] = [
  {
    id: 'msg-1',
    senderName: 'Marine LOUPE',
    senderRole: 'Porteuse de projet • Start-up BioTech',
    senderType: 'STARTUP',
    senderEmail: 'marine.loupe@test.com',
    subject: 'Questions sur le canevas de Business Model (Phase 1)',
    content: 'Bonjour Coach Darius,\n\nJ\'ai finalisé la mise à jour des segments clients et du modèle de revenus dans notre canevas d\'incubation. Pourriez-vous y jeter un œil avant notre séance de coaching prévue lundi à 14h30 ?\n\nJ\'aimerais particulièrement votre avis sur la structure des coûts de distribution au Gabon.\n\nMerci beaucoup pour votre accompagnement,\nMarine',
    createdAt: '13 Octobre 2026',
    timeAgo: 'Il y a 1 heure',
    isRead: false,
    replies: []
  },
  {
    id: 'msg-2',
    senderName: 'Alexandre Agent IML',
    senderRole: 'Agent de coordination IML Digit',
    senderType: 'AGENT',
    senderEmail: 'agent@imldigit.com',
    subject: 'Attribution du dossier SOPHIATECH GABON',
    content: 'Bonjour Darius,\n\nNous t\'avons attribué la supervision de SOPHIATECH GABON SARL pour leur accompagnement à la restructuration financière.\n\nLe dossier d\'immatriculation et le bilan préliminaire ont été validés par l\'accueil. Tu peux consulter les éléments directement dans ta session et planifier le prochain entretien d\'étape.\n\nBien à toi,\nAlexandre',
    createdAt: '12 Octobre 2026',
    timeAgo: 'Hier à 16:45',
    isRead: false,
    replies: []
  },
  {
    id: 'msg-3',
    senderName: 'Direction IML Digit',
    senderRole: 'Direction Générale Incubateur',
    senderType: 'DIRECTION',
    senderEmail: 'admin@imldigit.com',
    subject: 'Transmission des feuilles de prestations de coaching',
    content: 'Cher coach,\n\nNous vous rappelons que la clôture administrative des heures de coaching du mois en cours aura lieu le 25 du mois.\n\nMerci de vous assurer que toutes vos prestations réalisées auprès des entrepreneurs (séances individuelles et bilans d\'étape) ont bien été renseignées dans votre session.\n\nLa Direction IML',
    createdAt: '10 Octobre 2026',
    timeAgo: 'Il y a 3 jours',
    isRead: true,
    replies: []
  },
  {
    id: 'msg-4',
    senderName: 'COOPÉRATIVE AGRI-GABON',
    senderRole: 'Bénéficiaire Organisation',
    senderType: 'ORGANISATION',
    senderEmail: 'contact@agrigabon.ga',
    subject: 'Ajustement horaire pour l\'atelier gouvernance',
    content: 'Bonjour Monsieur le Coach,\n\nSuite à un impératif de collecte avec les coopérateurs ruraux ce mercredi, est-il envisageable de décaler le début de notre séance de 30 minutes (commencer à 09h30 au lieu de 09h00) ?\n\nNous restons à votre entière disposition pour confirmer ce créneau.\n\nRespectueusement,\nLe bureau exécutif Agri-Gabon',
    createdAt: '08 Octobre 2026',
    timeAgo: 'Il y a 5 jours',
    isRead: true,
    replies: [
      {
        author: 'Darius Coach IML',
        text: 'C\'est bien noté pour 09h30 mercredi. Rendez-vous confirmé !',
        date: '08/10/2026 à 18h12',
        channel: 'Email direct'
      }
    ]
  }
];

export default function CoachMessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_coach_messages_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_MESSAGES;
  });

  const [selectedId, setSelectedId] = useState<string>(messages[0]?.id || 'msg-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'BENEFICIARIES' | 'ADMIN'>('ALL');
  const [replyText, setReplyText] = useState('');
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendChannel, setSendChannel] = useState<'EMAIL' | 'SMS' | 'BOTH'>('EMAIL');

  const selectedMessage = messages.find(m => m.id === selectedId) || messages[0];

  const handleSelectMessage = (id: string) => {
    setSelectedId(id);
    // Marquer comme lu
    setMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, isRead: true } : m);
      try {
        localStorage.setItem('iml_coach_messages_v1', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    const channelLabel = sendChannel === 'EMAIL' 
      ? `Email direct vers ${selectedMessage.senderEmail}` 
      : sendChannel === 'SMS' 
      ? 'SMS direct' 
      : `Email & SMS vers ${selectedMessage.senderEmail}`;

    const newReply = {
      author: user ? `${user.firstName} ${user.lastName}`.trim() : 'Darius Coach IML',
      text: replyText.trim(),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      channel: channelLabel
    };

    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === selectedMessage.id) {
          return {
            ...m,
            replies: [...(m.replies || []), newReply]
          };
        }
        return m;
      });
      try {
        localStorage.setItem('iml_coach_messages_v1', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });

    const successMsg = sendChannel === 'EMAIL' 
      ? `Message transmis via passerelle Email vers ${selectedMessage.senderEmail}`
      : sendChannel === 'SMS'
      ? 'Alerte SMS transmise au mobile du candidat'
      : `Message transmis simultanément par Email (${selectedMessage.senderEmail}) et SMS`;

    setReplyText('');
    setSendSuccess(successMsg);
    setTimeout(() => setSendSuccess(null), 4000);
  };

  // Simulation d'une réponse reçue du bénéficiaire par retour d'email (Logique B validée)
  const handleSimulateBeneficiaryReply = () => {
    if (!selectedMessage) return;

    const simulatedResponses = [
      "Merci Coach pour ces précisions, c'est parfaitement clair ! Je vous transmets les pièces complémentaires d'ici demain matin.",
      "C'est bien noté, nous serons présents à l'heure indiquée avec toute l'équipe. Merci pour votre réactivité par email !",
      "Bien reçu ! J'ai pu tester le lien de visioconférence et ma caméra fonctionne bien. À très bientôt pour l'entretien."
    ];
    const randomReply = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];

    const incomingReply = {
      author: `${selectedMessage.senderName} (Retour Email)`,
      text: randomReply,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      channel: `Reçu par retour d'email depuis ${selectedMessage.senderEmail}`
    };

    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === selectedMessage.id) {
          return {
            ...m,
            isRead: false,
            replies: [...(m.replies || []), incomingReply]
          };
        }
        return m;
      });
      try {
        localStorage.setItem('iml_coach_messages_v1', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });

    setSendSuccess(`Nouvelle réponse de ${selectedMessage.senderName} synchronisée depuis sa boîte email !`);
    setTimeout(() => setSendSuccess(null), 4000);
  };

  const filteredMessages = messages.filter(m => {
    // Filtre texte
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = m.senderName.toLowerCase().includes(q) || 
                    m.subject.toLowerCase().includes(q) || 
                    m.content.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Filtre catégorie
    if (filter === 'UNREAD') return !m.isRead;
    if (filter === 'BENEFICIARIES') return ['STARTUP', 'PME', 'ORGANISATION'].includes(m.senderType);
    if (filter === 'ADMIN') return ['AGENT', 'DIRECTION'].includes(m.senderType);
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      
      {/* Bandeau d'en-tête de la messagerie */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-teal-50 text-[#23c3b1] flex items-center justify-center font-bold">
            <Inbox className="size-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Messages reçus
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f06553] text-white">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500">
              Consultez les messages envoyés par vos bénéficiaires et l'équipe d'encadrement IML
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Session Coach : <strong>{user?.firstName} {user?.lastName}</strong></span>
        </div>
      </div>

      {/* Conteneur principal 2 colonnes : Liste à gauche + Lecture/Réponse à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* COLONNE GAUCHE (5/12) : Liste des messages reçus */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[650px]">
          
          {/* Barre de recherche et filtres rapides */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Rechercher un message ou un expéditeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1]"
              />
            </div>

            {/* Boutons de filtres */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-[#1a3348] text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Tous ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'UNREAD'
                    ? 'bg-[#f06553] text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Non lus ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('BENEFICIARIES')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'BENEFICIARIES'
                    ? 'bg-[#23c3b1] text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Bénéficiaires
              </button>
              <button
                type="button"
                onClick={() => setFilter('ADMIN')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'ADMIN'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Coordination
              </button>
            </div>
          </div>

          {/* Liste déroulante des messages */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun message trouvé pour ce filtre.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedId === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`p-3.5 transition-all cursor-pointer relative ${
                      isSelected 
                        ? 'bg-teal-50/40 border-l-3 border-l-[#23c3b1]' 
                        : 'hover:bg-slate-50 border-l-3 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!msg.isRead && (
                          <span className="size-2 rounded-full bg-[#f06553] shrink-0" title="Message non lu" />
                        )}
                        <span className={`text-xs truncate ${!msg.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                          {msg.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {msg.timeAgo}
                      </span>
                    </div>

                    <div className={`text-xs mb-1 line-clamp-1 ${!msg.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {msg.subject}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      {msg.content}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {msg.senderRole}
                      </span>
                      {msg.replies && msg.replies.length > 0 && (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCheck className="size-3" /> {msg.replies.length} réponse{msg.replies.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* COLONNE DROITE (7/12) : Lecture du message & Réponse rapide */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[650px]">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              
              {/* En-tête du message */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/40 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="size-7 rounded-full bg-[#1a3348] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {selectedMessage.senderName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          {selectedMessage.senderName} <span className="text-slate-400 font-normal">({selectedMessage.senderEmail})</span>
                        </div>
                        <div className="text-[11px] text-[#23c3b1] font-medium">
                          {selectedMessage.senderRole}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">{selectedMessage.createdAt}</span>
                    <span className="text-[10px] text-slate-400">{selectedMessage.timeAgo}</span>
                  </div>
                </div>
              </div>

              {/* Corps du message et historique des réponses */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-white">
                
                {/* Contenu principal */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedMessage.content}
                </div>

                {/* Historique des réponses du Coach */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Vos réponses :
                    </div>
                    {selectedMessage.replies.map((reply, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs text-slate-800 ml-4 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-teal-800 font-semibold">
                          <span>{reply.author}</span>
                          <div className="flex items-center gap-2">
                            {reply.channel && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-teal-200 text-teal-700 font-medium shadow-2xs">
                                {reply.channel}
                              </span>
                            )}
                            <span className="text-slate-400 font-normal">{reply.date}</span>
                          </div>
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Formulaire de réponse rapide via la passerelle Email / SMS */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
                {sendSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span className="font-medium">{sendSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Sélecteur de canal de transmission */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Canal d'envoi :</span>
                    <button
                      type="button"
                      onClick={() => setSendChannel('EMAIL')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        sendChannel === 'EMAIL'
                          ? 'bg-[#1a3348] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Mail className="size-3" />
                      <span>Email direct ({selectedMessage.senderEmail})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendChannel('SMS')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        sendChannel === 'SMS'
                          ? 'bg-[#1a3348] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Smartphone className="size-3" />
                      <span>SMS direct</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendChannel('BOTH')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        sendChannel === 'BOTH'
                          ? 'bg-[#f06553] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCw className="size-3" />
                      <span>Email + SMS</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateBeneficiaryReply}
                    className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Simule la réception d'un email de réponse envoyé par le bénéficiaire depuis sa boîte personnelle"
                  >
                    <Sparkles className="size-3 text-amber-600" />
                    <span>Simuler un retour d'email du candidat</span>
                  </button>
                </div>
                
                <form onSubmit={handleSendReply} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder={`Rédigez votre message à destination de ${selectedMessage.senderName} (${sendChannel === 'EMAIL' ? 'reçu directement par email' : sendChannel === 'SMS' ? 'reçu par SMS' : 'reçu par email & SMS'})...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1] resize-none shadow-2xs"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      ✓ Acheminé automatiquement vers la boîte personnelle du candidat
                    </span>
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-4 py-2 rounded-lg bg-[#23c3b1] hover:bg-[#1db09e] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="size-3.5" />
                      <span>Transmettre {sendChannel === 'EMAIL' ? 'par Email' : sendChannel === 'SMS' ? 'par SMS' : 'par Email & SMS'}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
              <Inbox className="size-10 stroke-[1.25] text-slate-300 mb-2" />
              <span>Sélectionnez un message à gauche pour afficher son contenu</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
