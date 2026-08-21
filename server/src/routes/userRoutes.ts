import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { searchUsers } from '../controllers/userController';

const router = Router();
router.use(requireAuth);
router.get('/search', searchUsers);

export default router;