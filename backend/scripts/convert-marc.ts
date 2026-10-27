import { prisma } from '../src/database/prisma';

async function main() {
  const app = await prisma.application.findUnique({ where: { seqNumber: 4 } });
  if (!app) {
    console.log('Application 4 not found');
    return;
  }

  const c = app.applicantData as any;
  const p = app.projectData as any;

  let ben = await prisma.beneficiary.findUnique({ where: { email: c.email } });
  if (!ben) {
    ben = await prisma.beneficiary.create({
      data: {
        firstName: c.firstName || 'Marc',
        lastName: c.lastName || 'Roul',
        email: c.email,
        phone: c.phone || '+241 07 40 20 483',
        city: c.city || 'Libreville',
        type: 'PORTEUR_IDEE',
        status: 'EN_ATTENTE',
        priority: 'NORMALE',
        projects: {
          create: {
            name: c.companyName?.trim() || p.title?.trim() || 'Boutique',
            description: p.description || 'Projet de restauration',
            stage: 'IDEE'
          }
        }
      }
    });
    console.log('Created beneficiary:', ben.id, ben.firstName, ben.lastName);
  } else {
    console.log('Beneficiary already existed:', ben.id);
  }

  await prisma.application.update({
    where: { id: app.id },
    data: { beneficiaryId: ben.id }
  });
  console.log('Successfully linked application #4 to beneficiary:', ben.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
