export interface Option { id: string; name: string }
export interface AgentOption { id: string; firstName: string; lastName: string }
export interface Options { sectors: Option[]; programs: Option[]; agents: AgentOption[] }

export const TYPE_LABELS: Record<string, string> = {
  PORTEUR_IDEE: "Porteur d'idée", STARTUP: 'Startup en création', ENTREPRISE: 'Entreprise existante',
};
export const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente', ACTIF: 'Actif', EN_PAUSE: 'En pause', TERMINE: 'Terminé', ABANDONNE: 'Abandonné',
};
export const PRIORITY_LABELS: Record<string, string> = {
  BASSE: 'Basse', NORMALE: 'Normale', HAUTE: 'Haute', URGENTE: 'Urgente',
};
export const STAGE_LABELS: Record<string, string> = {
  IDEE: 'Idée', PROTOTYPE: 'Prototype', LANCEMENT: 'Lancement', CROISSANCE: 'Croissance', MATURITE: 'Maturité',
};
export const SIZE_LABELS: Record<string, string> = {
  MICRO: 'Micro-entreprise', PETITE: 'Petite entreprise', MOYENNE: 'Moyenne entreprise', GRANDE: 'Grande entreprise',
};

export const STATUS_STYLE: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-50 text-amber-700', ACTIF: 'bg-emerald-50 text-emerald-700',
  EN_PAUSE: 'bg-slate-100 text-slate-600', TERMINE: 'bg-sky-50 text-sky-700', ABANDONNE: 'bg-red-50 text-red-700',
};

export interface BeneficiaryRow {
  id: string; fileNumber: string; type: string; firstName: string; lastName: string; status: string; priority: string;
  lastActivityAt: string; createdAt: string;
  assignedAgent: AgentOption | null; program: Option | null;
  projects: { id: string; name: string; stage: string; sector: Option | null }[];
}

export interface ProjectDetail {
  id: string; name: string; description: string | null; sector: Option | null; projectType: string | null; stage: string;
  companyCreatedAt: string | null; legalStatus: string | null; companySize: string | null; priorityNeeds: string | null;
}

export interface BeneficiaryDetail extends Omit<BeneficiaryRow, 'projects'> {
  email: string; phone: string | null; city: string | null; startDate: string | null; initialObjectives: string | null;
  projects: ProjectDetail[];
}
