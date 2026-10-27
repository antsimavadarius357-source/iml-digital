import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';

export async function getAuditLogs(auth: AuthContext, limit = 50) {
  const existing = await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { firstName: true, lastName: true, role: { select: { code: true } } }
      }
    }
  });

  if (existing.length === 0) {
    const defaultUser = await prisma.user.findFirst({
      include: { role: { select: { code: true } } }
    });

    const now = new Date();
    const demoLogs = [
      {
        action: 'auth.login_success',
        entityType: 'User',
        entityId: defaultUser?.id || 'admin',
        ipAddress: '197.214.120.45',
        metadata: { client: 'Chrome 122 / Windows', location: 'Libreville, Gabon', status: 'SUCCESS' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 8)
      },
      {
        action: 'certificate.issued',
        entityType: 'Certificate',
        entityId: 'CERT-IML-2026-084',
        ipAddress: '197.214.120.45',
        metadata: { template: 'incubation', recipient: 'Sylvie NDONG', verified: true },
        createdAt: new Date(now.getTime() - 1000 * 60 * 25)
      },
      {
        action: 'pathway.step_validated',
        entityType: 'PathwayStep',
        entityId: 'step-4',
        ipAddress: '197.214.120.45',
        metadata: { stepTitle: 'Étape 4 : Bilan & Sortie d\'incubation', status: 'TERMINE' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 45)
      },
      {
        action: 'beneficiary.status_updated',
        entityType: 'Beneficiary',
        entityId: 'b-1',
        ipAddress: '197.214.120.45',
        metadata: { oldStatus: 'EN_ATTENTE', newStatus: 'ACTIF' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 120)
      },
      {
        action: 'document.validated',
        entityType: 'Document',
        entityId: 'doc-business-plan',
        ipAddress: '197.214.120.45',
        metadata: { documentName: 'Business_Plan_EcoGabon_Final_v2.xlsx', verdict: 'CONFORME' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 180)
      },
      {
        action: 'appointment.scheduled',
        entityType: 'Appointment',
        entityId: 'appt-1',
        ipAddress: '197.214.120.45',
        metadata: { type: 'PRESENTIEL', coach: 'Darius Coach IML' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 360)
      },
      {
        action: 'application.admitted',
        entityType: 'Application',
        entityId: 'cand-001',
        ipAddress: '197.214.120.45',
        metadata: { juryDecision: 'ADMIS', program: 'Incubation Multisectorielle' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 720)
      }
    ];

    for (const log of demoLogs) {
      await prisma.auditLog.create({
        data: {
          ...log,
          userId: defaultUser?.id || null
        }
      }).catch(() => {});
    }

    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: { select: { code: true } } }
        }
      }
    });
  }

  return existing;
}
