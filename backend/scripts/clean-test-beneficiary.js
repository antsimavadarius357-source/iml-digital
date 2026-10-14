const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.document.deleteMany({});
  await prisma.beneficiary.deleteMany({});
  console.log('Cleaned up beneficiaries and documents successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
