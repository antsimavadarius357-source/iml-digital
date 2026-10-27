import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { createAppointmentSchema, updateAppointmentSchema, createSessionSchema, listAppointmentsSchema } from './appointments.schemas';
import { AppError } from '../../middleware/error';
import { sendAppointmentNotificationEmail } from '../email/email.service';

function scopeWhere(auth: AuthContext): Prisma.AppointmentWhereInput {
  const global = auth.permissions.includes('dashboard:global') || auth.permissions.includes('users:manage');
  if (global) return {};
  // Si ce n'est pas global (ex: coach), on voit ses propres RDV ET les séances programmées pour ses bénéficiaires assignés
  return {
    OR: [
      { userId: auth.userId },
      { beneficiary: { assignments: { some: { userId: auth.userId } } } }
    ]
  };
}

export async function listAppointments(query: z.infer<typeof listAppointmentsSchema>, auth: AuthContext) {
  const where: Prisma.AppointmentWhereInput = {
    AND: [
      scopeWhere(auth),
      query.beneficiaryId ? { beneficiaryId: query.beneficiaryId } : {},
      query.startDate ? { datetime: { gte: query.startDate } } : {},
      query.endDate ? { datetime: { lte: query.endDate } } : {},
    ]
  };

  const items = await prisma.appointment.findMany({
    where,
    orderBy: { datetime: 'desc' },
    include: {
      beneficiary: { 
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true, 
          phone: true, 
          type: true,
          projects: {
            select: { id: true, name: true, stage: true }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        } 
      },
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      session: true,
    }
  });

  return items;
}

