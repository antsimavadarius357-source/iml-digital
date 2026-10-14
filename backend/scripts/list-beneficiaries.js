const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.beneficiary.findMany();
  console.log('BENEFICIARIES:', JSON.stringify(all, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
