import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  User as UserIcon, 
  Crown, 
  Edit3, 
  ToggleRight, 
  ToggleLeft,
  Trash2, 
  Key, 
  Check, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSetBreadcrumbs } from '../../components/layout/AppBreadcrumb';

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Onglet actif
  const [activeTab, setActiveTab] = useState<'beneficiaires' | 'historique' | 'presentation'>('beneficiaires');

  // Recherche dans les bénéficiaires
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts (actifs)');
  const [orgFilter, setOrgFilter] = useState('Toutes les organisations');
  const [langFilter, setLangFilter] = useState('Toutes les langues');
  const [groupFilter, setGroupFilter] = useState('Tous les groupes');

  // Colonnes visibles
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    nom: true,
    statut: true,
    etape: true,
    derniereAction: true,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // État d'envoi d'e-mail d'accès
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  // Données du coach résolues dynamiquement par identifiant
  const currentCoach = useMemo(() => {
    try {
      const saved = localStorage.getItem('iml_coaches_only_v2');
      if (saved) {
        const list = JSON.parse(saved);
        const found = list.find((c: any) => c.id === id || c.email === id);
        if (found) return found;
      }
    } catch {}
    return {
      id: id || 'coach-darius',
      name: 'DARIUS COACH IML',
      email: 'coach@imldigit.com',
      role: 'COACH',
      roleLabel: "Coach Référent & Mentor",
      language: 'Français',
      timezone: 'Africa/Libreville (UTC 1:00)',
      categories: 'Start-ups, PME, Entreprises & Organisations',
      isActive: true,
    };
  }, [id]);

  const [coachName, setCoachName] = useState(currentCoach.name);
  const [coachEmail, setCoachEmail] = useState(currentCoach.email);
  const [timezone, setTimezone] = useState(currentCoach.timezone || 'Africa/Libreville (UTC 1:00)');
  const [categories, setCategories] = useState(currentCoach.categories || 'Start-ups, PME, Entreprises & Organisations');
  const [isActive, setIsActive] = useState<boolean>(currentCoach.isActive !== false);

  // 2. Bouton de gauche : Modale Modifier
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentCoach.name);
  const [editEmail, setEditEmail] = useState(currentCoach.email);
  const [editTimezone, setEditTimezone] = useState(currentCoach.timezone || 'Africa/Libreville (UTC 1:00)');
  const [editCategories, setEditCategories] = useState(currentCoach.categories || 'Start-ups, PME, Entreprises & Organisations');

  // Synchronisation lors du changement de coach
  useEffect(() => {
    setCoachName(currentCoach.name);
    setCoachEmail(currentCoach.email);
    setTimezone(currentCoach.timezone || 'Africa/Libreville (UTC 1:00)');
    setCategories(currentCoach.categories || 'Start-ups, PME, Entreprises & Organisations');
    setIsActive(currentCoach.isActive !== false);
    setEditName(currentCoach.name);
    setEditEmail(currentCoach.email);
    setEditTimezone(currentCoach.timezone || 'Africa/Libreville (UTC 1:00)');
    setEditCategories(currentCoach.categories || 'Start-ups, PME, Entreprises & Organisations');
  }, [currentCoach]);

  // 3. Bouton de droite : Modale Supprimer
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Gestion de l'activation / désactivation du coach avec persistance
  const handleToggleActive = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    try {
      const saved = localStorage.getItem('iml_coaches_only_v2');
      if (saved) {
        const list = JSON.parse(saved);
        const idx = list.findIndex((c: any) => c.id === id || c.email === coachEmail);
        if (idx !== -1) {
          list[idx].isActive = nextState;
          localStorage.setItem('iml_coaches_only_v2', JSON.stringify(list));
        }
      }
    } catch {}
    if (nextState) {
      showToast('✓ Le compte du coach a été réactivé avec succès');
    } else {
      showToast('⚠ Le compte du coach a été désactivé');
    }
  };

  // Gestion de l'enregistrement des modifications du profil
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;
    const updatedName = editName.trim().toUpperCase();
    const updatedEmail = editEmail.trim().toLowerCase();
    const updatedTimezone = editTimezone.trim();
    const updatedCategories = editCategories.trim();

    setCoachName(updatedName);
    setCoachEmail(updatedEmail);
    setTimezone(updatedTimezone);
    setCategories(updatedCategories);

    try {
      const saved = localStorage.getItem('iml_coaches_only_v2');
      let list = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((c: any) => c.id === id || c.email === coachEmail);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          name: updatedName,
          email: updatedEmail,
          timezone: updatedTimezone,
          categories: updatedCategories,
        };
      } else {
        list.push({
          id: id || `coach-${Date.now()}`,
          name: updatedName,
          email: updatedEmail,
          role: 'COACH',
          roleLabel: "Coach Référent & Mentor",
          language: 'Français',
          createdAt: new Date().toLocaleDateString('fr-FR'),
          activeBeneficiariesCount: 4,
          groupsCount: 1,
          lastLogin: "Aujourd'hui",
          timezone: updatedTimezone,
          categories: updatedCategories,
          isActive: true
        });
      }
      localStorage.setItem('iml_coaches_only_v2', JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }

    setIsEditModalOpen(false);
    showToast('✓ Informations du coach modifiées avec succès');
  };

  // Gestion de la suppression du coach avec persistance et retour à /coachs
  const handleDeleteCoach = () => {
    try {
      const saved = localStorage.getItem('iml_coaches_only_v2');
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter((c: any) => c.id !== id && c.email !== coachEmail);
        localStorage.setItem('iml_coaches_only_v2', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error(err);
    }

    setIsDeleteModalOpen(false);
    showToast('✓ Le profil du coach a été supprimé');
    setTimeout(() => {
      navigate('/coachs');
    }, 300);
  };

  // -------------------------------------------------------------------------
  // Onglet : Historique de temps
  // -------------------------------------------------------------------------
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  interface PrestationItem {
    id: string;
    date: string;
    beneficiaryName: string;
    duration: string;
    project: string;
    pathway: string;
    company: string;
    description: string;
  }

  const [localPrestations, setLocalPrestations] = useState<PrestationItem[]>([]);

  // Requête API pour les rendez-vous / prestations
  const { data: appointmentsRes } = useQuery({
    queryKey: ['appointments-coach-history', user?.id],
    queryFn: () => api<{ items: any[] }>('/appointments').catch(() => ({ items: [] })),
  });

  // Transformation des RDV / sessions en prestations
  const allPrestations = useMemo<PrestationItem[]>(() => {
    const apiItems: PrestationItem[] = (appointmentsRes?.items || []).map((appt: any) => {
      const d = new Date(appt.datetime);
      const hours = Math.floor(appt.duration / 60);
      const mins = appt.duration % 60;
      const durationStr = `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : hours === 0 ? '0m' : ''}`.trim();
      return {
        id: appt.id,
        date: d.toLocaleDateString('fr-FR'),
        beneficiaryName: appt.beneficiary ? `${appt.beneficiary.firstName} ${appt.beneficiary.lastName}` : 'Marine LOUPE',
        duration: durationStr || '1h 00m',
        project: 'Projet emploi',
        pathway: appt.session?.nextActions?.replace('Parcours: ', '') || "Création d'entreprise",
        company: 'IML Digit',
        description: appt.session?.summary || appt.location || "Session d'accompagnement"
      };
    });
    return [...localPrestations, ...apiItems];
  }, [appointmentsRes, localPrestations]);

  // Filtrage par date Du / Au
  const filteredPrestations = useMemo(() => {
    return allPrestations.filter(p => {
      if (historyStartDate.trim() && !p.date.includes(historyStartDate.trim())) return false;
      if (historyEndDate.trim() && !p.date.includes(historyEndDate.trim())) return false;
      return true;
    });
  }, [allPrestations, historyStartDate, historyEndDate]);

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = "Date;Bénéficiaire;Durée;Projet emploi;Parcours;Société;Description\n";
    const rows = (filteredPrestations.length > 0 ? filteredPrestations : [
      {
        id: '1',
        date: new Date().toLocaleDateString('fr-FR'),
        beneficiaryName: 'Marine LOUPE',
        duration: '1h 30m',
        project: 'BioTech Solutions',
        pathway: "Création d'entreprise (Start-up)",
        company: 'BioTech Solutions',
        description: 'Session de cadrage initial et business model'
      },
      {
        id: '2',
        date: new Date().toLocaleDateString('fr-FR'),
        beneficiaryName: 'SOPHIATECH GABON',
        duration: '2h 00m',
        project: 'Optimisation opérationnelle',
        pathway: "Développement PME",
        company: 'Sophiatech Gabon SARL',
        description: 'Audit organisationnel, financier et plan de restructuration'
      },
      {
        id: '3',
        date: new Date().toLocaleDateString('fr-FR'),
        beneficiaryName: 'COOPÉRATIVE AGRI-GABON',
        duration: '1h 45m',
        project: 'Structuration filière agricole',
        pathway: "Accompagnement Organisation",
        company: 'Fédération Agricole & Développement',
        description: 'Cadrage de gouvernance et modèle de gestion collective'
      }
    ]).map(p => `"${p.date}";"${p.beneficiaryName}";"${p.duration}";"${p.project}";"${p.pathway}";"${p.company}";"${p.description}"`).join('\n');
    
    const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `feuille_prestations_${coachName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Export des prestations téléchargé (format CSV)');
  };

  const handleDeletePrestation = (pId: string) => {
    setLocalPrestations(prev => prev.filter(p => p.id !== pId));
    showToast('✓ Prestation supprimée de la liste');
  };

  const handleFilterPrestations = () => {
    showToast(`✓ Filtre appliqué : ${filteredPrestations.length} prestation(s) trouvée(s)`);
  };

  // Bénéficiaires & structures attribués à ce coach (Start-up, PME, Entreprises & Organisations)
  interface CoachBeneficiaryItem {
    id: string;
    name: string;
    entityType: 'STARTUP' | 'PME' | 'ORGANISATION' | 'ENTREPRISE';
    entityTypeLabel: string;
    company: string;
    country: string;
    language: string;
    status: string;
    step: string;
    lastAction: string;
  }

  const [coachBeneficiaries] = useState<CoachBeneficiaryItem[]>([
    {
      id: 'aac47994-4788-4561-9697-d5a1d9eec49c',
      name: 'Marine LOUPE',
      entityType: 'STARTUP',
      entityTypeLabel: 'Start-up',
      company: 'BioTech Solutions',
      country: 'FR',
      language: 'Français',
      status: 'En attente de parcours',
      step: '0/0',
      lastAction: 'Aucune'
    },
    {
      id: 'b14946a3-7339-4eb9-90b2-1279e9bd9143',
      name: 'SOPHIATECH GABON',
      entityType: 'PME',
      entityTypeLabel: 'PME',
      company: 'Sophiatech Gabon SARL',
      country: 'GA',
      language: 'Français',
      status: 'En cours',
      step: '3/6',
      lastAction: 'Diagnostic opérationnel & restructuration'
    },
    {
      id: 'c50f48c6-1d36-4e23-b75f-e68ef3cb250b',
      name: 'COOPÉRATIVE AGRI-GABON',
      entityType: 'ORGANISATION',
      entityTypeLabel: 'Organisation',
      company: 'Fédération Agricole & Développement',
      country: 'GA',
      language: 'Français',
      status: 'En cours',
      step: '2/5',
      lastAction: 'Structuration gouvernance & modèle collectif'
    },
    {
      id: 'a2303e05-8a37-4ffc-b789-8cc5b89679e5',
      name: 'LOGISTIQUE EQUATORIALE',
      entityType: 'ENTREPRISE',
      entityTypeLabel: 'Entreprise',
      company: 'Logistique Équatoriale SA',
      country: 'GA',
      language: 'Français',
      status: 'En cours',
      step: '4/6',
      lastAction: 'Validation stratégie de croissance'
    }
  ]);

  const filteredBeneficiaries = useMemo(() => {
    let result = [...coachBeneficiaries];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.name.toLowerCase().includes(q) || 
        b.company.toLowerCase().includes(q) || 
        b.entityTypeLabel.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'Tous les statuts (actifs)') {
      result = result.filter(b => b.status === statusFilter);
    }
    if (orgFilter !== 'Toutes les organisations') {
      result = result.filter(b => b.company === orgFilter || b.entityTypeLabel === orgFilter);
    }
    if (langFilter !== 'Toutes les langues') {
      result = result.filter(b => b.language === langFilter);
    }
    return result;
  }, [coachBeneficiaries, searchTerm, statusFilter, orgFilter, langFilter]);

  const handleResendEmail = () => {
    setEmailSentNotice(true);
    setTimeout(() => setEmailSentNotice(false), 3000);
  };

  // Enregistrement des miettes pour le fil d'Ariane global
  useSetBreadcrumbs([
    { label: 'Coachs', to: '/coachs', icon: Users },
    { label: coachName, icon: UserIcon }
  ]);

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 pb-12">

      {/* =========================================================================
          2. CORPS PRINCIPAL : COLONNE GAUCHE (PROFIL) + COLONNE DROITE (ONGLETS)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* -----------------------------------------------------------------------
            A. COLONNE GAUCHE (3 Cartes : Fiche coach, Informations, Accès)
           ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          
          {/* Carte 1 : Identité du coach & boutons d'action */}
          <div className="bg-white rounded-md border border-slate-200 p-6 flex flex-col items-center text-center shadow-2xs">
            
            {/* Grand avatar circulaire avec couronne dorée */}
            <div className="relative mb-4">
              <div className="size-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <UserIcon className="size-10 text-slate-600 stroke-[1.5]" />
              </div>
              <div className="absolute top-0 right-0 size-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                <Crown className="size-3.5 text-white fill-white" />
              </div>
            </div>

            {/* Nom & Email */}
            <h2 className="text-base font-medium text-slate-800 tracking-tight">
              {coachName}
            </h2>
            <p className="text-xs text-[#f06553] hover:underline cursor-pointer truncate max-w-full mt-1">
              {coachEmail}
            </p>

            {/* Statut badge */}
            <div className="mt-2">
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Compte actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="size-1.5 rounded-full bg-rose-500"></span>
                  Compte désactivé
                </span>
              )}
            </div>

            {/* Rangée de 3 boutons d'actions carrés */}
            <div className="flex items-center justify-center gap-2.5 mt-4">
              {/* Bouton 1 : Édition (corail plein) */}
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(true)}
                title="Modifier le coach"
                className="size-8 rounded bg-[#f06553] hover:bg-[#e05341] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="size-4" />
              </button>

              {/* Bouton 2 : Toggle statut actif / inactif (du milieu) */}
              <button 
                type="button" 
                onClick={handleToggleActive}
                title={isActive ? "Désactiver le compte de ce coach" : "Activer le compte de ce coach"}
                className={`size-8 rounded flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer ${
                  isActive 
                    ? 'bg-[#f06553] hover:bg-[#e05341] text-white' 
                    : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                }`}
              >
                {isActive ? (
                  <ToggleRight className="size-4" />
                ) : (
                  <ToggleLeft className="size-4" />
                )}
              </button>

              {/* Bouton 3 : Corbeille (fond blanc, bordure corail) */}
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(true)}
                title="Supprimer ce coach"
                className="size-8 rounded bg-white hover:bg-red-50 text-[#f06553] border border-[#f06553] flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

          </div>

          {/* Carte 2 : Informations générales */}
          <div className="bg-white rounded-md border border-slate-200 p-5 space-y-3.5 shadow-2xs text-xs">
            <h3 className="text-sm font-normal text-slate-800 border-b border-slate-100 pb-2">
              Informations générales
            </h3>
            
            <div>
              <p className="text-slate-400 text-[11px]">Fuseau horaire</p>
              <p className="text-slate-700 font-medium mt-0.5">{timezone}</p>
            </div>

            <div>
              <p className="text-slate-400 text-[11px]">Catégories</p>
              <p className="text-slate-700 font-medium mt-0.5">{categories}</p>
            </div>
          </div>

          {/* Carte 3 : Accès */}
          <div className="bg-white rounded-md border border-slate-200 p-5 space-y-3 shadow-2xs text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 font-normal">
              <Key className="size-3.5 text-[#23c3b1]" />
              <span className="text-sm">Accès</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600">E-mail d'accès</span>
              <span className="inline-flex items-center gap-1 text-slate-600 font-normal">
                <span>Envoyé</span>
                <Check className="size-3.5 text-[#23c3b1] stroke-[2.5]" />
              </span>
            </div>

            <button
              type="button"
              onClick={handleResendEmail}
              className="w-full py-1.5 px-3 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal shadow-2xs transition-colors cursor-pointer mt-1"
            >
              Envoyer de nouveau
            </button>

            {emailSentNotice && (
              <p className="text-[11px] text-emerald-600 text-center animate-in fade-in">
                ✓ E-mail d'accès renvoyé avec succès
              </p>
            )}
          </div>

        </div>

        {/* -----------------------------------------------------------------------
            B. COLONNE DROITE : BARRE D'ONGLETS SOMBRE + CONTENU
           ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-md border border-slate-200 overflow-hidden shadow-2xs">
          
          {/* Barre d'onglets bleu ardoise foncé (exactement comme sur votre capture) */}
          <div className="bg-[#1e3347] flex items-center border-b border-[#182a3a]">
            
            {/* Onglet 1 : Bénéficiaires */}
            <button
              type="button"
              onClick={() => setActiveTab('beneficiaires')}
              className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
                activeTab === 'beneficiaires'
                  ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Bénéficiaires
            </button>

            {/* Onglet 2 : Historique de temps */}
            <button
              type="button"
              onClick={() => setActiveTab('historique')}
              className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
                activeTab === 'historique'
                  ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Historique de temps
            </button>

            {/* Onglet 3 : Présentation */}
            <button
              type="button"
              onClick={() => setActiveTab('presentation')}
              className={`px-6 py-3 text-xs font-normal transition-colors cursor-pointer ${
                activeTab === 'presentation'
                  ? 'bg-[#2a455f] text-[#23c3b1] border-b-2 border-[#23c3b1]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Présentation
            </button>

          </div>

          {/* =====================================================================
              CONTENU DE L'ONGLET 1 : BÉNÉFICIAIRES
             ===================================================================== */}
          {activeTab === 'beneficiaires' && (
            <div className="p-4 sm:p-5 space-y-3.5">
              
              {/* Badge pastille turquoise "Coach principal : 4 actifs (Start-ups, PME, Entreprises & Organisations)" */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-normal bg-[#23c3b1] text-white">
                  Coach principal : {filteredBeneficiaries.length} actif{filteredBeneficiaries.length > 1 ? 's' : ''} (Start-ups, PME, Entreprises & Organisations)
                </span>
              </div>

              {/* Ligne de contrôle 1 : Colonnes ⌄ à gauche | Recherche + Pagination 1 / 1 < > à droite */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                
                {/* Colonnes dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                    className="w-40 px-3 py-1.5 rounded border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Colonnes</span>
                    <ChevronDown className="size-3.5 text-slate-600" />
                  </button>

                  {isColumnsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-md shadow-xl z-30 p-2 space-y-1 text-xs">
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.nom}
                          onChange={(e) => setVisibleColumns(c => ({ ...c, nom: e.target.checked }))}
                          className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                        />
                        <span>Nom & Structure</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.statut}
                          onChange={(e) => setVisibleColumns(c => ({ ...c, statut: e.target.checked }))}
                          className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                        />
                        <span>Statut</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.etape}
                          onChange={(e) => setVisibleColumns(c => ({ ...c, etape: e.target.checked }))}
                          className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                        />
                        <span>Etape</span>
                      </label>
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.derniereAction}
                          onChange={(e) => setVisibleColumns(c => ({ ...c, derniereAction: e.target.checked }))}
                          className="rounded text-[#23c3b1] focus:ring-[#23c3b1]"
                        />
                        <span>Dernière action</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Recherche + Pagination compacte */}
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="size-3.5 text-[#23c3b1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Rechercher bénéficiaire, PME, orga..."
                      className="w-48 sm:w-60 pl-8 pr-3 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#23c3b1]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-600">
                    <span>1 / 1</span>
                    <button
                      type="button"
                      disabled
                      className="size-6 rounded bg-slate-200/80 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-not-allowed"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled
                      className="size-6 rounded bg-slate-200/80 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-not-allowed"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Ligne de contrôle 2 : Barre de filtres déroulants */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                
                {/* Statut */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 pr-7 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                  >
                    <option value="Tous les statuts (actifs)">Tous les statuts (actifs)</option>
                    <option value="En attente de parcours">En attente de parcours</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                  <ChevronDown className="size-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Organisations & Types d'entités */}
                <div className="relative">
                  <select
                    value={orgFilter}
                    onChange={(e) => setOrgFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 pr-7 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                  >
                    <option value="Toutes les organisations">Toutes les structures & organisations</option>
                    <option value="BioTech Solutions">BioTech Solutions (Start-up)</option>
                    <option value="Sophiatech Gabon SARL">Sophiatech Gabon SARL (PME)</option>
                    <option value="Fédération Agricole & Développement">Fédération Agricole (Organisation)</option>
                    <option value="Logistique Équatoriale SA">Logistique Équatoriale SA (Entreprise)</option>
                    <option value="Start-up">Filtrer par type : Start-ups</option>
                    <option value="PME">Filtrer par type : PME</option>
                    <option value="Organisation">Filtrer par type : Organisations</option>
                    <option value="Entreprise">Filtrer par type : Entreprises</option>
                  </select>
                  <ChevronDown className="size-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Langues */}
                <div className="relative">
                  <select
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 pr-7 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                  >
                    <option value="Toutes les langues">Toutes les langues</option>
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                  </select>
                  <ChevronDown className="size-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Groupes */}
                <div className="relative">
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 pr-7 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                  >
                    <option value="Tous les groupes">Tous les groupes</option>
                    <option value="Promotion Alpha">Promotion Alpha</option>
                  </select>
                  <ChevronDown className="size-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

              </div>

              {/* TABLE DES BÉNÉFICIAIRES & STRUCTURES DU COACH */}
              <div className="rounded border border-slate-200 overflow-hidden overflow-x-auto min-h-[140px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-normal text-slate-600 bg-slate-50/70">
                      {visibleColumns.nom && (
                        <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[240px]">
                          Nom & Structure
                        </th>
                      )}
                      {visibleColumns.statut && (
                        <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[120px]">
                          Statut
                        </th>
                      )}
                      {visibleColumns.etape && (
                        <th className="py-2.5 px-3 font-normal text-slate-700 border-r border-slate-200 min-w-[80px]">
                          Etape
                        </th>
                      )}
                      {visibleColumns.derniereAction && (
                        <th className="py-2.5 px-3 font-normal text-slate-700 min-w-[160px]">
                          Dernière action
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredBeneficiaries.map((b) => (
                      <tr 
                        key={b.id} 
                        onClick={() => navigate(`/beneficiaires/${b.id}`)}
                        className="transition-colors hover:bg-slate-50 cursor-pointer"
                      >
                        {visibleColumns.nom && (
                          <td className="py-2.5 px-3 font-normal text-slate-800 border-r border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-800">{b.name}</span>
                                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                                      b.entityType === 'PME' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : b.entityType === 'ORGANISATION'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : b.entityType === 'ENTREPRISE'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}>
                                      {b.entityTypeLabel}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 block">{b.company}</span>
                                </div>
                              </div>
                              <ChevronRight className="size-3.5 text-slate-800 stroke-[2.5] shrink-0" />
                            </div>
                          </td>
                        )}

                        {visibleColumns.statut && (
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">
                            <span className={`inline-block text-[11px] font-medium ${
                              b.status === 'En attente de parcours' ? 'text-[#f06553]' : 'text-emerald-600'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        )}

                        {visibleColumns.etape && (
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 font-medium">
                            {b.step}
                          </td>
                        )}

                        {visibleColumns.derniereAction && (
                          <td className="py-2.5 px-3 text-slate-600">
                            {b.lastAction}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pied de tableau : Afficher 20 ⌄ | 1 / 1 < > */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Afficher</span>
                  <div className="relative">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="appearance-none bg-white border border-slate-200 rounded px-2 py-0.5 pr-5 text-xs text-slate-700 focus:outline-none focus:border-[#23c3b1] cursor-pointer"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <ChevronDown className="size-3 text-[#f06553] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span>{page} / 1</span>
                  <button
                    type="button"
                    disabled
                    className="size-6 rounded bg-slate-200/80 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-not-allowed"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="size-6 rounded bg-slate-200/80 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-not-allowed"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* =====================================================================
              CONTENU DE L'ONGLET 2 : HISTORIQUE DE TEMPS
             ===================================================================== */}
          {activeTab === 'historique' && (
            <div className="space-y-0">
              
              {/* 1. Zone supérieure de commandes (Filtres dates à gauche, Boutons d'action à droite) */}
              <div className="bg-[#f8fafc] p-4 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  
                  {/* Gauche : Filtres Du / Au / Bouton Filtrer */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Du</span>
                      <input
                        type="text"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                        placeholder="Ex : 00/00/..."
                        className="w-28 h-7 px-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f06553] shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Au</span>
                      <input
                        type="text"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                        placeholder="Ex : 00/00/..."
                        className="w-28 h-7 px-2.5 bg-white rounded border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#f06553] shadow-2xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleFilterPrestations}
                      className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Filter className="size-3 fill-white" />
                      <span>Filtrer</span>
                    </button>
                  </div>

                  {/* Droite : Bouton Exporter */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="h-7 px-3.5 rounded bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-normal flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Exporter l'historique (CSV)</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* 2. Zone inférieure : Tableau d'historique */}
              <div className="p-4 sm:p-5 space-y-3 bg-white">

                {/* Tableau de pointage */}
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-xs text-left border-collapse bg-white">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 font-medium">
                        <th className="py-2.5 px-3 border-r border-slate-200">Date</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Bénéficiaire</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Dur...</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Projet empl</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Parcours</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Soc...</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Description</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrestations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-normal">
                            Aucun temps enregistré pour ce bénéficiaire actuellement
                          </td>
                        </tr>
                      ) : (
                        filteredPrestations.map((p) => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{p.date}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap border-r border-slate-100">{p.beneficiaryName}</td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{p.duration}</td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{p.project}</td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{p.pathway}</td>
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap border-r border-slate-100">{p.company}</td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate border-r border-slate-100" title={p.description}>{p.description}</td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeletePrestation(p.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                title="Supprimer cette prestation"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* =====================================================================
              CONTENU DE L'ONGLET 3 : PRÉSENTATION & DOMAINES D'ACCOMPAGNEMENT
             ===================================================================== */}
          {activeTab === 'presentation' && (
            <div className="p-6 text-xs text-slate-600 space-y-5">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-[#23c3b1]" />
                  Biographie & Rôle d'Accompagnateur
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Coach d'accompagnement et consultant opérationnel chez IML Digit. Intervient auprès d'un large éventail de structures : <strong>start-ups et porteurs de projet</strong>, <strong>PME</strong>, <strong>entreprises en croissance</strong> et <strong>organisations / coopératives / associations</strong>. Assure le suivi direct, les diagnostics stratégiques, le cadrage de gouvernance, l'animation des séances et la validation certifiée des jalons de parcours.
                </p>
              </div>

              {/* 3 Cartes de spécialités selon le type de structure */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                
                {/* Carte 1 : PME & Entreprises */}
                <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                    <span className="size-2 rounded-full bg-blue-500"></span>
                    <span>PME & Entreprises</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Diagnostic 360°, restructuration opérationnelle, plans de trésorerie, digitalisation des processus et optimisation de rentabilité.
                  </p>
                </div>

                {/* Carte 2 : Organisations & Coopératives */}
                <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                    <span className="size-2 rounded-full bg-emerald-500"></span>
                    <span>Organisations & Coopératives</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Structuration de la gouvernance, projets collectifs et filières, modèle économique d'intérêt général et mesure d'impact.
                  </p>
                </div>

                {/* Carte 3 : Start-ups & Créateurs */}
                <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                    <span className="size-2 rounded-full bg-purple-500"></span>
                    <span>Start-ups & Amorçage</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Validation du modèle économique, cadrage du MVP, étude d'adéquation marché, recherche de financements et jalons d'incubation.
                  </p>
                </div>

              </div>

              {/* Compétences clés */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Domaines d'expertise :</span>
                {['Audit & Diagnostic', 'Accompagnement PME', 'Structuration Coopérative', 'Business Planning', 'Management Opérationnel', 'Validation de Jalons'].map((tag) => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* =========================================================================
          3. MODALE D'ÉDITION DU COACH (BOUTON DE GAUCHE ✏️)
         ========================================================================= */}
      {isEditModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-[#f06553]/10 text-[#f06553] flex items-center justify-center">
                  <Edit3 className="size-4" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Modifier le profil du coach
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="size-7 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Nom complet <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-slate-200 focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] outline-hidden text-slate-800 text-xs transition-colors"
                  placeholder="Ex : ALEXANDRE AGENT IML"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Adresse email <span className="text-[#f06553]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-slate-200 focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] outline-hidden text-slate-800 text-xs transition-colors"
                  placeholder="coach@imldigit.com"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Fuseau horaire
                </label>
                <input
                  type="text"
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-slate-200 focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] outline-hidden text-slate-800 text-xs transition-colors"
                  placeholder="Ex : Africa/Libreville (UTC 1:00)"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Catégories / Spécialités
                </label>
                <input
                  type="text"
                  value={editCategories}
                  onChange={(e) => setEditCategories(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-slate-200 focus:border-[#f06553] focus:ring-1 focus:ring-[#f06553] outline-hidden text-slate-800 text-xs transition-colors"
                  placeholder="Start-ups, PME, Entreprises & Organisations..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-8 px-4 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-[#f06553] hover:bg-[#e05341] text-white font-medium shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          4. MODALE DE SUPPRESSION DU COACH (BOUTON DE DROITE 🗑️)
         ========================================================================= */}
      {isDeleteModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-slate-800 text-sm">
                    Supprimer le profil de ce coach ?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Êtes-vous certain de vouloir supprimer le profil de <span className="font-semibold text-slate-700">{coachName}</span> ? Cette action retirera le coach de l'équipe et réassignera ses bénéficiaires.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="h-8 px-4 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCoach}
                  className="h-8 px-4 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  <span>Supprimer définitivement</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          5. TOAST NOTIFICATION FLOTTANT
         ========================================================================= */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[80] animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#23c3b1] animate-ping" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
}
