import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Building2, 
  Pencil, 
  Trash2, 
  X, 
  CheckCircle2, 
  BookOpen,
  ExternalLink,
  Eye
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

interface FollowUpNote {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  companyName: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  coachName: string;
  date: string;
  topic: string;
  content: string;
  nextSteps: string;
  priority: 'HAUTE' | 'NORMALE' | 'BASSE';
}

const DEFAULT_NOTES: FollowUpNote[] = [
  {
    id: 'note-1',
    beneficiaryId: 'b-1',
    beneficiaryName: 'Sylvie NDONG',
    companyName: 'EcoGabon SARL',
    beneficiaryPhone: '+241 65 30 11 22',
    beneficiaryEmail: 'sylvie.ndong@ecogabon.ga',
    coachName: 'Alexandre AGENT IML',
    date: '2026-10-14',
    topic: 'Finance & Trésorerie',
    content: 'Revue complète des charges d’exploitation du trimestre. Sylvie a clarifié les coûts logistiques liés au transport des déchets plastiques. Le besoin en fonds de roulement estimé à 12M FCFA est cohérent.',
    nextSteps: 'Finaliser le tableau des flux de trésorerie prévisionnel avant le 20 octobre pour dépôt chez BGFIBank.',
    priority: 'HAUTE'
  },
  {
    id: 'note-2',
    beneficiaryId: 'b-2',
    beneficiaryName: 'Jean-Marc OBIANG',
    companyName: 'Kamba Tech',
    beneficiaryPhone: '+241 77 12 45 89',
    beneficiaryEmail: 'jm.obiang@kambatech.ga',
    coachName: 'Dr. Guy Roger MBOUMBA',
    date: '2026-10-13',
    topic: 'Stratégie & Produit',
    content: 'Point d’étape sur le déploiement de la version bêta de la solution ERP. 4 entreprises pilotes testent actuellement le logiciel à Libreville et Port-Gentil. Retours très positifs sur l’interface.',
    nextSteps: 'Préparer la grille tarifaire pour le passage en phase commerciale et formaliser le contrat de maintenance.',
    priority: 'NORMALE'
  },
  {
    id: 'note-3',
    beneficiaryId: 'b-3',
    beneficiaryName: 'Marcelle BIVEGHE',
    companyName: 'AgriBio Gabon Coopérative',
    beneficiaryPhone: '+241 62 88 90 14',
    beneficiaryEmail: 'contact@agrobiogabon.com',
    coachName: 'Sarah BILOGHE',
    date: '2026-10-11',
    topic: 'Organisation & Gouvernance',
    content: 'Structuration du bureau de la coopérative agricole. Tenue de l’assemblée générale constitutive validée par les 8 membres fondateurs. Répartition claire des responsabilités entre production et commercialisation.',
    nextSteps: 'Déposer le procès-verbal d’AG et les statuts enregistrés auprès de la Direction Générale des PME (DGPME).',
    priority: 'NORMALE'
  },
  {
    id: 'note-4',
    beneficiaryId: 'b-4',
    beneficiaryName: 'Paul MVE',
    companyName: 'BTP Gabon Services',
    beneficiaryPhone: '+241 66 44 22 11',
    beneficiaryEmail: 'p.mve@btpgabon.ga',
    coachName: 'Alexandre AGENT IML',
    date: '2026-10-09',
    topic: 'Commercial & Marchés Publics',
    content: 'Accompagnement au montage du premier dossier de réponse à un appel d’offres public pour la rénovation de voiries urbaines. Tous les quitus fiscaux et CNSS sont à jour.',
    nextSteps: 'Vérifier la caution bancaire de soumission avant le dépôt officiel de l’offre le 18 octobre.',
    priority: 'HAUTE'
  }
];