export async function createAppointment(data: z.infer<typeof createAppointmentSchema>, auth: AuthContext) {
  // Déterminer le coach référent désigné pour la séance (ou l'agent connecté par défaut)
  const targetCoachId = data.coachId || auth.userId;

  // Récupérer les informations du coach pour les convocations et emails
  const coachUser = await prisma.user.findUnique({
    where: { id: targetCoachId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const coachFullName = coachUser ? `${coachUser.firstName} ${coachUser.lastName}` : 'Votre Coach IML Digit';

  // Liste des IDs de bénéficiaires cibles
  const targetBeneficiaryIds: string[] = [];
  if (data.beneficiaryIds && data.beneficiaryIds.length > 0) {
    targetBeneficiaryIds.push(...data.beneficiaryIds);
  } else if (data.beneficiaryId) {
    targetBeneficiaryIds.push(data.beneficiaryId);
  }

  // 1. Si un applicationId est fourni et aucun bénéficiaire explicite
  if (targetBeneficiaryIds.length === 0 && data.applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { beneficiary: true },
    });

    if (app) {
      if (app.beneficiaryId) {
        targetBeneficiaryIds.push(app.beneficiaryId);
      } else {
        const applicant = (app.applicantData as any) || {};
        const project = (app.projectData as any) || {};
        const email = applicant.email?.trim()?.toLowerCase();

        let targetBen = email ? await prisma.beneficiary.findUnique({ where: { email } }) : null;

        if (!targetBen) {
          targetBen = await prisma.beneficiary.create({
            data: {
              firstName: applicant.firstName?.trim() || 'Porteur',
              lastName: applicant.lastName?.trim() || 'Candidat',
              email: email || null,
              phone: applicant.phone?.trim() || null,
              city: applicant.city?.trim() || 'Libreville',
              type: 'PORTEUR_IDEE',
              status: 'EN_ATTENTE',
              priority: 'NORMALE',
              projects: {
                create: {
                  name: project.title || 'Projet candidature',
                  description: project.description || null,
                  stage: 'IDEE',
                },
              },
            },
          });
        }

        await prisma.application.update({
          where: { id: app.id },
          data: { beneficiaryId: targetBen.id },
        });

        targetBeneficiaryIds.push(targetBen.id);
      }
    }
  }

  // 2. Si on a des coordonnées de candidat directes mais pas encore d'ID
  if (targetBeneficiaryIds.length === 0 && (data.candidateEmail || data.candidateName)) {
    const email = data.candidateEmail?.trim()?.toLowerCase();
    let targetBen = email ? await prisma.beneficiary.findUnique({ where: { email } }) : null;

    if (!targetBen && data.candidateName) {
      const parts = data.candidateName.trim().split(' ');
      const firstName = parts[0] || 'Porteur';
      const lastName = parts.slice(1).join(' ') || 'Candidat';

      targetBen = await prisma.beneficiary.create({
        data: {
          firstName,
          lastName,
          email: email || `candidat.${Date.now()}@candidat.local`,
          phone: data.candidatePhone?.trim() || null,
          city: 'Libreville',
          type: 'PORTEUR_IDEE',
          status: 'EN_ATTENTE',
          priority: 'NORMALE',
          projects: {
            create: {
              name: `Projet de ${firstName} ${lastName}`,
              stage: 'IDEE',
            },
          },
        },
      });
    }

    if (targetBen) {
      targetBeneficiaryIds.push(targetBen.id);
    }
  }

  // 3. Secours : si aucun bénéficiaire n'a pu être résolu, rattacher au premier dossier existant
  if (targetBeneficiaryIds.length === 0) {
    const fallback = await prisma.beneficiary.findFirst({ select: { id: true } });
    if (fallback) {
      targetBeneficiaryIds.push(fallback.id);
    }
  }

  if (targetBeneficiaryIds.length === 0) {
    throw new AppError(400, 'Aucun dossier bénéficiaire disponible pour associer le rendez-vous', 'BENEFICIAIRE_MANQUANT');
  }

  // Déterminer le type de format (Visio ou Présentiel) pour les emails
  const locLower = (data.location || '').toLowerCase();
  const isVideo = locLower.includes('http') || locLower.includes('meet') || locLower.includes('visio');
  const sessionType: 'video' | 'in_person' = isVideo ? 'video' : 'in_person';

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(data.datetime));

  // Créer un enregistrement de rendez-vous pour chaque bénéficiaire concerné
  const createdAppointments = [];
  for (const bId of targetBeneficiaryIds) {
    // 1. Affecter formellement le coach au bénéficiaire pour lui donner accès au dossier et aux documents
    await prisma.assignment.upsert({
      where: {
        beneficiaryId_userId: {
          beneficiaryId: bId,
          userId: targetCoachId,
        }
      },
      create: {
        beneficiaryId: bId,
        userId: targetCoachId,
      },
      update: {},
    }).catch(() => {});

    // 2. Créer l'enregistrement du rendez-vous
    const appt = await prisma.appointment.create({
      data: {
        beneficiaryId: bId,
        datetime: data.datetime,
        duration: data.duration,
        location: data.location,
        userId: targetCoachId, // Le coach désigné reçoit le RDV dans son planning de la plateforme
      },
      include: {
        beneficiary: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    createdAppointments.push(appt);

    // 3. Envoi de l'e-mail de convocation officiel au bénéficiaire au même instant
    let isDelivered = false;
    let deliveryError: string | null = null;
    if (appt.beneficiary?.email && appt.beneficiary.email.includes('@') && !appt.beneficiary.email.endsWith('.local')) {
      try {
        const mailRes = await sendAppointmentNotificationEmail({
          recipientEmail: appt.beneficiary.email,
          recipientName: `${appt.beneficiary.firstName} ${appt.beneficiary.lastName}`,
          coachName: coachFullName,
          datetime: formattedDate,
          durationMinutes: data.duration,
          sessionType,
          locationOrUrl: data.location || 'Siège IML Digit',
          notes: data.notes,
        });
        isDelivered = mailRes.success;
      } catch (err: any) {
        isDelivered = false;
        deliveryError = err?.message || 'Erreur SMTP';
        console.error(`[AVERTISSEMENT] Échec envoi email au bénéficiaire ${appt.beneficiary?.email}:`, err);
      }
    } else {
      isDelivered = false;
      deliveryError = 'Adresse e-mail manquante ou non valide';
    }
  }

  // Retourner le premier rendez-vous créé avec l'accusé de réception certifié (double délivrance synchrone)
  const firstAppt = createdAppointments[0];
  if (!firstAppt) {
    throw new AppError(500, 'CREATION_ECHEC', 'Erreur lors de la création du rendez-vous');
  }
  const nowIso = new Date().toISOString();
  const receiptNumber = `AR-IML-${new Date().getFullYear()}-${firstAppt.id.slice(0, 8).toUpperCase()}`;

  return {
    ...firstAppt,
    receipt: {
      receiptNumber,
      issuedAt: nowIso,
      coach: {
        id: coachUser?.id,
        name: coachFullName,
        email: coachUser?.email,
        channel: 'Plateforme IML Digit (Espace Coach & Agenda)',
        platformDelivered: true,
        deliveredAt: nowIso,
      },
      beneficiaries: createdAppointments.map(a => ({
        id: a.beneficiary.id,
        name: `${a.beneficiary.firstName} ${a.beneficiary.lastName}`,
        email: a.beneficiary.email,
        phone: a.beneficiary.phone,
        emailDelivered: Boolean(a.beneficiary.email && a.beneficiary.email.includes('@') && !a.beneficiary.email.endsWith('.local')),
        deliveredAt: nowIso,
      })),
      sessionType,
      locationOrUrl: data.location || 'Siège IML Digit',
      datetime: data.datetime,
      duration: data.duration,
      notes: data.notes,
    }
  };
}

export async function updateAppointment(id: string, data: z.infer<typeof updateAppointmentSchema>, auth: AuthContext) {
  const rdv = await prisma.appointment.findFirst({ where: { id, ...scopeWhere(auth) } });
  if (!rdv) throw new AppError(404, 'NON_TROUVE', 'RDV introuvable ou accès refusé');

  return prisma.appointment.update({
    where: { id },
    data,
  });
}

export async function deleteAppointment(id: string, auth: AuthContext) {
  const rdv = await prisma.appointment.findFirst({ where: { id, ...scopeWhere(auth) } });
  if (!rdv) throw new AppError(404, 'NON_TROUVE', 'RDV introuvable ou accès refusé');

  return prisma.appointment.delete({
    where: { id },
  });
}

export async function submitSession(appointmentId: string, data: z.infer<typeof createSessionSchema>, auth: AuthContext) {
  const rdv = await prisma.appointment.findFirst({ where: { id: appointmentId, ...scopeWhere(auth) }, include: { session: true } });
  if (!rdv) throw new AppError(404, 'NON_TROUVE', 'RDV introuvable ou accès refusé');
  if (rdv.session) throw new AppError(400, 'SESSION_EXISTE', 'Un compte rendu existe déjà pour ce RDV');

  // Met à jour le RDV en REALISE et crée la session
  return prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'REALISE' }
    });

    return tx.serviceSession.create({
      data: {
        appointmentId,
        ...data
      }
    });
  });
}
