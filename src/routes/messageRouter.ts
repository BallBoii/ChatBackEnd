import { BaseRouter } from './baseRouter';
import messageController from '@/controllers/MessageController';

export class MessageRouter extends BaseRouter {
  constructor() {
    super({
      prefix: ''
    });
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get messages for a room (requires sessionToken in Authorization header)
    this.router.get('/:roomToken', messageController.getMessages.bind(messageController));
  }
}
