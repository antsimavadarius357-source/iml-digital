import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw, 
  Pencil, 
  Trash2, 
  FileText, 
  User, 
  Building2, 
  X,
  ExternalLink,
  Eye,
  Download,
  Sparkles,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import IssueCertificateModal from '../certificates/IssueCertificateModal';

interface MilestoneItem {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  companyName: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  pathwayName: string;
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
  deliverableName: string;
  submittedDate: string;
  validatedDate?: string;
  status: 'VALIDE' | 'A_VALIDER' | 'EN_COURS';
  coachName: string;
  feedback?: string;
}

const DEFAULT_MILESTONES: MilestoneItem[] = [
  {
    id: 'm-1',
    beneficiaryId: 'b-1',
    beneficiaryName: 'Sylvie NDONG',
    companyName: 'EcoGabon SARL',
    beneficiaryPhone: '+241 65 30 11 22',
    beneficiaryEmail: 'sylvie.ndong@ecogabon.ga',
    pathwayName: 'Parcours Numérique & Croissance PME',
    stepNumber: 3,
    totalSteps: 5,
    stepTitle: 'Étape 3 : Plan de Financement & Prévisionnel 3 ans',
    deliverableName: 'Business_Plan_EcoGabon_Final_v2.xlsx',
    submittedDate: '2026-10-14',
    status: 'A_VALIDER',
    coachName: 'Alexandre AGENT IML',
    feedback: 'Dossier complet, ratios de rentabilité vérifiés par le pôle financier.'
  },
  {
    id: 'm-2',
    beneficiaryId: 'b-2',
    beneficiaryName: 'Jean-Marc OBIANG',
    companyName: 'Kamba Tech',
    beneficiaryPhone: '+241 77 12 45 89',
    beneficiaryEmail: 'jm.obiang@kambatech.ga',
    pathwayName: 'Parcours Accélération Start-up Tech',
    stepNumber: 4,
    totalSteps: 5,
    stepTitle: 'Étape 4 : Démonstrateur MVP & Premiers Clients Pilotes',
    deliverableName: 'Rapport_Pilotes_ERP_Kamba.pdf',
    submittedDate: '2026-10-12',
    validatedDate: '2026-10-13',
    status: 'VALIDE',
    coachName: 'Dr. Guy Roger MBOUMBA',
    feedback: 'Validation officielle du jalon technique. Prêt pour l’instruction de financement.'
  },
  {
    id: 'm-3',
    beneficiaryId: 'b-3',
    beneficiaryName: 'Marcelle BIVEGHE',
    companyName: 'AgriBio Gabon Coopérative',
    beneficiaryPhone: '+241 62 88 90 14',
    beneficiaryEmail: 'contact@agrobiogabon.com',
    pathwayName: 'Parcours Structuration Agro-Industrie',
    stepNumber: 2,
    totalSteps: 4,
    stepTitle: 'Étape 2 : Statuts de Coopérative & Immatriculation ANPI',
    deliverableName: 'Statuts_Enregistres_AgriBio.pdf',
    submittedDate: '2026-10-11',
    status: 'A_VALIDER',
    coachName: 'Sarah BILOGHE',
    feedback: 'PV de l’AG constitutive conforme, récépissé de dépôt reçu.'
  },
  {
    id: 'm-4',
    beneficiaryId: 'b-4',
    beneficiaryName: 'Paul MVE',
    companyName: 'BTP Gabon Services',
    beneficiaryPhone: '+241 66 44 22 11',
    beneficiaryEmail: 'p.mve@btpgabon.ga',
    pathwayName: 'Parcours Structuration PME',
    stepNumber: 1,
    totalSteps: 4,
    stepTitle: 'Étape 1 : Diagnostic 360° & Plan d’Amélioration',
    deliverableName: 'Fiche_Diagnostic_BTP.pdf',
    submittedDate: '2026-10-06',
    validatedDate: '2026-10-08',
    status: 'VALIDE',
    coachName: 'Alexandre AGENT IML',
    feedback: 'Diagnostic certifié par le coach référent.'
  },
  {
    id: 'm-5',
    beneficiaryId: 'b-5',
    beneficiaryName: 'Aïssatou DIOP',
    companyName: 'Mode & Création Libreville',
    beneficiaryPhone: '+241 74 33 55 77',
    beneficiaryEmail: 'aissatou.mode@gmail.com',
    pathwayName: 'Parcours Amorçage & Idéation',
    stepNumber: 2,
    totalSteps: 4,
    stepTitle: 'Étape 2 : Étude de Marché & Positionnement de Marque',
    deliverableName: 'Enquete_Marche_Mode.docx',
    submittedDate: '2026-10-02',
    status: 'EN_COURS',
    coachName: 'Sarah BILOGHE',
    feedback: 'Enquête terrain en cours auprès de 50 boutiques partenaires.'
  }
];

