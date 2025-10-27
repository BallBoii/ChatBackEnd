import { Request, Response, NextFunction } from 'express';
import messageService from '@/services/MessageService';
import sessionService from '@/services/SessionService';
import { MessageType } from '@/types/message.types';

export class MessageController {
  /**
   * Get messages for a room
   * GET /api/messages/:roomToken
   * Requires sessionToken in Authorization header
   */
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomToken } = req.params;
      const { limit, before } = req.query;
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');

      if (!sessionToken) {
        return res.status(401).json({
          success: false,
          error: 'Session token required',
        });
      }

      // Validate session
      const { roomId } = await sessionService.validateSession(sessionToken);

      const messages = await messageService.getRoomMessages(
        roomId,
        limit ? parseInt(limit as string) : 50,
        before ? new Date(before as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
