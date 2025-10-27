import prisma from '@/config/database';
import { Message, MessageType, Attachment } from '@prisma/client';

export class MessageRepository {
  /**
   * Create a new message
   */
  async create(
    roomId: string,
    sessionId: string,
    nickname: string,
    type: MessageType,
    content: string | null,
    attachments?: Array<Omit<Attachment, 'id' | 'messageId' | 'createdAt'>>
  ): Promise<Message & { attachments: Attachment[] }> {
    return await prisma.message.create({
      data: {
        roomId,
        sessionId,
        nickname,
        type,
        content,
        attachments: attachments
          ? {
              create: attachments,
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });
  }

  /**
   * Find a message by ID
   */
  async findById(id: string): Promise<(Message & { attachments: Attachment[] }) | null> {
    return await prisma.message.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });
  }

  /**
   * Get messages for a room with pagination
   */
  async findByRoomId(
    roomId: string,
    limit: number = 50,
    before?: Date
  ): Promise<Array<Message & { attachments: Attachment[] }>> {
    return await prisma.message.findMany({
      where: {
        roomId,
        isDeleted: false,
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      include: {
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Soft delete a message
   */
  async softDelete(messageId: string): Promise<Message> {
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: null,
      },
    });
  }

  /**
   * Hard delete messages by room ID (cleanup)
   */
  async deleteByRoomId(roomId: string): Promise<number> {
    const result = await prisma.message.deleteMany({
      where: { roomId },
    });
    return result.count;
  }

  /**
   * Count messages in a room
   */
  async countByRoomId(roomId: string): Promise<number> {
    return await prisma.message.count({
      where: {
        roomId,
        isDeleted: false,
      },
    });
  }

  /**
   * Get recent messages count for a session (for rate limiting)
   */
  async countRecentBySession(sessionId: string, withinMinutes: number): Promise<number> {
    const threshold = new Date(Date.now() - withinMinutes * 60 * 1000);

    return await prisma.message.count({
      where: {
        sessionId,
        createdAt: {
          gte: threshold,
        },
      },
    });
  }

  /**
   * Update message content (for edits)
   */
  async update(messageId: string, content: string): Promise<Message> {
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedAt: new Date(),
      },
    });
  }

  /**
   * Get message with full details
   */
  async findWithDetails(messageId: string) {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        attachments: true,
        session: {
          select: {
            nickname: true,
          },
        },
      },
    });
  }
}

export default new MessageRepository();
