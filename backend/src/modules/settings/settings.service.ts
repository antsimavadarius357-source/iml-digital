import { prisma } from '../../database/prisma';
import type { z } from 'zod';
import type { createSectorSchema, createProgramSchema } from './settings.schemas';

export async function getSectors() {
  return prisma.sector.findMany({ orderBy: { name: 'asc' } });
}

export async function createSector(data: z.infer<typeof createSectorSchema>) {
  return prisma.sector.create({ data });
}

export async function getPrograms() {
  return prisma.program.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createProgram(data: z.infer<typeof createProgramSchema>) {
  return prisma.program.create({ data });
}
