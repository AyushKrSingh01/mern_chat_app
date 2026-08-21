import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { createRoom, getMyRooms, getRoomMessages } from '../controllers/roomController';

const router = Router();

router.use(requireAuth);
router.post('/', createRoom);
router.get('/', getMyRooms);
router.get('/:roomId/messages', getRoomMessages);

export default router;