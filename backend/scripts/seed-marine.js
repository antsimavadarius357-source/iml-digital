const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.beneficiary.findUnique({ where: { email: 'marine.loupe@test.com' } });
  if (!existing) {
    const user = await prisma.user.findFirst();
    await prisma.beneficiary.create({
      data: {
        firstName: 'Marine',
        lastName: 'LOUPE',
        email: 'marine.loupe@test.com',
        type: 'PORTEUR_IDEE',
        status: 'EN_ATTENTE',
        assignedAgentId: user ? user.id : undefined,
      }
    });
    console.log('Marine LOUPE created successfully');
  } else {
    console.log('Marine LOUPE already exists');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
