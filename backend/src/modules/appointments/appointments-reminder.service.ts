import cron from 'node-cron';
import { prisma } from '../../database/prisma';
import { logger } from '../../utils/logger';
import { sendAppointmentReminderEmail } from '../email/email.service';

// Cache en mémoire pour éviter d'envoyer deux fois le même rappel le même jour pour un même RDV
const sentRemindersToday = new Set<string>();

export interface ReminderJobResult {
  checkedCount: number;
  sentCount: number;
  skippedCount: number;
  details: Array<{
    appointmentId: string;
    beneficiary: string;
    coach: string;
    datetime: string;
    daysRemaining: number;
    beneficiarySent: boolean;
    coachSent: boolean;
  }>;
}

/**
 * Exécute la vérification et l'envoi des rappels automatiques pour les rendez-vous à venir
 */
export async function runDailyAppointmentReminders(force: boolean = false): Promise<ReminderJobResult> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayKey = todayStart.toISOString().slice(0, 10);
  const maxHorizon = new Date(todayStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 jours max

  logger.info(`[RAPPELS AUTOMATIQUES] Lancement de la vérification des rendez-vous pour le ${todayKey}...`);

  // Récupérer tous les rendez-vous planifiés à venir
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      status: 'PLANIFIE',
      datetime: {
        gte: todayStart,
        lte: maxHorizon,
      },
    },
    include: {
      beneficiary: {
        include: {
          projects: {
            take: 1,
            select: { name: true },
          },
        },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { datetime: 'asc' },
  });

  const details: ReminderJobResult['details'] = [];
  let sentCount = 0;
  let skippedCount = 0;

  for (const appt of upcomingAppointments) {
    const apptDate = new Date(appt.datetime);
    const apptDayStart = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate(), 0, 0, 0, 0);
    const diffMs = apptDayStart.getTime() - todayStart.getTime();
    const daysRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    // On rappelle les rendez-vous prévus entre J-7 et le Jour J (J-0)
    if (daysRemaining > 7) {
      skippedCount++;
      continue;
    }

    const reminderKey = `${appt.id}-${todayKey}`;
    if (!force && sentRemindersToday.has(reminderKey)) {
      logger.info(`[RAPPELS AUTOMATIQUES] RDV ${appt.id} déjà rappelé aujourd'hui (${todayKey}), ignoré.`);
      skippedCount++;
      continue;
    }

    const formattedFullDate = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(apptDate);

    const formattedDateOnly = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
    }).format(apptDate);

    const formattedTimeOnly = new Intl.DateTimeFormat('fr-FR', {
      timeStyle: 'short',
    }).format(apptDate);

    const locLower = (appt.location || '').toLowerCase();
    const isVideo = locLower.includes('http') || locLower.includes('meet') || locLower.includes('visio');
    const sessionType: 'video' | 'in_person' = isVideo ? 'video' : 'in_person';

    let videoUrl = isVideo && (appt.location?.startsWith('http') || appt.location?.startsWith('https'))
      ? appt.location
      : `https://meet.jit.si/IML-Digit-${appt.id.slice(0, 8)}`;

    const projectName = appt.beneficiary?.projects?.[0]?.name;
    const coachFullName = `${appt.user.firstName} ${appt.user.lastName}`.trim();
    const beneficiaryFullName = `${appt.beneficiary?.firstName || ''} ${appt.beneficiary?.lastName || ''}`.trim() || 'Porteur de projet';

    let beneficiarySent = false;
    let coachSent = false;

    // 1. Rappel au porteur de projet / bénéficiaire
    if (appt.beneficiary?.email && appt.beneficiary.email.includes('@') && !appt.beneficiary.email.endsWith('.local')) {
      try {
        const res = await sendAppointmentReminderEmail({
          recipientEmail: appt.beneficiary.email,
          recipientName: beneficiaryFullName,
          isCoach: false,
          partnerName: coachFullName,
          partnerRole: 'Coach Référent',
          datetime: formattedFullDate,
          formattedDateOnly,
          formattedTimeOnly,
          durationMinutes: appt.duration,
          sessionType,
          locationOrUrl: appt.location || 'Siège IML Digit',
          videoUrl,
          daysRemaining,
          projectName,
        });
        beneficiarySent = res.success;
      } catch (e: any) {
        logger.error(`[RAPPELS AUTOMATIQUES] Erreur envoi rappel bénéficiaire (${appt.beneficiary.email}): ${e?.message}`);
      }
    }

    // 2. Rappel au Coach référent
    if (appt.user?.email && appt.user.email.includes('@') && !appt.user.email.endsWith('.local')) {
      try {
        const res = await sendAppointmentReminderEmail({
          recipientEmail: appt.user.email,
          recipientName: coachFullName,
          isCoach: true,
          partnerName: beneficiaryFullName,
          partnerRole: 'Porteur de projet',
          datetime: formattedFullDate,
          formattedDateOnly,
          formattedTimeOnly,
          durationMinutes: appt.duration,
          sessionType,
          locationOrUrl: appt.location || 'Siège IML Digit',
          videoUrl,
          daysRemaining,
          projectName,
        });
        coachSent = res.success;
      } catch (e: any) {
        logger.error(`[RAPPELS AUTOMATIQUES] Erreur envoi rappel coach (${appt.user.email}): ${e?.message}`);
      }
    }

    if (beneficiarySent || coachSent) {
      sentRemindersToday.add(reminderKey);
      sentCount++;
    }

    details.push({
      appointmentId: appt.id,
      beneficiary: beneficiaryFullName,
      coach: coachFullName,
      datetime: formattedFullDate,
      daysRemaining,
      beneficiarySent,
      coachSent,
    });
  }

  logger.info(`[RAPPELS AUTOMATIQUES] Fin du traitement : ${sentCount} rappel(s) envoyé(s), ${skippedCount} ignoré(s) / déjà envoyés.`);

  return {
    checkedCount: upcomingAppointments.length,
    sentCount,
    skippedCount,
    details,
  };
}

