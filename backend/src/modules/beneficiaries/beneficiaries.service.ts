import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../database/prisma';
import { AppError } from '../../middleware/error';
import type { AuthContext } from '../../middleware/auth';
import type {
  createBeneficiarySchema, listBeneficiariesSchema, updateBeneficiarySchema, updateProjectSchema,
} from './beneficiaries.schemas';
import { sendCoachBriefingEmail } from '../email/email.service';

type Auth = Pick<AuthContext, 'userId' | 'role'>;

export const fileNumber = (b: { fileSeq: number; createdAt: Date }): string =>
  `IML-${b.createdAt.getUTCFullYear()}-${String(b.fileSeq).padStart(4, '0')}`;

/** Périmètre d'accès « par dossier » : appliqué à TOUTES les lectures et écritures. */
export function scopeWhere(auth: Auth): Prisma.BeneficiaryWhereInput {
  const base: Prisma.BeneficiaryWhereInput = { archivedAt: null };
  switch (auth.role) {
    case 'ADMIN':
    case 'DIRECTION':
      return base;
    case 'AGENT':
      return { ...base, OR: [{ assignedAgentId: auth.userId }, { assignedAgentId: null }, { assignments: { some: { userId: auth.userId } } }] };
    case 'COACH':
      return {
        ...base,
        OR: [
          { assignments: { some: { userId: auth.userId } } },
          { appointments: { some: { userId: auth.userId } } },
        ],
      };
    default:
      return { ...base, id: '00000000-0000-0000-0000-000000000000' }; // aucun accès
  }
}

