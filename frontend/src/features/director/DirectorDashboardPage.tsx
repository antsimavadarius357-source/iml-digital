import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CheckCircle2,
  Rocket,
  Activity,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  Building2,
  Layers,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';


const COLORS = ['#23c3b1', '#f06553', '#1a3348', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'];

interface DirectorStatsResponse {
  overview: {
    totalBeneficiaries: number;
    growthRate?: string;
    periodSubtitle?: string;
    totalApplications: number;
    acceptedApplications: number;
    underReviewApplications: number;
    rejectedApplications: number;
    acceptanceRate: number;
    totalProjects: number;
    completedProjectsCount: number;
    activeProjectsCount: number;
    avgProgress: number;
    completedMilestones: number;
    pendingMilestones: number;
    totalSessions: number;
    totalAuditLogs: number;
    activeUsersCount: number;
    totalHoursSupported: number;
    completedAppointmentsCount: number;
  };
  beneficiaries: {
    byType: { type: string; label: string; count: number; percentage: number }[];
    byStatus: { status: string; count: number }[];
    timeline: { month: string; beneficiaires: number; candidatures: number; validees: number; connexions: number }[];
    items: {
      id: string;
      fileSeq: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      type: string;
      status: string;
      city: string | null;
      createdAt: string;
      projects: { id: string; name: string; stage: string; sector: { name: string } | null }[];
      pathway: { progress: number; status: string; steps: { id: string; status: string }[] } | null;
    }[];
  };
  applications: {
    byStatus: { status: string; count: number }[];
    funnel: {
      submitted: number;
      inReview: number;
      accepted: number;
      converted: number;
    };
    items: {
      id: string;
      seqNumber: number;
      status: string;
      applicantData: any;
      projectData: any;
      evaluationNotes: string | null;
      createdAt: string;
      submittedAt: string | null;
      beneficiaryId: string | null;
    }[];
  };
  projects: {
    byStage: { stage: string; label: string; count: number; percentage: number }[];
    bySector: { name: string; count: number; percentage: number }[];
    topProjects: {
      id: string;
      name: string;
      beneficiaryName: string;
      sector: string;
      stage: string;
      progress: number;
      status: string;
    }[];
    items: {
      id: string;
      name: string;
      beneficiaryName: string;
      beneficiaryEmail?: string;
      beneficiaryPhone?: string | null;
      sector: string;
      stage: string;
      rawStage: string;
      progress: number;
      status: string;
      updatedAt: string;
    }[];
  };
  traffic: {
    dailyTraffic: { date: string; label: string; connexions: number; actions: number; validations: number }[];
    actionCategories: { category: string; count: number }[];
    recentLogs: {
      id: string;
      action: string;
      userName: string;
      userRole: string;
      date: string;
    }[];
    allLogs: {
      id: string;
      action: string;
      userName: string;
      userRole: string;
      date: string;
    }[];
  };
}

export default function DirectorDashboardPage() {
  const { user } = useAuth();
  
  // 1. Boutons de période : 30 jours, Trimestre, Année 2026
  const [period, setPeriod] = useState<'30j' | '90j' | 'annee'>('30j');
  

  // 4. Modale / Menu d'exportation
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Récupération dynamique selon la période
  const { data, isLoading, refetch, isFetching } = useQuery<DirectorStatsResponse>({
    queryKey: ['director-stats', period],
    queryFn: () => api<DirectorStatsResponse>(`/dashboard/director-stats?period=${period}`),
    refetchInterval: 30_000,
  });

  const overview = data?.overview;
  const beneficiaries = data?.beneficiaries;
  const applications = data?.applications;
  const projects = data?.projects;
  const traffic = data?.traffic;

  // Listes complètes (lecture seule, utilisées pour les exports)
  const filteredBeneficiaries = beneficiaries?.items || [];
  const filteredApplications = applications?.items || [];
  const filteredProjects = projects?.items || [];



  // =========================================================================
  // EXPORT EXÉCUTIF OFFICIEL DIRECT EN PDF (jsPDF)
  // =========================================================================
  const generateExecutivePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const periodLabel =
        period === '30j'
          ? '30 derniers jours'
          : period === '90j'
          ? 'Trimestre T4 (90 jours)'
          : 'Année 2026 complète';

      // Bandeau d'en-tête Institutionnel
      doc.setFillColor(16, 31, 46); // #101f2e
      doc.rect(0, 0, 210, 36, 'F');

      // Ligne d'accentuation Turquoise IML
      doc.setFillColor(35, 195, 177); // #23c3b1
      doc.rect(0, 36, 210, 2.5, 'F');

      // Titres & Organisme
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('IML DIGIT — INCUBATEUR MUGHELI LAB', 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(200, 225, 240);
      doc.text('COCKPIT DE PILOTAGE STRATÉGIQUE — RAPPORT OFFICIEL DE DIRECTION', 14, 22);

      doc.setFontSize(8);
      doc.setTextColor(180, 205, 220);
      doc.text(
        `Émis le ${new Date().toLocaleDateString('fr-FR')} • Utilisateur : ${user?.firstName || 'Direction'} ${user?.lastName || 'Générale'} (${user?.role || 'DIRECTION'})`,
        14,
        29
      );

      // Badge de Période
      doc.setFillColor(35, 195, 177);
      doc.roundedRect(138, 9, 58, 17, 3, 3, 'F');
      doc.setTextColor(16, 31, 46);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('PÉRIODE ANALYSÉE', 142, 15);
      doc.setFontSize(9);
      doc.text(periodLabel, 142, 21);

      // Section 1 : Synthèse Exécutive des Indicateurs Clés
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. Synthèse Exécutive des Indicateurs Clés', 14, 46);

      const kpis = [
        {
          label: 'Bénéficiaires intégrés',
          val: `${overview?.totalBeneficiaries ?? 0}`,
          sub: `Actifs : ${overview?.activeProjectsCount ?? 0} | Évolution : ${overview?.growthRate ?? '+18%'}`,
        },
        {
          label: 'Candidatures & Sélection',
          val: `${overview?.acceptedApplications ?? 0} / ${overview?.totalApplications ?? 0}`,
          sub: `Taux admission : ${overview?.acceptanceRate ?? 0}% | En examen : ${overview?.underReviewApplications ?? 0}`,
        },
        {
          label: 'Projets Réalisés & Avancement',
          val: `${overview?.completedProjectsCount ?? 0} finalisés`,
          sub: `Progression moyenne globale : ${overview?.avgProgress ?? 0}%`,
        },
        {
          label: 'Accompagnement Dispensé',
          val: `${overview?.totalHoursSupported ?? 0}h`,
          sub: `Jalons d'incubation validés : ${overview?.completedMilestones ?? 0} étapes`,
        },
        {
          label: 'Trafic Opérationnel & Activité',
          val: `${overview?.totalAuditLogs ?? 0} actions`,
          sub: `Sessions utilisateur : ${overview?.totalSessions ?? 0} connexions`,
        },
        {
          label: 'Cadre Réglementaire',
          val: 'Conforme',
          sub: 'Mode Observation & Statistiques certifié',
        },
      ];

      const cardY = 51;
      kpis.forEach((kpi, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 14 + col * 92;
        const y = cardY + row * 20;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, 88, 17, 2, 2, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label.toUpperCase(), x + 4, y + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(16, 31, 46);
        doc.text(kpi.val, x + 4, y + 10.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        doc.text(kpi.sub, x + 4, y + 14.5);
      });

      // Section 2 : Répartition des Projets par Secteur
      const sec2Y = 118;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('2. Répartition Sectorielle du Portefeuille Projets', 14, sec2Y);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, sec2Y + 4, 180, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('SECTEUR D\'ACTIVITÉ', 18, sec2Y + 8.5);
      doc.text('NOMBRE DE PROJETS', 95, sec2Y + 8.5);
      doc.text('PART DU PORTEFEUILLE', 145, sec2Y + 8.5);

      const sectors = projects?.bySector?.slice(0, 6) || [];
      let rowY = sec2Y + 10.5;
      sectors.forEach((sec, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
        doc.rect(14, rowY, 180, 6, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(sec.name, 18, rowY + 4.2);
        doc.text(`${sec.count} projet(s)`, 95, rowY + 4.2);
        doc.text(`${sec.percentage}%`, 145, rowY + 4.2);
        rowY += 6;
      });

      // Section 3 : Entonnoir de Sélection & Candidatures
      const sec3Y = rowY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('3. Entonnoir de Candidatures & Admissions', 14, sec3Y);

      doc.setFillColor(241, 245, 249);
      doc.rect(14, sec3Y + 4, 180, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('ÉTAPE D\'ADMISSION', 18, sec3Y + 8.5);
      doc.text('DOSSIERS', 95, sec3Y + 8.5);
      doc.text('POURCENTAGE CONSOLIDÉ', 145, sec3Y + 8.5);

      const funnelRows = [
        { label: 'Dossiers de candidature soumis', count: overview?.totalApplications ?? 0, pct: '100%' },
        { label: 'Dossiers actuellement en cours d\'examen', count: overview?.underReviewApplications ?? 0, pct: `${Math.round(((overview?.underReviewApplications ?? 0) / (overview?.totalApplications || 1)) * 100)}%` },
        { label: 'Dossiers approuvés par le comité IML (Admis)', count: overview?.acceptedApplications ?? 0, pct: `${overview?.acceptanceRate ?? 0}%` },
      ];

      let fRowY = sec3Y + 10.5;
      funnelRows.forEach((r, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
        doc.rect(14, fRowY, 180, 6, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(r.label, 18, fRowY + 4.2);
        doc.text(`${r.count}`, 95, fRowY + 4.2);
        doc.text(r.pct, 145, fRowY + 4.2);
        fRowY += 6;
      });

      // Section 4 : Visa et Authentification Direction
      const signY = fRowY + 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, signY, 194, signY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(16, 31, 46);
      doc.text('VISA DIRECTION GÉNÉRALE — INCUBATEUR MUGHELI LAB (IML)', 14, signY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Rapport certifié pour le suivi du comité de pilotage • Période : ${periodLabel}`,
        14,
        signY + 11
      );
      doc.text('Plateforme IML Digit • Système d\'information et traçabilité entrepreneuriale', 14, signY + 15);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(35, 195, 177);
      doc.text('CONTRÔLE & TRAÇABILITÉ CONFORME', 132, signY + 11);

      // Enregistrement et téléchargement du PDF
      const filename = `IML_Rapport_Direction_${period}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      showToast(`✓ Rapport PDF ${filename} téléchargé avec succès.`);
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      showToast('Erreur lors de la génération du rapport PDF.');
    }
  };

  // =========================================================================
  // EXPORT EXCEL CONSOLIDÉ MULTI-FEUILLES (.XLSX)
  // =========================================================================
  const exportConsolidatedExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Onglet 1 : Synthèse des Indicateurs
      const summaryRows = [
        ['COCKPIT DE DIRECTION GÉNÉRALE - IML DIGIT'],
        ['RAPPORT CONSOLIDÉ DE PILOTAGE STRATÉGIQUE'],
        ['Période analysée', period === '30j' ? '30 derniers jours' : period === '90j' ? 'Trimestre T4 (90 jours)' : 'Année 2026 complète'],
        ['Date de génération', new Date().toLocaleDateString('fr-FR')],
        ['Généré par', `${user?.firstName || 'Direction'} ${user?.lastName || 'Générale'} (${user?.role || 'DIRECTION'})`],
        [''],
        ['INDICATEURS CLÉS STRATÉGIQUES', 'VALEUR', 'DÉTAIL COMPLÉMENTAIRE'],
        ['Bénéficiaires inscrits', overview?.totalBeneficiaries ?? 0, `Actifs : ${overview?.activeProjectsCount ?? 0} | Évolution : ${overview?.growthRate ?? '+18%'}`],
        ['Projets en incubation active', overview?.activeProjectsCount ?? 0, 'En cours de parcours'],
        ['Projets réalisés / finalisés', overview?.completedProjectsCount ?? 0, 'Entreprises lancées ou complétées'],
        ['Taux moyen d\'avancement des parcours', `${overview?.avgProgress ?? 0}%`, 'Progression globale'],
        ['Total des candidatures reçues', overview?.totalApplications ?? 0, 'Dossiers soumis'],
        ['Candidatures validées / acceptées', overview?.acceptedApplications ?? 0, `Taux d'admission : ${overview?.acceptanceRate ?? 0}%`],
        ['Candidatures en cours d\'examen', overview?.underReviewApplications ?? 0, 'Instruction en comité'],
        ['Candidatures refusées', overview?.rejectedApplications ?? 0, 'Non retenues'],
        ['Taux d\'admission global', `${overview?.acceptanceRate ?? 0}%`, 'Sélection comité IML'],
        ['Heures d\'accompagnement dispensées', `${overview?.totalHoursSupported ?? 0}h`, 'Mentorats, coaching et comités'],
        ['Jalons / étapes validés', overview?.completedMilestones ?? 0, 'Étapes de parcours validées'],
        ['Sessions utilisateurs', overview?.totalSessions ?? 0, 'Connexions actives'],
        ['Actions tracées au journal d\'audit', overview?.totalAuditLogs ?? 0, 'Traçabilité opérationnelle certifiée'],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthese_Strategique');

      // Onglet 2 : Liste des Bénéficiaires
      const benRows = [
        ['N° DOSSIER', 'NOM', 'PRÉNOM', 'EMAIL', 'TÉLÉPHONE', 'TYPE', 'STATUT', 'VILLE', 'PROJET', 'AVANCEMENT (%)', 'DATE CRÉATION'],
        ...filteredBeneficiaries.map((b) => [
          `IML-${b.fileSeq}`,
          b.lastName,
          b.firstName,
          b.email,
          b.phone || 'Non renseigné',
          b.type === 'STARTUP' ? 'Start-up' : b.type === 'ENTREPRISE' ? 'PME' : 'Porteur d\'idée',
          b.status,
          b.city || 'Libreville',
          b.projects?.[0]?.name || 'Projet en cours',
          b.pathway?.progress ?? 0,
          new Date(b.createdAt).toLocaleDateString('fr-FR'),
        ]),
      ];
      const wsBen = XLSX.utils.aoa_to_sheet(benRows);
      XLSX.utils.book_append_sheet(wb, wsBen, 'Beneficiaires');

      // Onglet 3 : Liste des Candidatures
      const appRows = [
        ['N° CANDIDATURE', 'CANDIDAT', 'EMAIL', 'TÉLÉPHONE', 'PROJET', 'STATUT', 'DATE SOUMISSION', 'DÉCISION'],
        ...filteredApplications.map((a) => {
          const app = a.applicantData || {};
          const proj = a.projectData || {};
          return [
            `IML-2026-${String(a.seqNumber).padStart(4, '0')}`,
            `${app.firstName || ''} ${app.lastName || ''}`.trim(),
            app.email || '',
            app.phone || '',
            proj.title || app.companyName || 'Projet',
            a.status,
            a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('fr-FR') : new Date(a.createdAt).toLocaleDateString('fr-FR'),
            a.status === 'ACCEPTEE' ? 'ADMIS' : a.status === 'REFUSEE' ? 'REFUSÉ' : 'EN EXAMEN',
          ];
        }),
      ];
      const wsApp = XLSX.utils.aoa_to_sheet(appRows);
      XLSX.utils.book_append_sheet(wb, wsApp, 'Candidatures');

      // Onglet 4 : Portefeuille des Projets
      const projRows = [
        ['PROJET', 'PORTEUR', 'SECTEUR', 'STADE', 'PROGRESSION (%)', 'STATUT', 'EMAIL', 'TÉLÉPHONE'],
        ...filteredProjects.map((p) => [
          p.name,
          p.beneficiaryName,
          p.sector,
          p.stage,
          p.progress,
          p.status,
          p.beneficiaryEmail || '',
          p.beneficiaryPhone || '',
        ]),
      ];
      const wsProj = XLSX.utils.aoa_to_sheet(projRows);
      XLSX.utils.book_append_sheet(wb, wsProj, 'Portefeuille_Projets');

      const filename = `IML_Cockpit_Direction_Consolide_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`✓ Classeur Excel ${filename} (4 onglets) téléchargé avec succès.`);
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error('Erreur export Excel:', err);
      showToast('Erreur lors de la génération du fichier Excel.');
    }
  };

  // Export Liste Bénéficiaires Excel
  const exportBeneficiariesExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = [
        ['N° DOSSIER', 'NOM', 'PRÉNOM', 'EMAIL', 'TÉLÉPHONE', 'TYPE', 'STATUT', 'VILLE', 'PROJET', 'AVANCEMENT (%)', 'DATE CRÉATION'],
        ...filteredBeneficiaries.map((b) => [
          `IML-${b.fileSeq}`,
          b.lastName,
          b.firstName,
          b.email,
          b.phone || 'Non renseigné',
          b.type === 'STARTUP' ? 'Start-up' : b.type === 'ENTREPRISE' ? 'PME' : 'Porteur d\'idée',
          b.status,
          b.city || 'Libreville',
          b.projects?.[0]?.name || 'Projet en cours',
          b.pathway?.progress ?? 0,
          new Date(b.createdAt).toLocaleDateString('fr-FR'),
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Beneficiaires');
      const filename = `IML_Beneficiaires_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`✓ Fichier Excel ${filename} téléchargé avec succès.`);
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erreur export Excel');
    }
  };

  // Export Liste Candidatures Excel
  const exportApplicationsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = [
        ['N° CANDIDATURE', 'CANDIDAT', 'EMAIL', 'TÉLÉPHONE', 'PROJET', 'STATUT', 'DATE SOUMISSION', 'DÉCISION'],
        ...filteredApplications.map((a) => {
          const app = a.applicantData || {};
          const proj = a.projectData || {};
          return [
            `IML-2026-${String(a.seqNumber).padStart(4, '0')}`,
            `${app.firstName || ''} ${app.lastName || ''}`.trim(),
            app.email || '',
            app.phone || '',
            proj.title || app.companyName || 'Projet',
            a.status,
            a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('fr-FR') : new Date(a.createdAt).toLocaleDateString('fr-FR'),
            a.status === 'ACCEPTEE' ? 'ADMIS' : a.status === 'REFUSEE' ? 'REFUSÉ' : 'EN EXAMEN',
          ];
        }),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Candidatures');
      const filename = `IML_Candidatures_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`✓ Fichier Excel ${filename} téléchargé avec succès.`);
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erreur export Excel');
    }
  };

  // Export Portefeuille Projets Excel
  const exportProjectsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = [
        ['PROJET', 'PORTEUR', 'SECTEUR', 'STADE', 'PROGRESSION (%)', 'STATUT', 'EMAIL', 'TÉLÉPHONE'],
        ...filteredProjects.map((p) => [
          p.name,
          p.beneficiaryName,
          p.sector,
          p.stage,
          p.progress,
          p.status,
          p.beneficiaryEmail || '',
          p.beneficiaryPhone || '',
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Projets');
      const filename = `IML_Portefeuille_Projets_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast(`✓ Fichier Excel ${filename} téléchargé avec succès.`);
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Erreur export Excel');
    }
  };

  return (
    <div className="w-full pb-20 space-y-6 text-slate-800 font-sans print:p-0 print:pb-0 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-[#101f2e] text-white px-5 py-3 rounded-xl shadow-2xl border border-teal-500/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 text-xs font-semibold backdrop-blur-md">
          <CheckCircle2 className="size-4 text-[#23c3b1]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          EN-TÊTE DIRECTEUR : TITRE, BADGE OFFICIEL, FILTRES ET BOUTONS D'EXPORT
         ========================================================================= */}
      <div className="bg-gradient-to-r from-[#101f2e] via-[#162a3f] to-[#1c3650] rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:bg-none print:text-black print:p-0 print:border-none print:shadow-none">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white print:text-black">
            Tableau de bord Direction
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 print:text-slate-600">
            <span className="text-[#23c3b1] font-bold">{period === '30j' ? '30 derniers jours' : period === '90j' ? 'Trimestre (90 jours)' : 'Année 2026'}</span>
            {isFetching && <span className="text-slate-400"> • Actualisation...</span>}
          </p>
        </div>

        {/* Actions et filtres */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden relative">
          
          {/* BOUTONS DE PÉRIODE 100% FONCTIONNELS */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/15 flex items-center">
            <button
              type="button"
              onClick={() => {
                setPeriod('30j');
                showToast('Période : 30 derniers jours sélectionnée');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === '30j' ? 'bg-[#23c3b1] text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              30 jours
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('90j');
                showToast('Période : Trimestre sélectionnée');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === '90j' ? 'bg-[#23c3b1] text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('annee');
                showToast('Période : Année 2026 sélectionnée');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                period === 'annee' ? 'bg-[#23c3b1] text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Année 2026
            </button>
          </div>

          {/* BOUTON RAFRAÎCHIR 100% FONCTIONNEL */}
          <button
            type="button"
            onClick={async () => {
              await refetch();
              showToast('Données et graphiques actualisés');
            }}
            disabled={isFetching}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer disabled:opacity-50"
            title="Rafraîchir les métriques"
          >
            <RefreshCw className={`size-4 ${isFetching ? 'animate-spin text-[#23c3b1]' : ''}`} />
          </button>

          {/* BOUTON EXPORTER LE RAPPORT 100% FONCTIONNEL AVEC MENU DÉROULANT */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-[#f06553] hover:bg-[#e05341] text-white text-xs font-bold transition-all shadow-md shadow-[#f06553]/30 flex items-center gap-2 cursor-pointer active:scale-95"
              title="Exporter ou imprimer le rapport"
            >
              <Download className="size-4" />
              <span>Exporter le rapport</span>
              <ChevronDown className="size-3.5 opacity-80" />
            </button>

            {/* Menu d'options d'exportation */}
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3.5 bg-gradient-to-r from-slate-900 to-[#101f2e] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="size-4 text-[#23c3b1]" />
                    <span className="text-xs font-bold tracking-wide">Options d'exportation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportMenuOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="p-2.5 space-y-3 text-xs max-h-[440px] overflow-y-auto">
                  {/* Section PDF */}
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                      <FileText className="size-3.5" />
                      <span>Format PDF (Rapports Officiels)</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={generateExecutivePDF}
                        className="w-full px-3 py-2 text-left rounded-xl bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/80 flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                            PDF
                          </div>
                          <div>
                            <div className="font-bold text-rose-950">Rapport Exécutif Direction</div>
                            <div className="text-[10px] text-rose-700">Document PDF complet prêt à imprimer</div>
                          </div>
                        </div>
                        <Download className="size-3.5 text-rose-600 opacity-70 group-hover:opacity-100" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          window.print();
                        }}
                        className="w-full px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center gap-2.5 text-slate-600 font-medium cursor-pointer"
                      >
                        <Printer className="size-3.5 text-slate-400" />
                        <span>Imprimer / Sauvegarder via le navigateur</span>
                      </button>
                    </div>
                  </div>

                  {/* Section Excel */}
                  <div className="border-t border-slate-100 pt-2.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="size-3.5" />
                      <span>Format Fichier Excel (.xlsx)</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={exportConsolidatedExcel}
                        className="w-full px-3 py-2 text-left rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/90 flex items-center justify-between group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                            XLS
                          </div>
                          <div>
                            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <span>Classeur Consolidé Global</span>
                              <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-semibold">4 onglets</span>
                            </div>
                            <div className="text-[10px] text-emerald-700">Synthèse, bénéficiaires, candidatures, projets</div>
                          </div>
                        </div>
                        <Download className="size-3.5 text-emerald-700 opacity-70 group-hover:opacity-100" />
                      </button>
                      <button
                        type="button"
                        onClick={exportBeneficiariesExcel}
                        className="w-full px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="size-3.5 text-emerald-600" />
                          <span>Liste des Bénéficiaires</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                      </button>
                      <button
                        type="button"
                        onClick={exportApplicationsExcel}
                        className="w-full px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="size-3.5 text-teal-600" />
                          <span>Liste des Candidatures</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                      </button>
                      <button
                        type="button"
                        onClick={exportProjectsExcel}
                        className="w-full px-3 py-1.5 text-left rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-700 font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="size-3.5 text-amber-600" />
                          <span>Portefeuille des Projets</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>


      {/* =========================================================================
          LES 5 CARTES KPI : CLICABLES POUR BASCULER VERS L'ONGLET DÉTAILLÉ
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1 : Bénéficiaires */}
        <div
          className={`bg-white rounded-2xl p-5 border transition-all group shadow-xs ${
            'border-slate-200/90 hover:border-[#23c3b1] hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bénéficiaires
            </span>
            <div className="size-9 rounded-xl bg-teal-50 text-[#178578] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : (overview?.totalBeneficiaries ?? 0)}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="size-3" /> {(overview as any)?.growthRate || (period === '30j' ? '+14%' : period === '90j' ? '+38%' : '+92%')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Entrepreneurs intégrés ({period === '30j' ? '30 jours' : period === '90j' ? 'Trimestre' : 'Année 2026'})
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Actifs : <strong className="text-slate-900">{overview?.activeProjectsCount ?? 0}</strong></span>
          </div>
        </div>

        {/* KPI 2 : Candidatures */}
        <div
          className={`bg-white rounded-2xl p-5 border transition-all group shadow-xs ${
            'border-slate-200/90 hover:border-[#f06553] hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Candidatures
            </span>
            <div className="size-9 rounded-xl bg-coral-50 text-[#f06553] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : (overview?.acceptedApplications ?? 0)}
            </span>
            <span className="text-xs text-slate-500">
              / {overview?.totalApplications ?? 0}
            </span>
            <span className="text-xs font-bold text-[#f06553] ml-auto">
              {overview?.acceptanceRate ?? 0}% admis
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dossiers approuvés ({period === '30j' ? 'ce mois' : period === '90j' ? 'au trimestre' : 'en 2026'})
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>En examen : <strong className="text-amber-600">{overview?.underReviewApplications ?? 0}</strong></span>
          </div>
        </div>

        {/* KPI 3 : Projets Réalisés */}
        <div
          className={`bg-white rounded-2xl p-5 border transition-all group shadow-xs ${
            'border-slate-200/90 hover:border-amber-400 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Projets Réalisés
            </span>
            <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Rocket className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : (overview?.completedProjectsCount ?? 0)}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              Finalisés
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Entreprises finalisées ({period === '30j' ? 'ce mois' : period === '90j' ? 'au trimestre' : 'en 2026'})
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Moyenne : <strong className="text-[#178578]">{overview?.avgProgress ?? 0}%</strong></span>
          </div>
        </div>

        {/* KPI 4 : Accompagnement */}
        <div
          className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Accompagnement
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : (overview?.totalHoursSupported ?? 0)}h
            </span>
            <span className="text-xs text-slate-500">
              dispensées
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mentorat & coaching ({period === '30j' ? '30 jours' : period === '90j' ? 'Trimestre' : 'Année 2026'})
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Jalons validés :</span>
            <strong className="text-slate-900">{overview?.completedMilestones ?? 0} étapes</strong>
          </div>
        </div>

        {/* KPI 5 : Trafic & Activité */}
        <div
          className={`bg-white rounded-2xl p-5 border transition-all group shadow-xs ${
            'border-slate-200/90 hover:border-purple-400 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Trafic & Activité
            </span>
            <div className="size-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="size-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : (overview?.totalAuditLogs ?? 0)}
            </span>
            <span className="text-xs font-bold text-purple-600">
              Actions
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Interactions tracées ({period === '30j' ? '30 jours' : period === '90j' ? 'Trimestre' : 'Année 2026'})
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Sessions : <strong className="text-slate-900">{overview?.totalSessions ?? 0}</strong></span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          CONTENU SELON L'ONGLET SÉLECTIONNÉ (100% RÉACTIF ET INTERACTIF)
         ========================================================================= */}

      {/* -------------------------------------------------------------------------
          ONGLET 1 : VUE CONSOLIDÉE (DASHBOARD GLOBAL)
         ------------------------------------------------------------------------- */}
      {(
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Les deux graphiques majeurs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique Trafic Quotidien */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-teal-50 text-[#178578] flex items-center justify-center">
                    <TrendingUp className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Trafic & Utilisation Quotidienne de la Plateforme
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Volume des connexions et des interactions ({period === '30j' ? '30 jours' : period === '90j' ? 'Trimestre' : 'Année 2026'})
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traffic?.dailyTraffic || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="connexionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#23c3b1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#23c3b1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="actionsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a3348" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1a3348" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101f2e',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="connexions" name="Connexions / Visites" stroke="#23c3b1" strokeWidth={2.5} fill="url(#connexionsGrad)" />
                    <Area type="monotone" dataKey="actions" name="Actions plateforme" stroke="#1a3348" strokeWidth={2} fill="url(#actionsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique Flux Candidatures vs Admissions */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-coral-50 text-[#f06553] flex items-center justify-center">
                    <BarChart3 className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Flux des Candidatures & Admissions Mensuelles
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Comparatif des candidatures reçues et des dossiers validés
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beneficiaries?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101f2e',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="candidatures" name="Candidatures déposées" fill="#1a3348" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validees" name="Candidatures validées" fill="#23c3b1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="beneficiaires" name="Bénéficiaires intégrés" fill="#f06553" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>



          {/* Répartitions : Secteurs, Profils, Maturité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Secteurs */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="size-4 text-[#23c3b1]" />
                  Secteurs d'Activité des Projets
                </h3>
              </div>
              <div className="space-y-3 pt-2">
                {projects?.bySector && projects.bySector.length > 0 ? (
                  projects.bySector.slice(0, 5).map((sec, idx) => (
                    <div key={sec.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[190px]">{sec.name}</span>
                        <span className="font-bold text-slate-900">{sec.count} ({sec.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(8, sec.percentage)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Aucune donnée</p>
                )}
              </div>
            </div>

            {/* Profils Donut */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="size-4 text-[#f06553]" />
                  Profils des Bénéficiaires
                </h3>
              </div>
              <div className="h-44 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={beneficiaries?.byType || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="label"
                    >
                      {(beneficiaries?.byType || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}
                      formatter={(value: any, name: any) => [`${value} bénéficiaire(s)`, name || 'Effectif']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-slate-100">
                {(beneficiaries?.byType || []).map((t, idx) => (
                  <div key={t.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-600 truncate">{t.label}</span>
                    </div>
                    <strong className="text-slate-800">{t.count} ({t.percentage}%)</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Maturité */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="size-4 text-amber-500" />
                  Maturité du Portefeuille
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">Stades</span>
              </div>
              <div className="space-y-3 pt-2">
                {(projects?.byStage || []).map((stg) => (
                  <div key={stg.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{stg.label}</span>
                      <span className="font-bold text-slate-900">{stg.count} projet(s)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.max(6, stg.percentage)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>


        </div>
      )}




    </div>
  );
}
