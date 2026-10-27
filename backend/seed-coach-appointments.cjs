const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const coach = await prisma.user.findFirst({ where: { email: 'coach@imldigit.com' } });
  const agent = await prisma.user.findFirst({ where: { email: 'agent@imldigit.com' } });

  if (!coach) {
    console.error('Coach introuvable');
    return;
  }

  const marc = await prisma.beneficiary.findFirst({ where: { lastName: 'Roul' } });
  const sophia = await prisma.beneficiary.findFirst({ where: { lastName: 'GABON', firstName: 'Sophiatech' } });
  const agri = await prisma.beneficiary.findFirst({ where: { lastName: 'AGRI-GABON' } });
  const log = await prisma.beneficiary.findFirst({ where: { lastName: 'EQUATORIALE' } });
  const marine = await prisma.beneficiary.findFirst({ where: { lastName: 'LOUPE' } });

  const sessions = [
    {
      beneficiaryId: marc ? marc.id : null,
      userId: coach.id,
      datetime: new Date('2026-10-20T10:00:00.000Z'),
      duration: 90,
      location: 'Visioconférence sécurisée (Entretien individuel de cadrage et business model)',
      status: 'PLANIFIE'
    },
    {
      beneficiaryId: sophia ? sophia.id : null,
      userId: coach.id,
      datetime: new Date('2026-10-22T14:30:00.000Z'),
      duration: 60,
      location: 'Visioconférence (Revue financière et plan de trésorerie)',
      status: 'PLANIFIE'
    },
    {
      beneficiaryId: agri ? agri.id : null,
      userId: coach.id,
      datetime: new Date('2026-10-24T09:00:00.000Z'),
      duration: 120,
      location: "Atelier en présentiel - Salle d'incubation IML Libreville",
      status: 'PLANIFIE'
    },
    {
      beneficiaryId: log ? log.id : null,
      userId: coach.id,
      datetime: new Date('2026-10-27T15:00:00.000Z'),
      duration: 60,
      location: "Visioconférence (Gouvernance d'entreprise et développement)",
      status: 'PLANIFIE'
    },
    {
      beneficiaryId: marine ? marine.id : null,
      userId: coach.id,
      datetime: new Date('2026-10-29T11:00:00.000Z'),
      duration: 90,
      location: 'Visioconférence (Innovation et stratégie de mise sur le marché)',
      status: 'PLANIFIE'
    }
  ];

  for (const s of sessions) {
    if (s.beneficiaryId) {
      const created = await prisma.appointment.create({ data: s });
      console.log('RDV créé avec succès:', created.id, created.datetime);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
