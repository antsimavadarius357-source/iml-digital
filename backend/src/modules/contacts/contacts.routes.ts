import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requirePermission } from '../../middleware/auth';
import {
  createContactMessageSchema,
  listContactMessagesSchema,
  updateContactMessageSchema,
} from './contacts.schemas';
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessageById,
  listContactMessages,
  updateContactMessage,
} from './contacts.service';

export const contactsRouter = Router();

// Anti-spam sur le formulaire de contact public : 15 messages / heure / IP
const contactLimiter = rateLimit({
  windowMs: 3600_000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de messages envoyés, veuillez réessayer dans une heure' },
});

// Route publique : soumission depuis le formulaire du site web /contact
contactsRouter.post('/', contactLimiter, async (req, res, next) => {
  try {
    const data = createContactMessageSchema.parse(req.body);
    const contact = await createContactMessage(data);
    res.status(201).json({
      success: true,
      message: 'Votre message a bien été transmis à l\'équipe IML Digit. Nous vous répondrons sous 24h.',
      contact,
    });
  } catch (e) {
    next(e);
  }
});

// ---- Routes d'administration / consultation interne (Agent, Direction, Coach) ----
contactsRouter.use(requireAuth, requirePermission('contacts:read'));

contactsRouter.get('/', async (req, res, next) => {
  try {
    const query = listContactMessagesSchema.parse(req.query);
    const result = await listContactMessages(query);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

contactsRouter.get('/:id', async (req, res, next) => {
  try {
    const contact = await getContactMessageById(req.params.id);
    res.json({ contact });
  } catch (e) {
    next(e);
  }
});

contactsRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = updateContactMessageSchema.parse(req.body);
    const contact = await updateContactMessage(req.params.id, data, req.auth!);
    res.json({ contact });
  } catch (e) {
    next(e);
  }
});

contactsRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteContactMessage(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
