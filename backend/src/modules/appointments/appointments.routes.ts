import { Router } from 'express';
import { requireAuth, requirePermission } from '../../middleware/auth';
import { createAppointmentSchema, idParam, listAppointmentsSchema, updateAppointmentSchema, createSessionSchema } from './appointments.schemas';
import { createAppointment, listAppointments, updateAppointment, submitSession } from './appointments.service';

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth, requirePermission('appointments:manage'));

appointmentsRouter.get('/', async (req, res, next) => {
  try { res.json({ items: await listAppointments(listAppointmentsSchema.parse(req.query), req.auth!) }); }
  catch (e) { next(e); }
});

appointmentsRouter.post('/', async (req, res, next) => {
  try { res.status(201).json({ appointment: await createAppointment(createAppointmentSchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});

appointmentsRouter.patch('/:id', async (req, res, next) => {
  try { res.json({ appointment: await updateAppointment(idParam.parse(req.params.id), updateAppointmentSchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});

appointmentsRouter.post('/:id/session', async (req, res, next) => {
  try { res.status(201).json({ session: await submitSession(idParam.parse(req.params.id), createSessionSchema.parse(req.body), req.auth!) }); }
  catch (e) { next(e); }
});
