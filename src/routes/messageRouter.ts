import { Router } from 'express';
import messageController from '@/controllers/MessageController';

const router = Router();

// Get messages for a room (requires sessionToken in Authorization header)
router.get('/:roomToken', messageController.getMessages.bind(messageController));

export default router;
