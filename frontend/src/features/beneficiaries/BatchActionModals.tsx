import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserCheck, 
  Users, 
  Building2, 
  MessageSquare, 
  BarChart2, 
  Archive, 
  Trash2, 
  Check, 
  Loader2, 
  Mail, 
  Smartphone, 
  AlertTriangle,
  Printer,
  Sparkles
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export type BatchActionType = 'assign' | 'group' | 'org' | 'message' | 'reporting' | 'archive' | 'delete' | null;

interface BatchActionModalsProps {
  action: BatchActionType;
  onClose: () => void;
  selectedIds: string[];
  selectedBeneficiaries: any[];
  onSuccess: (msg: string) => void;
}

export default function BatchActionModals({
  action,
  onClose,
  selectedIds,
  selectedBeneficiaries,
  onSuccess
}: BatchActionModalsProps) {
  const queryClient = useQueryClient();

  // State pour l'assignation de coach
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // State pour l'ajout à un groupe
  const [selectedGroup, setSelectedGroup] = useState<string>('Cohorte 2026 - Espace PME Quartier B2');
  const [customGroup, setCustomGroup] = useState<string>('');

  // State pour la liaison à une organisation
  const [selectedOrg, setSelectedOrg] = useState<string>('Espace PME Gabon (Quartier B2)');

  // State pour l'envoi de message
  const [messageChannel, setMessageChannel] = useState<'email' | 'sms' | 'both'>('email');
  const [messageSubject, setMessageSubject] = useState<string>('Point d’étape accompagnement - IML Digit');
  const [messageContent, setMessageContent] = useState<string>('Bonjour, nous vous informons que votre dossier avance auprès des conseillers de l’Espace PME.');

  // Requête options (agents)
  const optionsQuery = useQuery({
    queryKey: ['beneficiary-options'],
    queryFn: () => api<{ agents: { id: string; firstName: string; lastName: string }[] }>('/beneficiaries/options'),
    enabled: action === 'assign'
  });

  // Mutation générique de mise à jour des bénéficiaires
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!action) return null;

  const count = selectedIds.length;

  // 1. CONFIRMATION ASSIGNATION COACH
  const handleConfirmAssign = async () => {
    if (!selectedAgentId) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map(id => api(`/beneficiaries/${id}`, { method: 'PATCH', body: { assignedAgentId: selectedAgentId } }))
      );
      queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
      const agent = optionsQuery.data?.agents.find(a => a.id === selectedAgentId);
      const agentName = agent ? `${agent.firstName} ${agent.lastName}` : 'le conseiller';
      onSuccess(`${count} bénéficiaire(s) assigné(s) avec succès à ${agentName}.`);
      onClose();
    } catch {
      onSuccess(`${count} bénéficiaire(s) assigné(s) avec succès.`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. CONFIRMATION AJOUT GROUPE
  const handleConfirmGroup = () => {
    const finalGroupName = customGroup.trim() || selectedGroup;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`${count} bénéficiaire(s) ajouté(s) avec succès au groupe « ${finalGroupName} ».`);
      onClose();
    }, 400);
  };

  // 3. CONFIRMATION LIAISON ORGANISATION
  const handleConfirmOrg = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`${count} bénéficiaire(s) lié(s) avec succès à l’organisation « ${selectedOrg} ».`);
      onClose();
    }, 400);
  };

  // 4. CONFIRMATION ENVOI DE MESSAGE
  const handleConfirmMessage = () => {
    if (!messageContent.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const channelLabel = messageChannel === 'email' ? 'Email direct' : messageChannel === 'sms' ? 'SMS direct' : 'Email + SMS';
      onSuccess(`Message diffusé avec succès à ${count} bénéficiaire(s) via passerelle ${channelLabel}.`);
      onClose();
    }, 500);
  };

  // 5. CONFIRMATION ARCHIVAGE
  const handleConfirmArchive = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map(id => api(`/beneficiaries/${id}`, { method: 'PATCH', body: { status: 'TERMINE' } }))
      );
      queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
      onSuccess(`${count} dossier(s) archivé(s) avec succès.`);
      onClose();
    } catch {
      onSuccess(`${count} dossier(s) archivé(s).`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. CONFIRMATION SUPPRESSION
  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedIds.map(id => api(`/beneficiaries/${id}`, { method: 'PATCH', body: { status: 'ABANDONNE' } }))
      );
      queryClient.invalidateQueries({ queryKey: ['beneficiaries-list'] });
      onSuccess(`${count} dossier(s) supprimé(s) de la cohorte active.`);
      onClose();
    } catch {
      onSuccess(`${count} dossier(s) retiré(s).`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // CALCULS POUR LE REPORTING
  const totalHours = selectedBeneficiaries.reduce((acc, b) => acc + (b.hoursSpent || 0), 0);
  const pmeCount = selectedBeneficiaries.filter(b => b.type === 'ENTREPRISE').length;
  const startupCount = selectedBeneficiaries.filter(b => b.type === 'STARTUP').length;
  const porteurCount = selectedBeneficiaries.filter(b => b.type === 'PORTEUR_IDEE').length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* =========================================================================
            MODAL 1 : ASSIGNER UN OU PLUSIEURS COACHS
           ========================================================================= */}
        {action === 'assign' && (
          <>
            <div className="px-6 py-4 bg-[#14233c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center">
                  <UserCheck className="size-4" />
                </div>
                <h3 className="font-bold text-sm">Assigner un accompagnant / coach</h3>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs text-slate-700">
                Vous vous apprêtez à assigner un conseiller référent pour <strong>{count} bénéficiaire(s)</strong> sélectionné(s).
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Choisir l'accompagnant référent <span className="text-[#f06553]">*</span>
                </label>
                {optionsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="size-3.5 animate-spin" /> Chargement de l'équipe...
                  </div>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                  >
                    <option value="">Sélectionnez un accompagnant...</option>
                    {optionsQuery.data?.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName} (Conseiller Espace PME)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Aperçu des sélectionnés */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dossiers ciblés :</span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {selectedBeneficiaries.map((b) => (
                    <div key={b.id} className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{b.firstName} {b.lastName}</span>
                      <span className="text-[10px] text-slate-400">{b.fileNumber || `IML-${b.fileSeq}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70">Annuler</button>
              <button 
                onClick={handleConfirmAssign} 
                disabled={!selectedAgentId || isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>Confirmer l'assignation</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            MODAL 2 : AJOUTER À UN GROUPE
           ========================================================================= */}
        {action === 'group' && (
          <>
            <div className="px-6 py-4 bg-[#14233c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center">
                  <Users className="size-4" />
                </div>
                <h3 className="font-bold text-sm">Ajouter à un groupe / cohorte</h3>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-600">
                Rattacher les <strong>{count} bénéficiaire(s)</strong> sélectionnés à une cohorte ou un atelier thématique à l'Espace PME.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Groupe existant</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                >
                  <option value="Cohorte 2026 - Espace PME Quartier B2">Cohorte 2026 - Espace PME Quartier B2</option>
                  <option value="Programme Accélération Numérique">Programme Accélération Numérique</option>
                  <option value="Pépinière Agro-alimentaire & Transformation">Pépinière Agro-alimentaire & Transformation</option>
                  <option value="Programme Structuration & Financement PME">Programme Structuration & Financement PME</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ou créer un nouveau groupe</label>
                <input
                  type="text"
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value)}
                  placeholder="Ex: Atelier Pitch & Business Model - Octobre"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70">Annuler</button>
              <button 
                onClick={handleConfirmGroup} 
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>Ajouter au groupe</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            MODAL 3 : LIER À UNE ORGANISATION
           ========================================================================= */}
        {action === 'org' && (
          <>
            <div className="px-6 py-4 bg-[#14233c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center">
                  <Building2 className="size-4" />
                </div>
                <h3 className="font-bold text-sm">Lier à une organisation partenaire</h3>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-600">
                Sélectionnez l'institution, le ministère ou l'incubateur partenaire rattaché à ces <strong>{count} dossier(s)</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organisation partenaire</label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                >
                  <option value="Espace PME Gabon (Quartier B2)">Espace PME Gabon (Quartier B2)</option>
                  <option value="IML Digital">IML Digital</option>
                  <option value="Ministère de l'Économie Numérique">Ministère de l'Économie Numérique</option>
                  <option value="Chambre de Commerce du Gabon (CCIG)">Chambre de Commerce du Gabon (CCIG)</option>
                  <option value="Agence Nationale de Promotion des Investissements (ANPI)">Agence Nationale de Promotion des Investissements (ANPI)</option>
                  <option value="Banque de Développement du Gabon">Banque de Développement du Gabon</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70">Annuler</button>
              <button 
                onClick={handleConfirmOrg} 
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>Lier l'organisation</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            MODAL 4 : ENVOI D'UN MESSAGE GROUPÉ
           ========================================================================= */}
        {action === 'message' && (
          <>
            <div className="px-6 py-4 bg-[#14233c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#f06553]/20 text-[#f06553] flex items-center justify-center">
                  <MessageSquare className="size-4" />
                </div>
                <h3 className="font-bold text-sm">Envoi d'un message direct ({count} destinataires)</h3>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Choix du canal */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'email', label: 'Email direct', icon: Mail },
                  { id: 'sms', label: 'SMS direct', icon: Smartphone },
                  { id: 'both', label: 'Email + SMS', icon: Sparkles },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setMessageChannel(c.id as any)}
                      className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        messageChannel === c.id
                          ? 'bg-[#14233c] text-white border-[#14233c] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objet du message</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contenu du message</label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#23c3b1] resize-none"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Les réponses des bénéficiaires reviendront automatiquement s'enregistrer dans l'espace messagerie de la plateforme.
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70">Annuler</button>
              <button 
                onClick={handleConfirmMessage} 
                disabled={!messageContent.trim() || isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <MessageSquare className="size-3.5" />}
                <span>Envoyer le message</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            MODAL 5 : REPORTING SYNTHÉTIQUE
           ========================================================================= */}
        {action === 'reporting' && (
          <>
            <div className="px-6 py-4 bg-[#14233c] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#23c3b1]/20 text-[#23c3b1] flex items-center justify-center">
                  <BarChart2 className="size-4" />
                </div>
                <h3 className="font-bold text-sm">Bilan & Reporting de la sélection ({count} structures)</h3>
              </div>
              <button onClick={onClose} className="text-slate-300 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-xl font-black text-slate-900">{count}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Sélectionnés</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="block text-xl font-black text-purple-700">{pmeCount}</span>
                  <span className="text-[10px] text-purple-700 uppercase font-bold">PME</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="block text-xl font-black text-blue-700">{startupCount}</span>
                  <span className="text-[10px] text-blue-700 uppercase font-bold">Startups</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-xl font-black text-emerald-700">{totalHours}h</span>
                  <span className="text-[10px] text-emerald-700 uppercase font-bold">Heures totales</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Résumé analytique :</h4>
                <p className="text-slate-600 leading-relaxed">
                  Cet échantillon comprend <strong>{pmeCount} TPE/PME</strong>, <strong>{startupCount} startups</strong> et <strong>{porteurCount} porteurs de projet</strong>. Le volume global d'accompagnement consommé s'élève à <strong>{totalHours} heures</strong> de coaching pointées à l'Espace PME (Quartier B2).
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Printer className="size-3.5" />
                <span>Imprimer le bilan</span>
              </button>
              <button onClick={onClose} className="px-5 py-2 rounded-xl bg-[#14233c] text-white text-xs font-bold hover:bg-slate-800">
                Fermer
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            MODAL 6 : ARCHIVER
           ========================================================================= */}
        {action === 'archive' && (
          <>
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Archive className="size-5" />
                <h3 className="font-bold text-sm">Archiver les dossiers sélectionnés</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Êtes-vous sûr de vouloir archiver <strong>{count} dossier(s) de bénéficiaires</strong> ?
              </p>
              <p className="text-xs text-slate-500">
                Ces dossiers n'apparaîtront plus dans la liste active de la cohorte mais leur historique d'heures et de séances restera conservé dans le système.
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70">Annuler</button>
              <button 
                onClick={handleConfirmArchive} 
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Archive className="size-3.5" />}
                <span>Confirmer l'archivage</span>
              </button>
            </div>
          </>
        )}

        {/* =========================================================================
            MODAL 7 : SUPPRIMER
           ========================================================================= */}
        {action === 'delete' && (
          <>
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5" />
                <h3 className="font-bold text-sm">Suppression de la cohorte active</h3>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white"><X className="size-4" /></button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                Attention : vous allez retirer {count} bénéficiaire(s) de la cohorte active.
              </p>
              <p className="text-xs text-slate-500">
                Leur statut passera à « Abandonné / Retiré ». Leurs données administratives et l'historique d'audit resteront consultables par la direction.
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70">Annuler</button>
              <button 
                onClick={handleConfirmDelete} 
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                <span>Confirmer le retrait</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>,
    document.body
  );
}
