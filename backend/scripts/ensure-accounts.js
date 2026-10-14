const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const hash = await argon2.hash('Password123!', { type: argon2.argon2id });
  
  const roles = await prisma.role.findMany();
  const roleMap = Object.fromEntries(roles.map(r => [r.code, r.id]));
  
  console.log('Roles disponibles:', roleMap);

  // 1. Coach
  if (roleMap.COACH) {
    const coach = await prisma.user.upsert({
      where: { email: 'coach@imldigit.com' },
      update: {
        roleId: roleMap.COACH,
        passwordHash: hash,
        isActive: true
      },
      create: {
        email: 'coach@imldigit.com',
        firstName: 'Darius',
        lastName: 'Coach IML',
        passwordHash: hash,
        roleId: roleMap.COACH,
        isActive: true
      }
    });
    console.log('Coach assuré:', coach.email, coach.id);
  }

  // 2. Agent
  if (roleMap.AGENT) {
    const agent = await prisma.user.upsert({
      where: { email: 'agent@imldigit.com' },
      update: {
        roleId: roleMap.AGENT,
        passwordHash: hash,
        isActive: true
      },
      create: {
        email: 'agent@imldigit.com',
        firstName: 'Alexandre',
        lastName: 'Agent IML',
        passwordHash: hash,
        roleId: roleMap.AGENT,
        isActive: true
      }
    });
    console.log('Agent assuré:', agent.email, agent.id);
  }

  // 3. Admin
  if (roleMap.ADMIN) {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@imldigit.com' },
      update: {
        roleId: roleMap.ADMIN,
        passwordHash: hash,
        isActive: true
      },
      create: {
        email: 'admin@imldigit.com',
        firstName: 'Directeur',
        lastName: 'IML Digit',
        passwordHash: hash,
        roleId: roleMap.ADMIN,
        isActive: true
      }
    });
    console.log('Admin assuré:', admin.email, admin.id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
