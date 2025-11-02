import { Router } from 'express';
import {
  createRoom,
  getRoomsByProperty,
  getRoomById,
  updateRoom,
  deleteRoom,
  createBed,
  getBedsByRoom,
  updateBed,
  deleteBed,
  fixMissingBeds,
  diagnosticBeds,
} from '../controllers/room.controller';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';

const router = Router();

// ✅ Diagnostic endpoint (PUBLIC - no auth required)
router.get('/diagnostic', require('../controllers/room.controller').diagnosticBeds);

// ✅ Middleware for authentication and role check
router.use(authenticate, isOwner);

/**
 * ================================
 * ROOM ROUTES
 * ================================
 */

// Create new room
router.post('/', createRoom);

// Get all rooms by property ID
router.get('/property/:propertyId', getRoomsByProperty);

// ✅ Fix missing beds for existing rooms
router.post('/fix-beds', fixMissingBeds);

// Get specific room by ID
router.get('/id/:id', getRoomById);

// Update specific room by ID
router.put('/id/:id', updateRoom);

// Delete specific room by ID
router.delete('/id/:id', deleteRoom);

/**
 * ================================
 * BED ROUTES
 * ================================
 */

// Create bed inside a room
router.post('/beds', createBed);

// Get all beds for a given room
router.get('/beds/:roomId', getBedsByRoom);

// Update bed by ID
router.put('/beds/:id', updateBed);

// Delete bed by ID
router.delete('/beds/:id', deleteBed);

export default router;
