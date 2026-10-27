const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany();
  const bens = await prisma.beneficiary.findMany({ select: { id: true, fileSeq: true, firstName: true, lastName: true, email: true, createdAt: true } });
  console.log('APPLICATIONS:', JSON.stringify(apps, null, 2));
  console.log('BENEFICIARIES:', JSON.stringify(bens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
