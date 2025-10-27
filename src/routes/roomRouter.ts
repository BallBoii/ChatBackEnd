import { Router } from 'express';
import roomController from '@/controllers/RoomController';
import { rateLimiter } from '@/middlewares/rateLimiter';
import { config } from '@/config/config';

const router = Router();

// Create a new room (rate limited)
router.post(
  '/',
  rateLimiter(config.RATE_LIMIT_ROOM_CREATE_PER_HOUR, 60 * 60 * 1000),
  roomController.createRoom.bind(roomController)
);

// Get room information
router.get('/:token', roomController.getRoomInfo.bind(roomController));

// Validate room token
router.get('/:token/validate', roomController.validateRoom.bind(roomController));

// Join a room (create session)
router.post('/:token/join', roomController.joinRoom.bind(roomController));

export default router;