/**
 * Envoie un rappel immédiat pour un rendez-vous précis (déclenché manuellement par l'agent ou l'admin)
 */
export async function sendManualAppointmentReminder(appointmentId: string): Promise<{ success: boolean; message: string; details?: any }> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      beneficiary: {
        include: {
          projects: { take: 1, select: { name: true } },
        },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!appt) {
    return { success: false, message: 'Rendez-vous introuvable' };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const apptDate = new Date(appt.datetime);
  const apptDayStart = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate(), 0, 0, 0, 0);
  const diffMs = apptDayStart.getTime() - todayStart.getTime();
  const daysRemaining = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const formattedFullDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(apptDate);

  const formattedDateOnly = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
  }).format(apptDate);

  const formattedTimeOnly = new Intl.DateTimeFormat('fr-FR', {
    timeStyle: 'short',
  }).format(apptDate);

  const locLower = (appt.location || '').toLowerCase();
  const isVideo = locLower.includes('http') || locLower.includes('meet') || locLower.includes('visio');
  const sessionType: 'video' | 'in_person' = isVideo ? 'video' : 'in_person';

  let videoUrl = isVideo && (appt.location?.startsWith('http') || appt.location?.startsWith('https'))
    ? appt.location
    : `https://meet.jit.si/IML-Digit-${appt.id.slice(0, 8)}`;

  const projectName = appt.beneficiary?.projects?.[0]?.name;
  const coachFullName = `${appt.user.firstName} ${appt.user.lastName}`.trim();
  const beneficiaryFullName = `${appt.beneficiary?.firstName || ''} ${appt.beneficiary?.lastName || ''}`.trim() || 'Porteur de projet';

  let beneficiarySent = false;
  let coachSent = false;

  // 1. Bénéficiaire
  if (appt.beneficiary?.email && appt.beneficiary.email.includes('@')) {
    const res = await sendAppointmentReminderEmail({
      recipientEmail: appt.beneficiary.email,
      recipientName: beneficiaryFullName,
      isCoach: false,
      partnerName: coachFullName,
      partnerRole: 'Coach Référent',
      datetime: formattedFullDate,
      formattedDateOnly,
      formattedTimeOnly,
      durationMinutes: appt.duration,
      sessionType,
      locationOrUrl: appt.location || 'Siège IML Digit',
      videoUrl,
      daysRemaining,
      projectName,
    });
    beneficiarySent = res.success;
  }

  // 2. Coach
  if (appt.user?.email && appt.user.email.includes('@')) {
    const res = await sendAppointmentReminderEmail({
      recipientEmail: appt.user.email,
      recipientName: coachFullName,
      isCoach: true,
      partnerName: beneficiaryFullName,
      partnerRole: 'Porteur de projet',
      datetime: formattedFullDate,
      formattedDateOnly,
      formattedTimeOnly,
      durationMinutes: appt.duration,
      sessionType,
      locationOrUrl: appt.location || 'Siège IML Digit',
      videoUrl,
      daysRemaining,
      projectName,
    });
    coachSent = res.success;
  }

  return {
    success: beneficiarySent || coachSent,
    message: `Rappels envoyés (Bénéficiaire: ${beneficiarySent ? 'OUI' : 'NON'}, Coach: ${coachSent ? 'OUI' : 'NON'})`,
    details: { beneficiarySent, coachSent, daysRemaining, formattedFullDate },
  };
}

/**
 * Rappels de rendez-vous déclenchés uniquement à la demande manuelle de l'agent ou de la direction
 * (aucun envoi automatique en tâche de fond par défaut).
 */
export function initAppointmentReminderScheduler(): void {
  logger.info('Service de rappels de rendez-vous prêt (déclenchement manuel uniquement, aucun cron automatique par défaut).');
}