const listSelect = {
  id: true, fileSeq: true, createdAt: true, type: true, firstName: true, lastName: true, status: true,
  email: true, phone: true,
  priority: true, lastActivityAt: true, startDate: true,
  assignedAgentId: true,
  assignedAgent: { select: { id: true, firstName: true, lastName: true } },
  program: { select: { id: true, name: true } },
  projects: { select: { id: true, name: true, stage: true, sector: { select: { id: true, name: true } } }, take: 1, orderBy: { createdAt: 'asc' } },
  pathway: { 
    select: { 
      id: true, 
      status: true, 
      progress: true, 
      template: { select: { id: true, name: true } },
      steps: { select: { id: true, title: true, status: true, orderIndex: true }, orderBy: { orderIndex: 'asc' } } 
    } 
  },
  assignments: {
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  appointments: { select: { id: true, datetime: true, status: true }, take: 3, orderBy: { datetime: 'desc' } }
} satisfies Prisma.BeneficiarySelect;

function filters(q: z.infer<typeof listBeneficiariesSchema>, auth: Auth): Prisma.BeneficiaryWhereInput {
  const and: Prisma.BeneficiaryWhereInput[] = [scopeWhere(auth)];
  if (q.status) and.push({ status: q.status });
  if (q.type) and.push({ type: q.type });
  if (q.programId) and.push({ programId: q.programId });
  if (q.agentId) and.push({ assignedAgentId: q.agentId });
  if (q.sectorId) and.push({ projects: { some: { sectorId: q.sectorId } } });
  if (q.search) {
    const s = q.search;
    const seq = /^(?:IML-\d{4}-)?(\d{1,6})$/i.exec(s)?.[1];
    and.push({
      OR: [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { projects: { some: { name: { contains: s, mode: 'insensitive' } } } },
        ...(seq ? [{ fileSeq: Number(seq) }] : []),
      ],
    });
  }
  return { AND: and };
}

const orderBy = (sort: string): Prisma.BeneficiaryOrderByWithRelationInput[] =>
  sort === 'name' ? [{ lastName: 'asc' }, { firstName: 'asc' }] : sort === 'activity' ? [{ lastActivityAt: 'desc' }] : [{ createdAt: 'desc' }];

const withNumber = <T extends { fileSeq: number; createdAt: Date; pathway?: any }>(b: T) => {
  let pathway = b.pathway;
  if (pathway && Array.isArray(pathway.steps) && pathway.steps.length > 0) {
    const total = pathway.steps.length;
    const completed = pathway.steps.filter((s: any) => s.status === 'TERMINE' || s.status === 'VALIDE').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    pathway = {
      ...pathway,
      progress,
      completedSteps: completed,
      totalSteps: total,
    };
  }
  return { ...b, fileNumber: fileNumber(b), pathway };
};

export async function listBeneficiaries(q: z.infer<typeof listBeneficiariesSchema>, auth: Auth) {
  const where = filters(q, auth);
  const [items, total] = await prisma.$transaction([
    prisma.beneficiary.findMany({ where, select: listSelect, orderBy: orderBy(q.sort), skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.beneficiary.count({ where }),
  ]);
  return { items: items.map(withNumber), total, page: q.page, pageSize: q.pageSize };
}

async function assertReferences(refs: { programId?: string | null; assignedAgentId?: string | null; sectorId?: string | null }) {
  if (refs.programId && !(await prisma.program.findUnique({ where: { id: refs.programId } }))) {
    throw new AppError(400, 'Programme introuvable', 'PROGRAMME_INCONNU');
  }
  if (refs.sectorId && !(await prisma.sector.findUnique({ where: { id: refs.sectorId } }))) {
    throw new AppError(400, "Secteur d'activité introuvable", 'SECTEUR_INCONNU');
  }
  if (refs.assignedAgentId) {
    const agent = await prisma.user.findFirst({ where: { id: refs.assignedAgentId, isActive: true, role: { code: 'AGENT' } } });
    if (!agent) throw new AppError(400, "Agent d'accompagnement introuvable ou inactif", 'AGENT_INCONNU');
  }
}

const toDate = (v?: string | null) => (v ? new Date(`${v}T00:00:00.000Z`) : v === null ? null : undefined);

export async function createBeneficiary(input: z.infer<typeof createBeneficiarySchema>, auth: Auth, ip?: string) {
  if (await prisma.beneficiary.findUnique({ where: { email: input.email } })) {
    throw new AppError(409, 'Un dossier existe déjà avec cette adresse e-mail', 'DOUBLON_EMAIL');
  }
  const assignedAgentId = input.assignedAgentId ?? (auth.role === 'AGENT' ? auth.userId : undefined);
  await assertReferences({ programId: input.programId, assignedAgentId, sectorId: input.project.sectorId });
  const { project, ...b } = input;

  const created = await prisma.beneficiary.create({
    data: {
      type: b.type, firstName: b.firstName, lastName: b.lastName, email: b.email, phone: b.phone, city: b.city,
      status: b.status, priority: b.priority, programId: b.programId, assignedAgentId,
      startDate: toDate(b.startDate), initialObjectives: b.initialObjectives,
      projects: {
        create: {
          name: project.name, description: project.description, sectorId: project.sectorId, projectType: project.projectType,
          stage: project.stage, companyCreatedAt: toDate(project.companyCreatedAt), legalStatus: project.legalStatus,
          companySize: project.companySize, priorityNeeds: project.priorityNeeds,
        },
      },
    },
    select: listSelect,
  });
  await prisma.auditLog.create({
    data: { userId: auth.userId, action: 'beneficiary.create', entityType: 'Beneficiary', entityId: created.id, ipAddress: ip },
  });
  return withNumber(created);
}

export async function getBeneficiary(id: string, auth: Auth) {
  const b = await prisma.beneficiary.findFirst({
    where: { AND: [{ id }, scopeWhere(auth)] },
    include: {
      assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      program: { select: { id: true, name: true } },
      projects: { include: { sector: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
      assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      application: { select: { id: true, seqNumber: true, applicantData: true, projectData: true, submittedAt: true } },
      pathway: {
        include: {
          steps: { orderBy: { orderIndex: 'asc' } },
          template: { select: { id: true, name: true } },
        },
      },
    },
  });
  // 404 (et non 403) : on ne révèle pas l'existence d'un dossier hors périmètre.
  if (!b) throw new AppError(404, 'Dossier introuvable', 'INTROUVABLE');
  return withNumber(b);
}

const QUIET_FIELDS = new Set(['email', 'phone', 'city', 'initialObjectives', 'description', 'priorityNeeds']);

function diff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: { field: string; from?: unknown; to?: unknown }[] = [];
  for (const [k, v] of Object.entries(after)) {
    const a = before[k] instanceof Date ? (before[k] as Date).toISOString().slice(0, 10) : before[k];
    if (v !== undefined && a !== v) changes.push(QUIET_FIELDS.has(k) ? { field: k } : { field: k, from: a, to: v });
  }
  return changes;
}

export async function updateBeneficiary(id: string, input: z.infer<typeof updateBeneficiarySchema>, auth: Auth, ip?: string) {
  const current = await getBeneficiary(id, auth);
  if (input.email && input.email !== current.email && (await prisma.beneficiary.findUnique({ where: { email: input.email } }))) {
    throw new AppError(409, 'Un dossier existe déjà avec cette adresse e-mail', 'DOUBLON_EMAIL');
  }
  await assertReferences({ programId: input.programId, assignedAgentId: input.assignedAgentId });
  const { coachId, ...inputWithoutCoach } = input;
  const changes = diff(current as unknown as Record<string, unknown>, inputWithoutCoach);

  const { startDate, ...rest } = inputWithoutCoach;
  const ops: any[] = [
    prisma.beneficiary.update({ where: { id }, data: { ...rest, startDate: toDate(startDate), lastActivityAt: new Date() } }),
    prisma.auditLog.create({
      data: { userId: auth.userId, action: 'beneficiary.update', entityType: 'Beneficiary', entityId: id, metadata: { changes } as Prisma.InputJsonValue, ipAddress: ip },
    }),
  ];

  if (coachId !== undefined) {
    ops.push(prisma.assignment.deleteMany({ where: { beneficiaryId: id } }));
    if (coachId !== null) {
      ops.push(prisma.assignment.create({ data: { beneficiaryId: id, userId: coachId } }));
    }
  }

  await prisma.$transaction(ops);
  return getBeneficiary(id, auth);
}

export async function updateProject(id: string, projectId: string, input: z.infer<typeof updateProjectSchema>, auth: Auth, ip?: string) {
  const current = await getBeneficiary(id, auth);
  const project = current.projects.find((p) => p.id === projectId);
  if (!project) throw new AppError(404, 'Projet introuvable', 'INTROUVABLE');
  await assertReferences({ sectorId: input.sectorId });
  const changes = diff(project as unknown as Record<string, unknown>, input);
  if (changes.length === 0) return current;

  const { companyCreatedAt, ...rest } = input;
  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: { ...rest, companyCreatedAt: toDate(companyCreatedAt) } }),
    prisma.beneficiary.update({ where: { id }, data: { lastActivityAt: new Date() } }),
    prisma.auditLog.create({
      data: { userId: auth.userId, action: 'project.update', entityType: 'Beneficiary', entityId: id, metadata: { projectId, changes } as Prisma.InputJsonValue, ipAddress: ip },
    }),
  ]);
  return getBeneficiary(id, auth);
}

