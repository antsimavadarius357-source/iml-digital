import { prisma } from '../src/database/prisma';

async function main() {
  const pathways = await prisma.pathway.findMany({
    include: {
      steps: true,
      beneficiary: { select: { firstName: true, lastName: true } }
    }
  });

  console.log(`Found ${pathways.length} pathways to synchronize.`);

  for (const p of pathways) {
    const total = p.steps.length;
    const completed = p.steps.filter(s => s.status === 'TERMINE' || s.status === 'VALIDE').length;
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await prisma.pathway.update({
      where: { id: p.id },
      data: {
        progress: newProgress,
        status: completed === total && total > 0 ? 'TERMINE' : 'ACTIF'
      }
    });

    console.log(`Pathway ${p.id} (${p.beneficiary.firstName} ${p.beneficiary.lastName}): ${completed}/${total} steps -> ${newProgress}% (was ${p.progress}%)`);
  }

  console.log('Synchronization complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
