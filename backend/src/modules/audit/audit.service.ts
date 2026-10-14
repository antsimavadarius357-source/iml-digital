import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';

export async function getAuditLogs(auth: AuthContext, limit = 50) {
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
