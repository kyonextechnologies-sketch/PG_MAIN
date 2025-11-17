import { Router } from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getTicketStats,
  acknowledgeTicket,
} from '../controllers/maintenance.controller';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';
import { validatePagination } from '../middleware/validation';
import { createMaintenanceTicketValidator, updateMaintenanceTicketValidator } from '../validators/property.validator';

const router = Router();

router.use(authenticate);

router.post('/', createMaintenanceTicketValidator, createTicket);
router.get('/', validatePagination, getAllTickets);
router.get('/stats', isOwner, getTicketStats);
router.get('/:id', getTicketById);
router.put('/:id', updateMaintenanceTicketValidator, updateTicket);
router.post('/:id/got-it', isOwner, acknowledgeTicket);
router.delete('/:id', deleteTicket);

export default router;

