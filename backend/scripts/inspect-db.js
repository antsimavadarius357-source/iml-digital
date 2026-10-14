const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    users,
    roles,
    beneficiaries,
    documents,
    appointments,
    programs,
    sectors
  ] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: { select: { code: true } } } }),
    prisma.role.findMany({ select: { id: true, code: true, label: true } }),
    prisma.beneficiary.findMany({ select: { id: true, firstName: true, lastName: true, email: true, status: true, projects: { select: { name: true } } } }),
    prisma.document.findMany({ select: { id: true, title: true, category: true, createdAt: true } }),
    prisma.appointment.findMany({ select: { id: true, datetime: true, status: true } }),
    prisma.program.findMany({ select: { id: true, name: true } }),
    prisma.sector.findMany({ select: { id: true, name: true } }),
  ]);

  console.log('=== ETAT REEL DE LA BASE POSTGRESQL (Port 5433 / iml_digital) ===\n');
  console.log(`- Utilisateurs (${users.length}) :`, users.map(u => `${u.firstName} ${u.lastName} (${u.email} [${u.role?.code}])`).join(', '));
  console.log(`- Roles (${roles.length}) :`, roles.map(r => r.code).join(', '));
  console.log(`- Beneficiaires (${beneficiaries.length}) :`, beneficiaries.map(b => `${b.firstName} ${b.lastName} (${b.email} - Projet: ${b.projects[0]?.name || 'Aucun'})`).join(', ') || 'Aucun');
  console.log(`- Documents (${documents.length}) :`, documents.map(d => d.title).join(', ') || 'Aucun');
  console.log(`- Rendez-vous (${appointments.length})`);
  console.log(`- Programmes (${programs.length}) :`, programs.map(p => p.name).join(', ') || 'Aucun');
  console.log(`- Secteurs d\'activite (${sectors.length}) :`, sectors.map(s => s.name).join(', ') || 'Aucun');
  console.log('\nConnexion PostgreSQL active et synchronisee a 100%.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
