import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requirePermission } from '../../middleware/auth';
import {
  availabilityQuerySchema,
  createRoomBookingSchema,
  decideRoomBookingSchema,
  idParam,
  listRoomBookingsSchema,
  updateRoomBookingSchema,
} from './rooms.schemas';
import { createRoomBooking, decideRoomBooking, deleteRoomBooking, getDayAvailability, listRoomBookings, updateRoomBooking } from './rooms.service';

export const roomsRouter = Router();

// Anti-spam sur la création publique : 10 demandes / heure / IP
const publicBookingLimiter = rateLimit({ windowMs: 3600_000, limit: 10, standardHeaders: true, legacyHeaders: false });

// ---- Routes publiques (aucune candidature requise) ----
roomsRouter.get('/public/availability', async (req, res, next) => {
  try {
    const { date } = availabilityQuerySchema.parse(req.query);
    res.json(await getDayAvailability(date));
  } catch (e) { next(e); }
});

roomsRouter.post('/public/bookings', publicBookingLimiter, async (req, res, next) => {
  try {
    const booking = await createRoomBooking(createRoomBookingSchema.parse(req.body));
    res.status(201).json({ booking });
  } catch (e) { next(e); }
});

// ---- Routes internes (agent de planification / direction / administrateur) ----
roomsRouter.use(requireAuth, requirePermission('dashboard:read'));

roomsRouter.get('/bookings', async (req, res, next) => {
  try { res.json({ items: await listRoomBookings(listRoomBookingsSchema.parse(req.query)) }); }
  catch (e) { next(e); }
});

roomsRouter.patch('/bookings/:id', async (req, res, next) => {
  try {
    res.json({ booking: await decideRoomBooking(idParam.parse(req.params.id), decideRoomBookingSchema.parse(req.body), req.auth!) });
  } catch (e) { next(e); }
});

roomsRouter.patch('/bookings/:id/reschedule', async (req, res, next) => {
  try {
    res.json({ booking: await updateRoomBooking(idParam.parse(req.params.id), updateRoomBookingSchema.parse(req.body), req.auth!) });
  } catch (e) { next(e); }
});

roomsRouter.delete('/bookings/:id', async (req, res, next) => {
  try {
    await deleteRoomBooking(idParam.parse(req.params.id), req.auth!, req.ip);
    res.status(200).json({ success: true, message: 'Réservation supprimée avec succès' });
  } catch (e) { next(e); }
});

