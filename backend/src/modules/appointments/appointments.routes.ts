import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createAppointmentSchema, idParam, listAppointmentsSchema, updateAppointmentSchema, createSessionSchema } from './appointments.schemas';
import { createAppointment, listAppointments, updateAppointment, submitSession, deleteAppointment } from './appointments.service';
import { runDailyAppointmentReminders, sendManualAppointmentReminder } from './appointments-reminder.service';
import { prisma } from '../../database/prisma';
import { sendAppointmentNotificationEmail } from '../email/email.service';

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth, requirePermission('appointments:manage'));

appointmentsRouter.post('/reminders/run', async (req, res, next) => {
  try {
    const force = req.query.force === 'true';
    const result = await runDailyAppointmentReminders(force);
    res.json(result);
  } catch (e) { next(e); }
});

appointmentsRouter.post('/:id/reminder', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const result = await sendManualAppointmentReminder(id);
    res.json(result);
  } catch (e) { next(e); }
});

appointmentsRouter.post('/:id/resend-convocation', async (req, res, next) => {
  try {
    const id = idParam.parse(req.params.id);
    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        beneficiary: {
          include: {
            projects: { select: { name: true } },
            application: { select: { seqNumber: true, status: true } },
          },
        },
        user: true,
      }
    });
    if (!appt || !appt.beneficiary) {
      return res.status(404).json({ success: false, message: 'Rendez-vous introuvable' });
    }
    const locLower = (appt.location || '').toLowerCase();
    const isVideo = locLower.includes('http') || locLower.includes('meet') || locLower.includes('visio');
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(appt.datetime));

    let targetEmail = (appt.beneficiary.email || '').trim();
    if (targetEmail.toLowerCase().endsWith('@glail.com')) {
      targetEmail = targetEmail.replace(/@glail\.com$/i, '@gmail.com');
      prisma.beneficiary.update({
        where: { id: appt.beneficiary.id },
        data: { email: targetEmail },
      }).catch(() => {});
    }

    const benDocs = await prisma.document.findMany({
      where: { ownerId: appt.beneficiary.id, ownerType: 'BENEFICIARY' },
      select: { title: true, category: true, status: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    const seqNum = appt.beneficiary.application?.seqNumber || appt.beneficiary.fileSeq || 1;
    const referenceCode = `IML-2026-${String(seqNum).padStart(4, '0')}`;

    const result = await sendAppointmentNotificationEmail({
      recipientEmail: targetEmail,
      recipientName: `${appt.beneficiary.firstName} ${appt.beneficiary.lastName}`,
      coachName: `${appt.user.firstName} ${appt.user.lastName}`,
      coachEmail: appt.user.email || undefined,
      datetime: formattedDate,
      durationMinutes: appt.duration,
      sessionType: isVideo ? 'video' : 'in_person',
      locationOrUrl: appt.location || 'Siège IML Digit - Espace PME, Libreville',
      referenceCode,
      companyName: appt.beneficiary.projects?.[0]?.name || undefined,
      applicationStatus: appt.beneficiary.application?.status || appt.beneficiary.status,
      documents: benDocs,
    });
    res.json(result);
  } catch (e) { next(e); }
});

appointmentsRouter.get('/', async (req, res, next) => {
  try { res.json({ items: await listAppointments(listAppointmentsSchema.parse(req.query), req.auth!) }); }
  catch (e) { next(e); }
});

appointmentsRouter.post('/', async (req, res, next) => {
  try {
    const appt = await createAppointment(createAppointmentSchema.parse(req.body), req.auth!);
    res.status(201).json({ appointment: appt, receipt: (appt as any).receipt });
  }
  catch (e) { next(e); }
});

appointmentsRouter.patch('/:id', async (req, res, next) => {
  try { res.json({ appointment: await updateAppointment(idParam.parse(req.params.id), updateAppointmentSchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});

appointmentsRouter.delete('/:id', async (req, res, next) => {
  try { 
    await deleteAppointment(idParam.parse(req.params.id), req.auth!);
    res.json({ success: true, message: 'RDV supprimé avec succès' });
  } catch (e) { next(e); }
});

appointmentsRouter.post('/:id/session', async (req, res, next) => {
  try { res.status(201).json({ session: await submitSession(idParam.parse(req.params.id), createSessionSchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});