export default function MilestoneValidationPage() {
  const { user } = useAuth();
  const isCoach = user?.role === 'COACH';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pathwayFilter, setPathwayFilter] = useState('ALL');
  const [filterMyEntrepreneurs, setFilterMyEntrepreneurs] = useState(false);

  // Données persistantes locales
  const [milestones, setMilestones] = useState<MilestoneItem[]>(() => {
    try {
      const saved = localStorage.getItem('iml_milestone_validation_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_MILESTONES;
    } catch {
      return DEFAULT_MILESTONES;
    }
  });

  // Modale d'édition & Modale d'examen/aperçu
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);
  const [previewMilestone, setPreviewMilestone] = useState<MilestoneItem | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [viewerActiveTab, setViewerActiveTab] = useState<'preview' | 'checklist'>('preview');

  // Modale Félicitations & Délivrance d'attestation
  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean;
    beneficiaryName: string;
    beneficiaryId: string;
    companyName: string;
    pathwayName: string;
    totalSteps: number;
  } | null>(null);

  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certBeneficiaryId, setCertBeneficiaryId] = useState<string | undefined>(undefined);

  // Sauvegarde
  const saveMilestones = (updated: MilestoneItem[]) => {
    setMilestones(updated);
    try {
      localStorage.setItem('iml_milestone_validation_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Validation d'une étape
  const handleValidateStep = (id: string, stepTitle: string, bName: string) => {
    let targetMilestone: MilestoneItem | undefined;
    const updated = milestones.map(m => {
      if (m.id === id) {
        targetMilestone = m;
        const valItem: MilestoneItem = {
          ...m,
          status: 'VALIDE' as const,
          validatedDate: new Date().toISOString().split('T')[0],
          feedback: `Étape certifiée et validée avec succès le ${new Date().toLocaleDateString('fr-FR')}.`
        };
        if (previewMilestone && previewMilestone.id === id) {
          setPreviewMilestone(valItem);
        }
        return valItem;
      }
      return m;
    });
    saveMilestones(updated);

    const bId = targetMilestone?.beneficiaryId || '';
    const bMilestones = updated.filter(m => m.beneficiaryId === bId);
    const validatedCount = bMilestones.filter(m => m.status === 'VALIDE').length;
    const isFinished = (targetMilestone && targetMilestone.stepNumber >= targetMilestone.totalSteps) || 
                       (bMilestones.length > 0 && validatedCount === bMilestones.length);

    if (isFinished) {
      setCelebrationModal({
        isOpen: true,
        beneficiaryName: bName,
        beneficiaryId: bId,
        companyName: targetMilestone?.companyName || '',
        pathwayName: targetMilestone?.pathwayName || 'Parcours d\'incubation',
        totalSteps: targetMilestone?.totalSteps || 4
      });
    } else {
      alert(`✓ L'étape « ${stepTitle} » pour ${bName} a été officiellement certifiée et validée !`);
    }
  };

  // Demande de révision
  const handleRequestRevision = (id: string, stepTitle: string, bName: string) => {
    const reason = window.prompt(`Motif de la demande de révision pour « ${stepTitle} » (${bName}) :`, "Livrable à compléter ou pièces justificatives manquantes.");
    if (reason === null) return;

    const updated = milestones.map(m => {
      if (m.id === id) {
        const revItem: MilestoneItem = {
          ...m,
          status: 'EN_COURS' as const,
          feedback: `Demande de révision formulée : ${reason}`
        };
        if (previewMilestone && previewMilestone.id === id) {
          setPreviewMilestone(revItem);
        }
        return revItem;
      }
      return m;
    });
    saveMilestones(updated);
  };

  // Suppression
  const handleDeleteMilestone = (id: string, title: string) => {
    if (window.confirm(`Confirmez-vous la suppression de ce jalon : « ${title} » ?`)) {
      const filtered = milestones.filter(m => m.id !== id);
      saveMilestones(filtered);
    }
  };

  // Sauvegarde après modification
  const handleUpdateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    const updated = milestones.map(m => m.id === editingMilestone.id ? editingMilestone : m);
    saveMilestones(updated);
    setEditingMilestone(null);
  };

  // Filtrage
  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      const matchSearch = 
        m.stepTitle.toLowerCase().includes(search.toLowerCase()) ||
        m.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
        m.companyName.toLowerCase().includes(search.toLowerCase()) ||
        m.pathwayName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchPathway = pathwayFilter === 'ALL' || m.pathwayName.includes(pathwayFilter);

      const matchCoach = !filterMyEntrepreneurs || 
        (user?.lastName && m.coachName.toLowerCase().includes(user.lastName.toLowerCase())) ||
        (user?.firstName && m.coachName.toLowerCase().includes(user.firstName.toLowerCase())) ||
        m.coachName.toLowerCase().includes('guy') ||
        m.coachName.toLowerCase().includes('sarah') ||
        m.coachName.toLowerCase().includes('coach');

      return matchSearch && matchStatus && matchPathway && matchCoach;
    });
  }, [milestones, search, statusFilter, pathwayFilter, filterMyEntrepreneurs, user]);

  // Statistiques
  const validatedCount = useMemo(() => milestones.filter(m => m.status === 'VALIDE').length, [milestones]);
  const toValidateCount = useMemo(() => milestones.filter(m => m.status === 'A_VALIDER').length, [milestones]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in-up font-sans text-slate-800">
      
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/15 text-[#23c3b1] flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Validation des Étapes & Jalons de Parcours
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCoach 
              ? 'Certification des livrables, validation des jalons et accompagnement direct de vos entrepreneurs.' 
              : 'Contrôle qualité, certification des livrables et passage officiel des jalons d\'incubation.'}
          </p>
        </div>

        {isCoach && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMyEntrepreneurs(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !filterMyEntrepreneurs ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Toutes les étapes
            </button>
            <button
              type="button"
              onClick={() => setFilterMyEntrepreneurs(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMyEntrepreneurs ? 'bg-[#23c3b1] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mes entrepreneurs assignés
            </button>
          </div>
        )}
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Jalons certifiés
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {validatedCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Étapes franchies avec succès</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            En attente de validation
          </span>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {toValidateCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Livrables soumis à examiner</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Jalons suivis
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {milestones.length}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Sur l'ensemble des cohortes</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Taux de succès parcours
          </span>
          <div className="text-2xl font-bold text-[#23c3b1] mt-1">
            {Math.round((validatedCount / Math.max(1, milestones.length)) * 100)}%
          </div>
          <span className="text-[10px] text-teal-700 font-medium">Progression globale</span>
        </div>
      </div>

      {/* 3. RECHERCHE ET FILTRES */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par bénéficiaire, entreprise, étape..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#23c3b1]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Statut :</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="A_VALIDER">En attente de validation</option>
            <option value="VALIDE">Validé & Certifié</option>
            <option value="EN_COURS">En cours de rédaction</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Parcours :</span>
          <select
            value={pathwayFilter}
            onChange={(e) => setPathwayFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#23c3b1] cursor-pointer"
          >
            <option value="ALL">Tous les parcours</option>
            <option value="Numérique">Numérique & PME</option>
            <option value="Tech">Start-up Tech</option>
            <option value="Agro-Industrie">Agro-Industrie</option>
            <option value="Amorçage">Amorçage & Idéation</option>
          </select>
        </div>
      </div>

      {/* 4. TABLEAU DE VALIDATION DES ÉTAPES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-700">
              <th className="py-3 px-4">Étape & Livrable associé</th>
              <th className="py-3 px-4">Bénéficiaire / Entreprise</th>
              <th className="py-3 px-4">Modèle de Parcours</th>
              <th className="py-3 px-4">Progression</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4 text-right">Actions & Validation</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredMilestones.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="size-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-600">Aucun jalon d'étape trouvé</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Modifiez vos filtres ou associez des bénéficiaires à un parcours.</p>
                </td>
              </tr>
            ) : (
              filteredMilestones.map((m) => {
                const percent = Math.round((m.stepNumber / m.totalSteps) * 100);

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Étape & Livrable */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setPreviewMilestone(m)}
                        className="font-bold text-slate-900 hover:text-teal-700 text-left transition-colors cursor-pointer block"
                        title="Cliquer pour examiner le jalon et le livrable"
                      >
                        {m.stepTitle}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMilestone(m)}
                        className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 text-[11px] mt-0.5 text-left cursor-pointer transition-colors"
                        title={`Consulter le livrable ${m.deliverableName}`}
                      >
                        <FileText className="size-3 text-teal-600 shrink-0" />
                        <span className="truncate max-w-[200px] font-medium underline decoration-teal-300">{m.deliverableName}</span>
                      </button>
                      {m.feedback && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[240px]">
                          {m.feedback}
                        </div>
                      )}
                    </td>

                    {/* Bénéficiaire */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="size-3 text-slate-400" />
                        <span>{m.beneficiaryName}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Building2 className="size-3 text-slate-400" />
                        <span>{m.companyName}</span>
                      </div>
                    </td>

                    {/* Modèle de parcours */}
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium block">{m.pathwayName}</span>
                      <span className="text-[10px] text-slate-400">Jalon {m.stepNumber} sur {m.totalSteps}</span>
                    </td>

                    {/* Progression */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-[#23c3b1] h-full rounded-full transition-all duration-300" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">{percent}%</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4">
                      {m.status === 'VALIDE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="size-3" /> Validé
                        </span>
                      )}
                      {m.status === 'A_VALIDER' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <AlertCircle className="size-3" /> À valider
                        </span>
                      )}
                      {m.status === 'EN_COURS' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="size-3" /> En cours
                        </span>
                      )}
                    </td>

                        {/* Actions directes & boutons de validation */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">

                        {/* Bouton Examiner le jalon & livrable (remplace la redirection vers le bénéficiaire) */}
                        <button
                          type="button"
                          onClick={() => setPreviewMilestone(m)}
                          title={`Examiner le jalon et le livrable (${m.stepTitle})`}
                          className="size-7 rounded-md bg-slate-100 text-slate-700 hover:bg-[#23c3b1] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                        </button>

                        {/* Bouton Valider l'étape */}
                        {m.status !== 'VALIDE' && (
                          <button
                            type="button"
                            onClick={() => handleValidateStep(m.id, m.stepTitle, m.beneficiaryName)}
                            title="Certifier et valider ce jalon de parcours"
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="size-3" />
                            <span>Valider</span>
                          </button>
                        )}

                        {/* Bouton Demander révision */}
                        {m.status === 'A_VALIDER' && (
                          <button
                            type="button"
                            onClick={() => handleRequestRevision(m.id, m.stepTitle, m.beneficiaryName)}
                            title="Demander des corrections sur le livrable"
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="size-3 text-slate-500" />
                            <span>Révision</span>
                          </button>
                        )}

                        {/* Modifier & Supprimer (réservé coordination / agent) */}
                        {!isCoach && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingMilestone(m)}
                              title="Modifier le jalon"
                              className="size-7 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(m.id, m.stepTitle)}
                              title="Supprimer le jalon"
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

      {/* 5. MODALE MODIFIER LE JALON */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#101f2e] text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Modifier l'étape de parcours</h3>
                <p className="text-[11px] text-slate-300">
                  {editingMilestone.beneficiaryName} • {editingMilestone.companyName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingMilestone(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMilestone} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Intitulé de l'étape / jalon</label>
                <input
                  type="text"
                  required
                  value={editingMilestone.stepTitle}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, stepTitle: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom du livrable associé</label>
                <input
                  type="text"
                  value={editingMilestone.deliverableName}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, deliverableName: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Statut</label>
                  <select
                    value={editingMilestone.status}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, status: e.target.value as any })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none bg-white"
                  >
                    <option value="A_VALIDER">En attente de validation</option>
                    <option value="VALIDE">Validé & Certifié</option>
                    <option value="EN_COURS">En cours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Jalon n°</label>
                  <input
                    type="number"
                    min={1}
                    max={editingMilestone.totalSteps}
                    value={editingMilestone.stepNumber}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, stepNumber: Number(e.target.value) || 1 })}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarques / Feedback du conseiller</label>
                <textarea
                  rows={3}
                  value={editingMilestone.feedback || ''}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, feedback: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-[#23c3b1] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
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

      {/* 6. MODALE EXAMEN DU JALON & LIVRABLE */}
      {previewMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Entête */}
            <div className="px-6 py-4 bg-[#101f2e] text-white flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-[#23c3b1] border border-teal-500/30">
                    Jalon d'étape {previewMilestone.stepNumber} / {previewMilestone.totalSteps}
                  </span>
                  {previewMilestone.status === 'VALIDE' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle className="size-3" /> Validé & Certifié
                    </span>
                  )}
                  {previewMilestone.status === 'A_VALIDER' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      <AlertCircle className="size-3" /> En attente de validation
                    </span>
                  )}
                  {previewMilestone.status === 'EN_COURS' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <Clock className="size-3" /> En cours de traitement
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {previewMilestone.stepTitle}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {previewMilestone.pathwayName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewMilestone(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Carte Bénéficiaire & Entreprise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="size-3 text-slate-400" />
                    <span>Bénéficiaire & Entreprise</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{previewMilestone.beneficiaryName}</div>
                  <div className="text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                    <Building2 className="size-3 text-slate-400" />
                    <span>{previewMilestone.companyName}</span>
                  </div>
                  {previewMilestone.beneficiaryEmail && (
                    <div className="text-[11px] text-slate-500 mt-1">{previewMilestone.beneficiaryEmail}</div>
                  )}
                  {previewMilestone.beneficiaryPhone && (
                    <div className="text-[11px] text-slate-500">{previewMilestone.beneficiaryPhone}</div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3 text-slate-400" />
                    <span>Encadrement & Progression</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="text-slate-400">Conseiller référent : </span>
                    <span className="font-semibold text-slate-900">{previewMilestone.coachName}</span>
                  </div>
                  <div className="text-slate-700 mt-1">
                    <span className="text-slate-400">Date de dépôt : </span>
                    <span className="font-semibold">{new Date(previewMilestone.submittedDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {previewMilestone.validatedDate && (
                    <div className="text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle className="size-3" />
                      <span>Validé le {new Date(previewMilestone.validatedDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progression du parcours</span>
                      <span className="font-bold text-slate-800">{Math.round((previewMilestone.stepNumber / previewMilestone.totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#23c3b1] h-full rounded-full" 
                        style={{ width: `${Math.round((previewMilestone.stepNumber / previewMilestone.totalSteps) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fiche Livrable */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40">
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
                        <span>Livrable soumis</span>
                        <span className="px-1.5 py-0.5 rounded bg-teal-200/60 text-teal-900 text-[9px] font-mono font-bold">
                          {previewMilestone.deliverableName.endsWith('.xlsx') ? 'TABLEUR EXCEL' : 'DOCUMENT PDF'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{previewMilestone.deliverableName}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Document officiel certifiant l'achèvement des objectifs définis pour l'étape {previewMilestone.stepNumber}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setIsDocumentViewerOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#23c3b1] hover:bg-[#1db0a0] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                      title="Consulter et examiner le contenu du document avant certification"
                    >
                      <Eye className="size-4" />
                      <span>Consulter le document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Téléchargement de « ${previewMilestone.deliverableName} » en cours...`)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer transition-colors"
                    >
                      <Download className="size-4 text-teal-700" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Remarques / Feedback */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Avis d'instruction & Feedback du conseiller
                </div>
                {previewMilestone.feedback ? (
                  <p className="text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    « {previewMilestone.feedback} »
                  </p>
                ) : (
                  <p className="text-slate-400 italic text-xs">
                    Aucune remarque pour le moment.
                  </p>
                )}
              </div>

              {/* Décision rapide si à valider */}
              {previewMilestone.status !== 'VALIDE' && (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-amber-900 block text-xs">Validation requise</span>
                    <span className="text-[11px] text-amber-700">Vous pouvez valider directement ce jalon ou solliciter des ajustements.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRequestRevision(previewMilestone.id, previewMilestone.stepTitle, previewMilestone.beneficiaryName)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="size-3 text-slate-500" />
                      <span>Demander révision</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleValidateStep(previewMilestone.id, previewMilestone.stepTitle, previewMilestone.beneficiaryName)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Certifier & Valider</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Pied du modal */}
            <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div>
                <Link
                  to={`/beneficiaires/${previewMilestone.beneficiaryId}`}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="size-3.5 text-slate-400" />
                  <span>Fiche bénéficiaire (dossier)</span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {!isCoach && (
                  <button
                    type="button"
                    onClick={() => {
                      const m = previewMilestone;
                      setPreviewMilestone(null);
                      setEditingMilestone(m);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="size-3.5 text-slate-400" />
                    <span>Modifier</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewMilestone(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VISIONNEUSE DE LIVRABLE & CONTRÔLE D'INSTRUCTION (EXCEL / PDF)
         ========================================================================= */}
      {isDocumentViewerOpen && previewMilestone && (
        <div 
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsDocumentViewerOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête de la visionneuse */}
            <div className="py-3.5 px-6 bg-gradient-to-r from-[#101f2e] via-[#162c42] to-[#102a43] text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-teal-500/20 border border-teal-400/30 text-[#23c3b1] flex items-center justify-center font-mono font-black text-xs shadow-inner">
                  {previewMilestone.deliverableName.endsWith('.xlsx') ? 'XLS' : 'PDF'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base leading-tight">
                      {previewMilestone.deliverableName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                      Livrable Étape {previewMilestone.stepNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                    <span>{previewMilestone.companyName} ({previewMilestone.beneficiaryName})</span>
                    <span>•</span>
                    <span>Déposé le {previewMilestone.submittedDate}</span>
                    <span>•</span>
                    <span>Réf. Conseiller : {previewMilestone.coachName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDocumentViewerOpen(false)}
                className="size-8 rounded-full text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Fermer la visionneuse"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Barre de navigation interne de la visionneuse */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewerActiveTab('preview')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewerActiveTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 text-[#23c3b1]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Aperçu du document PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewerActiveTab('checklist')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewerActiveTab === 'checklist'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 text-[#23c3b1]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="size-3.5" />
                  <span>Critères de conformité & Instruction</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Document PDF vérifié & certifié</span>
              </div>
            </div>

            {/* Corps de la liseuse PDF */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 space-y-5">
              {viewerActiveTab === 'preview' && (
                <div className="space-y-4">
                  {/* Barre d'information du document PDF */}
                  <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{previewMilestone.deliverableName}</span>
                        <span className="text-[11px] text-slate-500">Document numérisé officiel • 1.4 Mo • Déposé par {previewMilestone.companyName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        Page 1 / 6
                      </span>
                    </div>
                  </div>

                  {/* Feuille de lecture PDF (Feuille blanche A4) */}
                  <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border border-slate-200/90 p-8 sm:p-12 space-y-6 text-slate-800 font-sans min-h-[480px]">
                    {/* En-tête officiel du document */}
                    <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#23c3b1]">
                          RÉPUBLIQUE GABONAISE • IML DIGITAL INCUBATEUR
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                          {previewMilestone.stepTitle}
                        </h2>
                        <p className="text-xs text-slate-600 mt-1">
                          Entreprise : <strong className="text-slate-900">{previewMilestone.companyName}</strong> — Porteur : {previewMilestone.beneficiaryName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          PIÈCE JUSTIFICATIVE
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">Dépôt : {previewMilestone.submittedDate}</div>
                      </div>
                    </div>

                    {/* Contenu textuel officiel du document */}
                    <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                          <FileText className="size-4 text-[#23c3b1]" />
                          <span>Objet du document</span>
                        </h3>
                        <p className="text-slate-600 text-xs">
                          Le document ci-joint constitue le livrable officiel requis pour l'étape {previewMilestone.stepNumber} ({previewMilestone.pathwayName}). Il a été soumis par le candidat/bénéficiaire pour instruction et homologation par l'équipe d'accompagnement de l'IML.
                        </p>
                      </div>

                      <div className="space-y-2 pt-1">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          1. Synthèse du contenu transmis
                        </h4>
                        <p className="text-slate-700 text-xs sm:text-sm">
                          L'entrepreneur <strong>{previewMilestone.beneficiaryName}</strong> a finalisé l'ensemble des points d'étape convenus lors des séances avec son conseiller référent (<strong>{previewMilestone.coachName}</strong>). L'argumentaire, les chiffres clés et les pièces justificatives ont été vérifiés conformes aux standards d'incubation IML.
                        </p>
                      </div>

                      <div className="space-y-2 pt-1">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                          2. Avis du conseiller référent
                        </h4>
                        <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950 text-xs font-medium">
                          {previewMilestone.feedback || "Dossier instruit favorablement. Les livrables présentés correspondent aux attentes qualitatives du programme d'accompagnement."}
                        </div>
                      </div>
                    </div>

                    {/* Pied de page du document */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-4">
                      <div>
                        <span className="block font-semibold text-slate-700">Réf. Document :</span>
                        <span>IML-DOC-{previewMilestone.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-semibold text-slate-700">Contrôle de conformité</span>
                        <span className="text-emerald-700 font-bold">✓ Validé conforme par IML Digit</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewerActiveTab === 'checklist' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <ShieldCheck className="size-5 text-[#23c3b1]" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Critères d'homologation & conformité du jalon
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {[
                      { title: "Cohérence des pièces transmises", desc: "Le document PDF déposé est lisible, complet et conforme aux attentes du jalon.", ok: true },
                      { title: "Validation des hypothèses opérationnelles", desc: "Les objectifs fixés lors du cadrage ont été traités avec rigueur.", ok: true },
                      { title: "Avis consultatif du mentor/coach", desc: "Le conseiller référent a émis une recommandation favorable.", ok: true },
                      { title: "Traçabilité et archivage IML", desc: "La pièce est archivée dans le dossier bénéficiaire avec horodatage certifié.", ok: true },
                    ].map((crit, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 text-xs block">{crit.title}</strong>
                          <p className="text-[11px] text-slate-600 mt-0.5">{crit.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pied de la visionneuse avec actions d'instruction directe */}
            <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => alert(`Téléchargement du fichier PDF « ${previewMilestone.deliverableName} »`)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="size-3.5 text-slate-500" />
                <span>Télécharger le PDF</span>
              </button>

              <div className="flex items-center gap-2">
                {previewMilestone.status !== 'VALIDE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDocumentViewerOpen(false);
                        handleRequestRevision(previewMilestone.id, previewMilestone.stepTitle, previewMilestone.beneficiaryName);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="size-3.5 text-slate-500" />
                      <span>Demander révision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDocumentViewerOpen(false);
                        handleValidateStep(previewMilestone.id, previewMilestone.stepTitle, previewMilestone.beneficiaryName);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Certifier & Valider le document</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsDocumentViewerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modale Félicitations & Délivrance d'attestation */}
      {celebrationModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-[#14233c] text-white text-center relative overflow-hidden">
              <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-3xl shadow-inner mb-3">
                🎊
              </div>
              <h2 className="text-2xl font-black tracking-tight">Félicitations 🎊 !</h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
                Toutes les {celebrationModal.totalSteps} étapes du parcours ont été validées avec succès !
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entrepreneur :</span>
                  <span className="font-bold text-slate-900">{celebrationModal.beneficiaryName}</span>
                </div>
                {celebrationModal.companyName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projet / Structure :</span>
                    <span className="font-semibold text-slate-800">{celebrationModal.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Programme :</span>
                  <span className="font-semibold text-teal-800">{celebrationModal.pathwayName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Statut global :</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    100% Certifié & Validé
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 text-center leading-relaxed">
                Le cycle d'accompagnement est complet. Vous pouvez formaliser la réussite de l'entrepreneur en lui délivrant son attestation officielle d'incubation.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCelebrationModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Plus tard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCertBeneficiaryId(celebrationModal.beneficiaryId);
                    setIsCertificateModalOpen(true);
                    setCelebrationModal(null);
                  }}
                  className="flex-2 py-2.5 rounded-xl bg-[#FF5B37] hover:bg-[#e04a27] text-white text-xs font-bold shadow-md shadow-[#FF5B37]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award className="size-4" />
                  <span>Délivrer une attestation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'émission de l'attestation officielle */}
      <IssueCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        defaultBeneficiaryId={certBeneficiaryId}
      />

    </div>
  );
}
