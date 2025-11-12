import { BaseRouter } from './baseRouter';
import roomController from '@/controllers/RoomController';
import { rateLimiter } from '@/middlewares/rateLimiter';
import { config } from '@/config/config';

export class RoomRouter extends BaseRouter {
  constructor() {
    super({
      prefix: ''
    });
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Create a new room (rate limited)
    this.router.post(
      '/',
      rateLimiter(config.RATE_LIMIT_ROOM_CREATE_PER_HOUR, 60 * 60 * 1000),
      roomController.createRoom.bind(roomController)
    );

    // Get all public rooms
    this.router.get('/public', roomController.getPublicRooms.bind(roomController));

    // Get room information
    this.router.get('/:token', roomController.getRoomInfo.bind(roomController));

    // Validate room token
    this.router.get('/:token/validate', roomController.validateRoom.bind(roomController));

    // Join a room (create session)
    this.router.post('/:token/join', roomController.joinRoom.bind(roomController));
  }
}