export async function getHistory(id: string, auth: Auth) {
  await getBeneficiary(id, auth); // contrôle d'accès
  const items = await prisma.auditLog.findMany({
    where: { entityType: 'Beneficiary', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, action: true, metadata: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
  });
  return { items };
}

export async function getOptions() {
  const [sectors, programs, agents] = await Promise.all([
    prisma.sector.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.program.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { code: { in: ['AGENT', 'COACH', 'ADMIN', 'DIRECTION'] } },
      },
      orderBy: [{ role: { code: 'asc' } }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { code: true, label: true } },
      },
    }),
  ]);
  return { sectors, programs, agents };
}

// Neutralise l'injection de formules (Excel/LibreOffice) et échappe les guillemets.
const csvCell = (v: unknown): string => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function exportCsv(q: z.infer<typeof listBeneficiariesSchema>, auth: Auth, ip?: string): Promise<string> {
  const rows = await prisma.beneficiary.findMany({ where: filters(q, auth), select: listSelect, orderBy: orderBy(q.sort), take: 5000 });
  await prisma.auditLog.create({
    data: { userId: auth.userId, action: 'beneficiary.export', entityType: 'Beneficiary', metadata: { count: rows.length }, ipAddress: ip },
  });
  const head = ['Dossier', 'Nom', 'Prénom', 'Type', 'Projet', 'Secteur', 'Programme', 'Agent', 'Statut', 'Priorité', "Date d'inscription", 'Dernière activité'];
  const lines = rows.map((r) => [
    fileNumber(r), r.lastName, r.firstName, r.type, r.projects[0]?.name, r.projects[0]?.sector?.name, r.program?.name,
    r.assignedAgent ? `${r.assignedAgent.firstName} ${r.assignedAgent.lastName}` : '', r.status, r.priority,
    r.createdAt.toISOString().slice(0, 10), r.lastActivityAt.toISOString().slice(0, 10),
  ].map(csvCell).join(';'));
  return '\uFEFF' + [head.map(csvCell).join(';'), ...lines].join('\r\n');
}

