import { Request, Response, NextFunction } from 'express';
import roomService from '@/services/RoomService';
import sessionService from '@/services/SessionService';
import { AppError } from '@/types/error/AppError';

export class RoomController {
  /**
   * Create a new room
   * POST /api/rooms
   */
  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { ttlHours, name, isPublic, isDM } = req.body;

      const room = await roomService.createRoom({ ttlHours, name, isPublic, isDM });

      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get room information
   * GET /api/rooms/:token
   */
  async getRoomInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      const roomInfo = await roomService.getRoomInfo(token);

      res.status(200).json({
        success: true,
        data: roomInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Join a room (create session)
   * POST /api/rooms/:token/join
   */
  async joinRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { nickname } = req.body;

      if (!nickname) {
        throw new AppError('Nickname is required', 400, 'MISSING_NICKNAME');
      }

      // Validate room
      const roomId = await roomService.validateRoom(token);

      // Create session
      const session = await sessionService.createSession({ roomId, nickname });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check for room (validate token)
   * GET /api/rooms/:token/validate
   */
  async validateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      await roomService.validateRoom(token);

      res.status(200).json({
        success: true,
        message: 'Room is valid',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all public rooms
   * GET /api/rooms/public
   */
  async getPublicRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await roomService.getPublicRooms();

      res.status(200).json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RoomController();
