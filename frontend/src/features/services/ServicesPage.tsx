import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pencil, 
  Trash2, 
  FileText,
  User,
  X,
  Building2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import RecordServiceModal from './RecordServiceModal';

interface PrestationItem {
  id: string;
  title: string;
  category: string;
  beneficiaryId: string;
  beneficiaryName: string;
  companyName: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  coachName: string;
  date: string;
  durationMinutes: number;
  status: 'REALISE' | 'EN_COURS' | 'PLANIFIE';
  summary: string;
  deliverable?: string;
}

const DEFAULT_PRESTATIONS: PrestationItem[] = [
  {
    id: 'prest-1',
    title: 'Diagnostic Stratégique & Cadrage 360°',
    category: 'Stratégie & Diagnostic',
    beneficiaryId: 'b-1',
    beneficiaryName: 'Sylvie NDONG',
    companyName: 'EcoGabon SARL',
    beneficiaryPhone: '+241 65 30 11 22',
    beneficiaryEmail: 'sylvie.ndong@ecogabon.ga',
    coachName: 'Alexandre AGENT IML',
    date: '2026-10-14',
    durationMinutes: 120,
    status: 'REALISE',
    summary: 'Analyse approfondie de la chaîne de valeur, forces/faiblesses et identification des leviers de croissance.',
    deliverable: 'Rapport_Diagnostic_360_EcoGabon.pdf'
  },
  {
    id: 'prest-2',
    title: 'Élaboration du Plan d’Affaires & Modèle Financier',
    category: 'Finance & Trésorerie',
    beneficiaryId: 'b-2',
    beneficiaryName: 'Jean-Marc OBIANG',
    companyName: 'Kamba Tech',
    beneficiaryPhone: '+241 77 12 45 89',
    beneficiaryEmail: 'jm.obiang@kambatech.ga',
    coachName: 'Dr. Guy Roger MBOUMBA',
    date: '2026-10-12',
    durationMinutes: 90,
    status: 'REALISE',
    summary: 'Finalisation du compte de résultat prévisionnel sur 3 ans et plan de financement initial pour le comité bancaire.',
    deliverable: 'Business_Plan_KambaTech_v3.xlsx'
  },
  {
    id: 'prest-3',
    title: 'Accompagnement Formalisation Juridique & Statuts ANPI',
    category: 'Juridique & Administratif',
    beneficiaryId: 'b-3',
    beneficiaryName: 'Marcelle BIVEGHE',
    companyName: 'AgriBio Gabon Coopérative',
    beneficiaryPhone: '+241 62 88 90 14',
    beneficiaryEmail: 'contact@agrobiogabon.com',
    coachName: 'Sarah BILOGHE',
    date: '2026-10-10',
    durationMinutes: 60,
    status: 'EN_COURS',
    summary: 'Rédaction des statuts de coopérative agricole et constitution du dossier d’immatriculation au guichet ANPI.',
    deliverable: 'Statuts_Projet_AgriBio.docx'
  },
  {
    id: 'prest-4',
    title: 'Stratégie Commerciale B2B & Prospection Terrain',
    category: 'Commercial & Vente',
    beneficiaryId: 'b-4',
    beneficiaryName: 'Paul MVE',
    companyName: 'BTP Gabon Services',
    beneficiaryPhone: '+241 66 44 22 11',
    beneficiaryEmail: 'p.mve@btpgabon.ga',
    coachName: 'Alexandre AGENT IML',
    date: '2026-10-08',
    durationMinutes: 90,
    status: 'REALISE',
    summary: 'Définition des offres packs entreprises, grille tarifaire et argumentaire commercial pour appels d’offres.',
    deliverable: 'Grille_Tarifaire_Packs_BTP.pdf'
  },
  {
    id: 'prest-5',
    title: 'Mise à niveau Organisationnelle & Gestion RH',
    category: 'Organisation & RH',
    beneficiaryId: 'b-5',
    beneficiaryName: 'Aïssatou DIOP',
    companyName: 'Mode & Création Libreville',
    beneficiaryPhone: '+241 74 33 55 77',
    beneficiaryEmail: 'aissatou.mode@gmail.com',
    coachName: 'Sarah BILOGHE',
    date: '2026-10-05',
    durationMinutes: 60,
    status: 'REALISE',
    summary: 'Fiches de poste, modèle de contrat de travail et organisation des plannings d’ateliers de confection.',
    deliverable: 'Guide_RH_Atelier_2026.pdf'
  }
];

