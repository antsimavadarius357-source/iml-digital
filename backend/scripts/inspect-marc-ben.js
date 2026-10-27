const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const marc = await prisma.beneficiary.findFirst({
    where: { email: 'dariusmp23@gmail.com' },
    include: { projects: true }
  });
  console.log('MARC IN DB:', JSON.stringify(marc, null, 2));

  // Check with scopeWhere for AGENT or ADMIN
  const allBens = await prisma.beneficiary.findMany({
    where: { archivedAt: null },
    include: { projects: true }
  });
  console.log('ALL BENS COUNT:', allBens.length);
  console.log('ALL BENS:', allBens.map(b => `${b.firstName} ${b.lastName} (${b.email})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
