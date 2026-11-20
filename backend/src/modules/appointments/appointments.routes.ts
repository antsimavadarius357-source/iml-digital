import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createAppointmentSchema, idParam, listAppointmentsSchema, updateAppointmentSchema, createSessionSchema } from './appointments.schemas';
import { createAppointment, listAppointments, updateAppointment, submitSession, deleteAppointment } from './appointments.service';
import { runDailyAppointmentReminders, sendManualAppointmentReminder } from './appointments-reminder.service';

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
