import messageRepository from '@/repository/MessageRepository';
import { AppError } from '@/types/error/AppError';
import { MessageType, SendMessageDTO, MessageResponseDTO, AttachmentData } from '@/types/message.types';
import { config } from '@/config/config';

export class MessageService {
  /**
   * Send a message
   */
  async sendMessage(
    sessionId: string,
    nickname: string,
    roomId: string,
    type: MessageType,
    content: string | null,
    attachments?: Omit<AttachmentData, 'id'>[]
  ): Promise<MessageResponseDTO> {
    // Validate message
    this.validateMessage(type, content, attachments);

    // Check rate limit
    await this.checkRateLimit(sessionId);

    // Create message with nickname
    const message = await messageRepository.create(
      roomId,
      sessionId,
      nickname,
      type,
      content,
      attachments
    );

    return {
      id: message.id,
      type: message.type as MessageType,
      content: message.content,
      nickname: message.nickname,
      createdAt: message.createdAt,
      attachments: message.attachments,
    };
  }

  /**
   * Get messages for a room
   */
  async getRoomMessages(
    roomId: string,
    limit: number = 50,
    before?: Date
  ): Promise<MessageResponseDTO[]> {
    const messages = await messageRepository.findByRoomId(roomId, limit, before);

    return messages.map((msg) => ({
      id: msg.id,
      type: msg.type as MessageType,
      content: msg.content,
      nickname: msg.nickname,
      createdAt: msg.createdAt,
      attachments: msg.attachments,
    })).reverse(); // Return in chronological order
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, sessionId: string): Promise<void> {
    const message = await messageRepository.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Only the sender can delete their message
    if (message.sessionId !== sessionId) {
      throw new AppError('You can only delete your own messages', 403, 'FORBIDDEN');
    }

    await messageRepository.softDelete(messageId);
  }

  /**
   * Validate message content
   */
  private validateMessage(
    type: MessageType,
    content: string | null,
    attachments?: Omit<AttachmentData, 'id'>[]
  ): void {
    switch (type) {
      case MessageType.TEXT:
        if (!content || content.trim().length === 0) {
          throw new AppError('Text message cannot be empty', 400, 'INVALID_MESSAGE');
        }
        if (content.length > config.MAX_MESSAGE_LENGTH) {
          throw new AppError(
            `Message exceeds maximum length of ${config.MAX_MESSAGE_LENGTH} characters`,
            400,
            'MESSAGE_TOO_LONG'
          );
        }
        break;

      case MessageType.STICKER:
        if (!content || content.trim().length === 0) {
          throw new AppError('Sticker code cannot be empty', 400, 'INVALID_MESSAGE');
        }
        break;

      case MessageType.IMAGE:
      case MessageType.FILE:
        if (!attachments || attachments.length === 0) {
          throw new AppError(
            `${type} message must have attachments`,
            400,
            'MISSING_ATTACHMENT'
          );
        }
        // Validate attachment size
        attachments.forEach((att) => {
          const maxSizeBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024;
          if (att.fileSize > maxSizeBytes) {
            throw new AppError(
              `File size exceeds maximum of ${config.MAX_FILE_SIZE_MB}MB`,
              400,
              'FILE_TOO_LARGE'
            );
          }
        });
        break;

      default:
        throw new AppError('Invalid message type', 400, 'INVALID_MESSAGE_TYPE');
    }
  }

  /**
   * Check rate limiting for messages
   */
  private async checkRateLimit(sessionId: string): Promise<void> {
    const recentCount = await messageRepository.countRecentBySession(
      sessionId,
      1 // Check last 1 minute
    );

    if (recentCount >= config.RATE_LIMIT_MESSAGES_PER_MINUTE) {
      throw new AppError(
        'You are sending messages too quickly. Please slow down.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
  }

  /**
   * Get message count for a room
   */
  async getMessageCount(roomId: string): Promise<number> {
    return await messageRepository.countByRoomId(roomId);
  }
}

export default new MessageService();