export default function ServicesPage() {
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';
  const queryClient = useQueryClient();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [filterMyPrestations, setFilterMyPrestations] = useState(false);

  // État local persistant des prestations
  const [prestations, setPrestations] = useState<PrestationItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_prestations_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_PRESTATIONS;
    } catch {
      return DEFAULT_PRESTATIONS;
    }
  });

  // Modal d'édition
  const [editingPrestation, setEditingPrestation] = useState<PrestationItem | null>(null);

  // Sauvegarde
  const savePrestations = (updated: PrestationItem[]) => {
    setPrestations(updated);
    try {
      localStorage.setItem('iml_prestations_records_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Suppression
  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Confirmez-vous la suppression de la prestation « ${title} » ?`)) {
      const filtered = prestations.filter(p => p.id !== id);
      savePrestations(filtered);
    }
  };

  // Enregistrement des modifications
  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrestation) return;
    const updated = prestations.map(p => p.id === editingPrestation.id ? editingPrestation : p);
    savePrestations(updated);
    setEditingPrestation(null);
  };

  // Filtrage
  const filteredPrestations = useMemo(() => {
    return prestations.filter(p => {
      const matchSearch = 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        p.companyName.toLowerCase().includes(search.toLowerCase()) ||
        p.coachName.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

      const matchCoach = !filterMyPrestations ||
        (user?.lastName && p.coachName.toLowerCase().includes(user.lastName.toLowerCase())) ||
        (user?.firstName && p.coachName.toLowerCase().includes(user.firstName.toLowerCase())) ||
        p.coachName.toLowerCase().includes('guy') ||
        p.coachName.toLowerCase().includes('sarah') ||
        p.coachName.toLowerCase().includes('coach');

      return matchSearch && matchStatus && matchCategory && matchCoach;
    });
  }, [prestations, search, statusFilter, categoryFilter, filterMyPrestations, user]);

  // Statistiques
  const totalHours = useMemo(() => {
    const mins = prestations.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    return Math.round(mins / 60);
  }, [prestations]);

  const completedCount = useMemo(() => {
    return prestations.filter(p => p.status === 'REALISE').length;
  }, [prestations]);

  const inProgressCount = useMemo(() => {
    return prestations.filter(p => p.status === 'EN_COURS').length;
  }, [prestations]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in-up font-sans text-slate-800">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/15 text-[#23c3b1] flex items-center justify-center">
              <HeartHandshake className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Prestations & Dossiers d'Accompagnement
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCoach 
              ? 'Consultez les séances d\'accompagnement de vos entrepreneurs mentorés et suivez la remise des livrables.'
              : 'Suivi des interventions, diagnostics, coaching technique et heures pointées pour chaque structure.'}
          </p>
        </div>

        {isCoach ? (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMyPrestations(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !filterMyPrestations ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Toutes les prestations
            </button>
            <button
              type="button"
              onClick={() => setFilterMyPrestations(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMyPrestations ? 'bg-[#23c3b1] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mes mentorés assignés
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#23c3b1] hover:bg-[#1fb3a2] text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="size-4" />
            <span>Pointer une prestation</span>
          </button>
        )}
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Prestations totales
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {prestations.length}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Actives sur la plateforme</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Volume d'heures
          </span>
          <div className="text-2xl font-bold text-[#23c3b1] mt-1">
            {totalHours}h
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Heures d'expertise pointées</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Finalisées & Validées
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {completedCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Livrables déposés</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En cours d'exécution
          </span>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {inProgressCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Dossiers en atelier</span>
        </div>
      </div>

      {/* 3. BARRE DE FILTRES ET RECHERCHE */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Champ de recherche */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par prestation, bénéficiaire, entreprise, coach..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
          />
        </div>

        {/* Filtre statut */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="REALISE">Réalisée & Certifiée</option>
            <option value="EN_COURS">En cours d'accompagnement</option>
            <option value="PLANIFIE">Planifiée</option>
          </select>
        </div>

        {/* Filtre catégorie */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Thématique :</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Toutes les thématiques</option>
            <option value="Stratégie & Diagnostic">Stratégie & Diagnostic</option>
            <option value="Finance & Trésorerie">Finance & Trésorerie</option>
            <option value="Juridique & Administratif">Juridique & Administratif</option>
            <option value="Commercial & Vente">Commercial & Vente</option>
            <option value="Organisation & RH">Organisation & RH</option>
          </select>
        </div>

      </div>

      {/* 4. TABLEAU DES PRESTATIONS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-700">
              <th className="py-3 px-4">Prestation & Thématique</th>
              <th className="py-3 px-4">Bénéficiaire / Entreprise</th>
              <th className="py-3 px-4">Conseiller Référent</th>
              <th className="py-3 px-4">Date & Durée</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4 text-right">Actions directes</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredPrestations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <HeartHandshake className="size-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-600">Aucune prestation trouvée</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos critères de recherche ou enregistrez une nouvelle prestation.</p>
                </td>
              </tr>
            ) : (
              filteredPrestations.map((p) => {
                const hoursText = `${Math.floor(p.durationMinutes / 60)}h${p.durationMinutes % 60 > 0 ? `${p.durationMinutes % 60}m` : '00'}`;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Prestation & Thématique */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {p.category}
                        </span>
                        {p.deliverable && (
                          <span className="flex items-center gap-1 text-teal-700 truncate max-w-[140px]" title={p.deliverable}>
                            <FileText className="size-3" />
                            <span className="truncate">{p.deliverable}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Bénéficiaire & Entreprise */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="size-3 text-slate-400" />
                        <span>{p.beneficiaryName}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Building2 className="size-3 text-slate-400" />
                        <span>{p.companyName}</span>
                      </div>
                    </td>

                    {/* Coach */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.coachName}
                    </td>

                    {/* Date & Durée */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="size-3 text-teal-600" />
                        <span>{hoursText}</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4">
                      {p.status === 'REALISE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" /> Réalisée
                        </span>
                      )}
                      {p.status === 'EN_COURS' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="size-3" /> En cours
                        </span>
                      )}
                      {p.status === 'PLANIFIE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="size-3" /> Planifiée
                        </span>
                      )}
                    </td>

                    {/* Actions directes */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user?.role === 'COACH' ? (
                          <Link
                            to={`/beneficiaires/${p.beneficiaryId}`}
                            className="px-2.5 py-1 rounded bg-[#14233c] hover:bg-[#1f355b] text-white flex items-center gap-1 transition-colors text-xs font-bold shadow-2xs"
                            title="Consulter le dossier du bénéficiaire"
                          >
                            <BookOpen className="size-3 text-[#23c3b1]" />
                            <span>Dossier</span>
                          </Link>
                        ) : (
                          <>
                            {/* Modifier */}
                            <button
                              type="button"
                              onClick={() => setEditingPrestation(p)}
                              title="Modifier la prestation"
                              className="size-7 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            {/* Supprimer */}
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.title)}
                              title="Supprimer la prestation"
                              className="size-7 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. MODALE MODIFIER PRESTATION */}
      {editingPrestation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#101f2e] text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Modifier la prestation</h3>
                <p className="text-[11px] text-slate-300">
                  {editingPrestation.beneficiaryName} • {editingPrestation.companyName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingPrestation(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Intitulé de la prestation</label>
                <input
                  type="text"
                  required
                  value={editingPrestation.title}
                  onChange={(e) => setEditingPrestation({ ...editingPrestation, title: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thématique</label>
                  <select
                    value={editingPrestation.category}
                    onChange={(e) => setEditingPrestation({ ...editingPrestation, category: e.target.value })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="Stratégie & Diagnostic">Stratégie & Diagnostic</option>
                    <option value="Finance & Trésorerie">Finance & Trésorerie</option>
                    <option value="Juridique & Administratif">Juridique & Administratif</option>
                    <option value="Commercial & Vente">Commercial & Vente</option>
                    <option value="Organisation & RH">Organisation & RH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Statut</label>
                  <select
                    value={editingPrestation.status}
                    onChange={(e) => setEditingPrestation({ ...editingPrestation, status: e.target.value as any })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="REALISE">Réalisée & Validée</option>
                    <option value="EN_COURS">En cours d'accompagnement</option>
                    <option value="PLANIFIE">Planifiée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={editingPrestation.date}
                    onChange={(e) => setEditingPrestation({ ...editingPrestation, date: e.target.value })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={editingPrestation.durationMinutes}
                    onChange={(e) => setEditingPrestation({ ...editingPrestation, durationMinutes: Number(e.target.value) || 60 })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Compte-rendu & synthèse des travaux</label>
                <textarea
                  rows={3}
                  value={editingPrestation.summary}
                  onChange={(e) => setEditingPrestation({ ...editingPrestation, summary: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPrestation(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium"
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

      {/* 6. MODALE GLOBALE D'ENREGISTREMENT */}
      <RecordServiceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => {
          setIsRecordModalOpen(false);
          // Invalidation pour recharger
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }}
      />

    </div>
  );
}
