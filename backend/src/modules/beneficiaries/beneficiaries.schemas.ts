import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const BENEFICIARY_TYPES = ['PORTEUR_IDEE', 'STARTUP', 'ENTREPRISE'] as const;
export const PATHWAY_STATUSES = ['EN_ATTENTE', 'ACTIF', 'EN_PAUSE', 'TERMINE', 'ABANDONNE'] as const;
export const PRIORITIES = ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'] as const;
export const PROJECT_STAGES = ['IDEE', 'PROTOTYPE', 'LANCEMENT', 'CROISSANCE', 'MATURITE'] as const;
export const COMPANY_SIZES = ['MICRO', 'PETITE', 'MOYENNE', 'GRANDE'] as const;

const uuid = z.string().uuid();
const optionalUuid = z.string().uuid().optional().or(z.literal('').transform(() => undefined));

const projectFields = {
  name: z.string().trim().min(1, 'Nom du projet requis').max(200),
  description: optionalText(5000),
  sectorId: optionalUuid,
  projectType: optionalText(100),
  stage: z.enum(PROJECT_STAGES).default('IDEE'),
  companyCreatedAt: optionalDate,
  legalStatus: optionalText(100),
  companySize: z.enum(COMPANY_SIZES).optional().or(z.literal('').transform(() => undefined)),
  priorityNeeds: optionalText(2000),
};

export const createBeneficiarySchema = z
  .object({
    // Section A
    firstName: z.string().trim().min(1, 'Prénom requis').max(100),
    lastName: z.string().trim().min(1, 'Nom requis').max(100),
    email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(254),
    phone: optionalText(30),
    city: optionalText(100),
    type: z.enum(BENEFICIARY_TYPES),
    // Section B
    project: z.object(projectFields),
    // Section C
    programId: optionalUuid,
    assignedAgentId: optionalUuid,
    startDate: optionalDate,
    initialObjectives: optionalText(5000),
    priority: z.enum(PRIORITIES).default('NORMALE'),
    status: z.enum(PATHWAY_STATUSES).default('EN_ATTENTE'),
  })
  .superRefine((v, ctx) => {
    // Règles conditionnelles : les infos d'entreprise ne sont exigées que pour une entreprise existante.
    if (v.type === 'ENTREPRISE') {
      if (!v.project.companyCreatedAt) {
        ctx.addIssue({ code: 'custom', path: ['project', 'companyCreatedAt'], message: "Date de création de l'entreprise requise" });
      }
      if (!v.project.legalStatus) {
        ctx.addIssue({ code: 'custom', path: ['project', 'legalStatus'], message: 'Statut juridique requis' });
      }
    }
  });

export const updateBeneficiarySchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().max(30).nullable(),
    city: z.string().trim().max(100).nullable(),
    type: z.enum(BENEFICIARY_TYPES),
    status: z.enum(PATHWAY_STATUSES),
    priority: z.enum(PRIORITIES),
    programId: uuid.nullable(),
    assignedAgentId: uuid.nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    initialObjectives: z.string().trim().max(5000).nullable(),
  })
  .partial();

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).nullable(),
    sectorId: uuid.nullable(),
    projectType: z.string().trim().max(100).nullable(),
    stage: z.enum(PROJECT_STAGES),
    companyCreatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    legalStatus: z.string().trim().max(100).nullable(),
    companySize: z.enum(COMPANY_SIZES).nullable(),
    priorityNeeds: z.string().trim().max(2000).nullable(),
  })
  .partial();

export const listBeneficiariesSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(PATHWAY_STATUSES).optional(),
  type: z.enum(BENEFICIARY_TYPES).optional(),
  programId: uuid.optional(),
  sectorId: uuid.optional(),
  agentId: uuid.optional(),
  sort: z.enum(['recent', 'name', 'activity']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = uuid;