export default function FollowUpNotesPage() {
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterMyNotes, setFilterMyNotes] = useState(false);

  // Notes locales persistantes
  const [notes, setNotes] = useState<FollowUpNote[]>(() => {
    try {
      const saved = localStorage.getItem('iml_followup_notes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  // Modal d'édition
  const [editingNote, setEditingNote] = useState<FollowUpNote | null>(null);

  // Modal de consultation du détail de la note
  const [viewingNote, setViewingNote] = useState<FollowUpNote | null>(null);

  // Formulaire nouvelle note
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newTopic, setNewTopic] = useState('Stratégie & Gouvernance');
  const [newContent, setNewContent] = useState('');
  const [newNextSteps, setNewNextSteps] = useState('');
  const [newPriority, setNewPriority] = useState<'HAUTE' | 'NORMALE' | 'BASSE'>('NORMALE');

  // Bénéficiaires depuis l'API pour faciliter la sélection
  const { data: bRes } = useQuery({ 
    queryKey: ['beneficiaries-list'], 
    queryFn: () => api<{ items: any[]; total: number }>('/beneficiaries?pageSize=100') 
  });
  const beneficiaries = bRes?.items || [];

  // Sauvegarde
  const saveNotes = (updated: FollowUpNote[]) => {
    setNotes(updated);
    try {
      localStorage.setItem('iml_followup_notes_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Suppression
  const handleDeleteNote = (id: string) => {
    if (window.confirm("Confirmez-vous la suppression de cette note de suivi ?")) {
      const filtered = notes.filter(n => n.id !== id);
      saveNotes(filtered);
    }
  };

  // Création
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeneficiaryName.trim() || !newContent.trim()) return;

    const authorName = user ? `${user.firstName} ${user.lastName}` : 'Dr. Guy Roger MBOUMBA';

    const newNote: FollowUpNote = {
      id: `note-${Date.now()}`,
      beneficiaryId: `b-${Date.now()}`,
      beneficiaryName: newBeneficiaryName.trim(),
      companyName: newCompanyName.trim() || 'Projet d\'entreprise',
      coachName: authorName,
      date: new Date().toISOString().split('T')[0],
      topic: newTopic,
      content: newContent.trim(),
      nextSteps: newNextSteps.trim(),
      priority: newPriority
    };

    saveNotes([newNote, ...notes]);
    setIsAddModalOpen(false);
    setNewBeneficiaryName('');
    setNewCompanyName('');
    setNewContent('');
    setNewNextSteps('');
  };

  // Mise à jour
  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    const updated = notes.map(n => n.id === editingNote.id ? editingNote : n);
    saveNotes(updated);
    setEditingNote(null);
  };

  // Filtrage
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = 
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        n.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        n.companyName.toLowerCase().includes(search.toLowerCase()) ||
        n.topic.toLowerCase().includes(search.toLowerCase()) ||
        n.coachName.toLowerCase().includes(search.toLowerCase());

      const matchTopic = topicFilter === 'ALL' || n.topic === topicFilter;

      const matchCoach = !filterMyNotes ||
        (user?.lastName && n.coachName.toLowerCase().includes(user.lastName.toLowerCase())) ||
        (user?.firstName && n.coachName.toLowerCase().includes(user.firstName.toLowerCase())) ||
        n.coachName.toLowerCase().includes('guy') ||
        n.coachName.toLowerCase().includes('sarah') ||
        n.coachName.toLowerCase().includes('coach');

      return matchSearch && matchTopic && matchCoach;
    });
  }, [notes, search, topicFilter, filterMyNotes, user]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in-up font-sans text-slate-800">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/15 text-[#23c3b1] flex items-center justify-center">
              <BookOpen className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isCoach ? "Journal de Mentorat & Notes d'Accompagnement" : "Notes de Suivi & Journal d'Accompagnement"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCoach
              ? "Comptes-rendus de mentorat, observations et engagements convenus lors de vos entretiens d'accompagnement."
              : "Comptes-rendus d'entretien, observations de coaching et engagements convenus avec les entrepreneurs."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isCoach && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMyNotes(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !filterMyNotes ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Toutes les notes
              </button>
              <button
                type="button"
                onClick={() => setFilterMyNotes(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterMyNotes ? 'bg-[#23c3b1] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mes notes rédigées
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>{isCoach ? "Rédiger un compte-rendu" : "Rédiger une note de suivi"}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Notes rédigées
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {notes.length}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Historique consolidé</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Bénéficiaires actifs
          </span>
          <div className="text-2xl font-bold text-teal-700 mt-1">
            {new Set(notes.map(n => n.beneficiaryName)).size}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Suivis en temps réel</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Actions prioritaires
          </span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {notes.filter(n => n.priority === 'HAUTE').length}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">À contrôler d'urgence</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Coaches contributeurs
          </span>
          <div className="text-2xl font-bold text-[#101f2e] mt-1">
            {new Set(notes.map(n => n.coachName)).size}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Équipe d'experts</span>
        </div>
      </div>

      {/* 3. RECHERCHE & FILTRES */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par contenu, bénéficiaire, entreprise, thématique..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Thématique :</span>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Toutes les thématiques</option>
            <option value="Finance & Trésorerie">Finance & Trésorerie</option>
            <option value="Stratégie & Produit">Stratégie & Produit</option>
            <option value="Organisation & Gouvernance">Organisation & Gouvernance</option>
            <option value="Commercial & Marchés Publics">Commercial & Marchés Publics</option>
          </select>
        </div>
      </div>

      {/* 4. LISTE DES NOTES DE SUIVI */}
      <div className="space-y-3.5">
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-2xs">
            <BookOpen className="size-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="font-medium text-slate-600">Aucune note de suivi trouvée</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Rédigez un nouveau mémo pour enrichir le carnet d'accompagnement.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            return (
              <div key={note.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-teal-300 transition-colors">
                
                {/* Ligne 1 : Date, Priorité, Thématique et Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-200">
                      {note.topic}
                    </span>
                    {note.priority === 'HAUTE' && (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                        Priorité Haute
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" />
                      {new Date(note.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions directes : Détail de la note, Modifier, Supprimer */}
                  <div className="flex items-center gap-1.5">

                    {/* Détail de la note */}
                    <button
                      type="button"
                      onClick={() => setViewingNote(note)}
                      title="Consulter le détail de la note"
                      className="size-7 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="size-3.5" />
                    </button>

                    {/* Modifier */}
                    <button
                      type="button"
                      onClick={() => setEditingNote(note)}
                      title="Modifier la note de suivi"
                      className="size-7 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    >
                      <Pencil className="size-3.5" />
                    </button>

                    {/* Supprimer (réservé à l'auteur de la note ou agent) */}
                    {(!isCoach || (user?.lastName && note.coachName.toLowerCase().includes(user.lastName.toLowerCase()))) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Supprimer la note"
                        className="size-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Acteurs concernés */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <Link
                    to={`/beneficiaires/${note.beneficiaryId}`}
                    title={`Consulter la fiche bénéficiaire de ${note.beneficiaryName}`}
                    className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-[#178578] transition-colors group cursor-pointer"
                  >
                    <User className="size-3.5 text-slate-400 group-hover:text-[#178578]" />
                    <span className="group-hover:underline">{note.beneficiaryName}</span>
                  </Link>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building2 className="size-3.5 text-slate-400" />
                    <span>{note.companyName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-[11px] ml-auto">
                    <span>Rédigé par : <strong>{note.coachName}</strong></span>
                  </div>
                </div>

                {/* Ligne 3 : Synthèse de la note */}
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  {note.content}
                </div>

                {/* Ligne 4 : Prochaines étapes */}
                {note.nextSteps && (
                  <div className="text-xs flex items-start gap-2 pt-1 text-teal-900 bg-teal-50/60 p-2.5 rounded-lg border border-teal-100/70">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[11px] block">Engagements & Prochaines étapes :</span>
                      <p className="mt-0.5 text-slate-700">{note.nextSteps}</p>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* 5. MODALE AJOUTER UNE NOTE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#101f2e] text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Rédiger une note de suivi</h3>
                <p className="text-[11px] text-slate-300">Journal d'accompagnement opérationnel</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bénéficiaire existant (optionnel)</label>
                <select
                  onChange={(e) => {
                    const sel = beneficiaries.find((b: any) => b.id === e.target.value);
                    if (sel) {
                      setNewBeneficiaryName(`${sel.firstName} ${sel.lastName}`);
                      setNewCompanyName(sel.projects?.[0]?.title || 'Entreprise accompagnée');
                    }
                  }}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white mb-2"
                >
                  <option value="">-- Choisir dans la liste des bénéficiaires --</option>
                  {beneficiaries.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom du bénéficiaire *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Sylvie NDONG"
                    value={newBeneficiaryName}
                    onChange={(e) => setNewBeneficiaryName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Entreprise / Projet</label>
                  <input
                    type="text"
                    placeholder="Ex : EcoGabon SARL"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thématique</label>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="Stratégie & Gouvernance">Stratégie & Gouvernance</option>
                    <option value="Finance & Trésorerie">Finance & Trésorerie</option>
                    <option value="Commercial & Vente">Commercial & Vente</option>
                    <option value="Juridique & Légal">Juridique & Légal</option>
                    <option value="Organisation & RH">Organisation & RH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Niveau de priorité</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="HAUTE">Haute (Action critique)</option>
                    <option value="BASSE">Basse (Information)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Compte-rendu & observations de séance *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Notez les points abordés, difficultés identifiées, diagnostic ou progrès constatés..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Actions & engagements à réaliser</label>
                <input
                  type="text"
                  placeholder="Ex : Rédaction des statuts avant le 15, finalisation du prévisionnel..."
                  value={newNextSteps}
                  onChange={(e) => setNewNextSteps(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#23c3b1] hover:bg-[#1fb3a2] text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Publier la note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODALE MODIFIER LA NOTE */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#101f2e] text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Modifier la note de suivi</h3>
                <p className="text-[11px] text-slate-300">
                  {editingNote.beneficiaryName} • {editingNote.companyName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingNote(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateNote} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thématique</label>
                  <input
                    type="text"
                    value={editingNote.topic}
                    onChange={(e) => setEditingNote({ ...editingNote, topic: e.target.value })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priorité</label>
                  <select
                    value={editingNote.priority}
                    onChange={(e) => setEditingNote({ ...editingNote, priority: e.target.value as any })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="HAUTE">Haute</option>
                    <option value="BASSE">Basse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contenu de la note</label>
                <textarea
                  rows={4}
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Actions & engagements</label>
                <input
                  type="text"
                  value={editingNote.nextSteps}
                  onChange={(e) => setEditingNote({ ...editingNote, nextSteps: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#23c3b1] hover:bg-[#1fb3a2] text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODALE DÉTAIL DE LA NOTE DE SUIVI */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Entête sombre exécutif */}
            <div className="px-5 py-4 bg-[#101f2e] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-[#23c3b1]">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Détail de la note de suivi</h3>
                  <p className="text-[11px] text-slate-300">
                    {new Date(viewingNote.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingNote(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Corps du détail */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Badges : Thématique + Priorité */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-200">
                  {viewingNote.topic}
                </span>
                {viewingNote.priority === 'HAUTE' ? (
                  <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                    Priorité Haute
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-slate-50 text-slate-600 font-semibold text-[10px] border border-slate-200">
                    Priorité {viewingNote.priority.toLowerCase()}
                  </span>
                )}
                <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                  <Calendar className="size-3 text-slate-400" />
                  {new Date(viewingNote.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Fiche Bénéficiaire & Rédacteur */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <User className="size-4 text-teal-600" />
                    <span>{viewingNote.beneficiaryName}</span>
                  </div>
                  <Link
                    to={`/beneficiaires/${viewingNote.beneficiaryId}`}
                    className="text-[11px] text-[#178578] hover:text-[#23c3b1] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Fiche bénéficiaire</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3 text-slate-400" />
                    <span className="font-medium">{viewingNote.companyName}</span>
                  </div>
                  <div className="text-slate-400">•</div>
                  <div>
                    Rédigé par : <strong className="text-slate-700">{viewingNote.coachName}</strong>
                  </div>
                </div>
              </div>

              {/* Contenu de la note / Synthèse */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Synthèse de la séance & observations :
                </label>
                <div className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs whitespace-pre-line">
                  {viewingNote.content}
                </div>
              </div>

              {/* Engagements & Prochaines étapes */}
              {viewingNote.nextSteps && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Engagements & Prochaines étapes :
                  </label>
                  <div className="text-xs flex items-start gap-2.5 text-teal-900 bg-teal-50/70 p-3 rounded-xl border border-teal-200/70">
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-slate-700 leading-relaxed">{viewingNote.nextSteps}</p>
                  </div>
                </div>
              )}

              {/* Boutons d'action en bas */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingNote;
                    setViewingNote(null);
                    setEditingNote(toEdit);
                  }}
                  className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Pencil className="size-3.5" />
                  <span>Modifier cette note</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingNote(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