export async function notifyCoach(
  beneficiaryId: string,
  input: { coachId?: string; coachEmail?: string; coachName?: string },
  auth: Auth,
  ip?: string
) {
  const b = await getBeneficiary(beneficiaryId, auth);
  let targetEmail = input.coachEmail;
  let targetName = input.coachName;

  if (!targetEmail && input.coachId) {
    const coachUser = await prisma.user.findUnique({ where: { id: input.coachId } });
    if (coachUser) {
      targetEmail = coachUser.email;
      targetName = `${coachUser.firstName} ${coachUser.lastName}`;
    }
  }

  if (!targetEmail && b.assignments && b.assignments.length > 0) {
    const firstCoach = b.assignments[0]?.user;
    if (firstCoach && 'email' in firstCoach) {
      targetEmail = (firstCoach as any).email;
      targetName = `${firstCoach.firstName} ${firstCoach.lastName}`;
    }
  }

  if (!targetEmail) {
    throw new AppError(400, 'Adresse e-mail du coach introuvable.', 'COACH_SANS_EMAIL');
  }

  const agentUser = await prisma.user.findUnique({ where: { id: auth.userId } });
  const agentName = agentUser ? `${agentUser.firstName} ${agentUser.lastName}` : 'Coordination IML Digit';
  const agentEmail = agentUser?.email;

  const project = b.projects?.[0];
  const nextAppt = await prisma.appointment.findFirst({
    where: { beneficiaryId, status: 'PLANIFIE' },
    orderBy: { datetime: 'asc' },
  });

  const apptDateStr = nextAppt
    ? new Date(nextAppt.datetime).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined;

  const result = await sendCoachBriefingEmail({
    coachEmail: targetEmail,
    coachName: targetName || 'Expert IML',
    beneficiaryName: `${b.firstName} ${b.lastName}`,
    companyName: project?.name,
    sectorName: project?.sector?.name,
    projectStage: project?.stage,
    objectives: b.initialObjectives || project?.priorityNeeds || undefined,
    beneficiaryPhone: b.phone || undefined,
    beneficiaryEmail: b.email,
    agentName,
    agentEmail,
    appointmentDatetime: apptDateStr,
    appointmentLocation: nextAppt?.location || undefined,
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'beneficiary.coach_notified_email',
      entityType: 'Beneficiary',
      entityId: beneficiaryId,
      metadata: { targetEmail, simulated: result.simulated },
      ipAddress: ip,
    },
  });

  return { success: result.success, message: result.message || 'Briefing expédié par e-mail avec succès.' };
}
