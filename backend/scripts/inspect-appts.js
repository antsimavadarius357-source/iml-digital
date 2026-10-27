const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const appts = await prisma.appointment.findMany({
    include: { beneficiary: true, user: true }
  });
  console.log(JSON.stringify(appts.map(a => ({
    id: a.id,
    datetime: a.datetime,
    duration: a.duration,
    location: a.location,
    status: a.status,
    coachId: a.userId,
    coach: a.user ? `${a.user.firstName} ${a.user.lastName}` : null,
    benId: a.beneficiaryId,
    ben: a.beneficiary ? `${a.beneficiary.firstName} ${a.beneficiary.lastName}` : null,
  })), null, 2));
}

check().finally(() => prisma.$disconnect());
