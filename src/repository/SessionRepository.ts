import prisma from '@/config/database';
import { Session } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 32);

export class SessionRepository {
  /**
   * Create a new session for a room
   */
  async create(roomId: string, nickname: string): Promise<Session> {
    const sessionToken = this.generateSessionToken();

    return await prisma.session.create({
      data: {
        roomId,
        nickname,
        sessionToken,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Find a session by its token
   */
  async findByToken(sessionToken: string): Promise<Session | null> {
    return await prisma.session.findUnique({
      where: { sessionToken },
    });
  }

  /**
   * Find a session by ID
   */
  async findById(id: string): Promise<Session | null> {
    return await prisma.session.findUnique({
      where: { id },
    });
  }

  /**
   * Get all sessions in a room
   */
  async findByRoomId(roomId: string): Promise<Session[]> {
    return await prisma.session.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(sessionToken: string): Promise<Session> {
    return await prisma.session.update({
      where: { sessionToken },
      data: { lastActiveAt: new Date() },
    });
  }

  /**
   * Delete a session
   */
  async delete(sessionToken: string): Promise<Session> {
    return await prisma.session.delete({
      where: { sessionToken },
    });
  }

  /**
   * Delete all sessions in a room
   */
  async deleteByRoomId(roomId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { roomId },
    });
    return result.count;
  }

  /**
   * Count sessions in a room
   */
  async countByRoomId(roomId: string): Promise<number> {
    return await prisma.session.count({
      where: { roomId },
    });
  }

  /**
   * Check if nickname exists in room
   */
  async isNicknameInUse(roomId: string, nickname: string): Promise<boolean> {
    const count = await prisma.session.count({
      where: {
        roomId,
        nickname: {
          equals: nickname,
          mode: 'insensitive',
        },
      },
    });
    return count > 0;
  }

  /**
   * Delete inactive sessions (cleanup job)
   */
  async deleteInactive(inactiveMinutes: number): Promise<number> {
    const threshold = new Date(Date.now() - inactiveMinutes * 60 * 1000);

    const result = await prisma.session.deleteMany({
      where: {
        lastActiveAt: {
          lt: threshold,
        },
      },
    });
    return result.count;
  }

  /**
   * Generate a unique session token
   */
  private generateSessionToken(): string {
    return nanoid();
  }
}

export default new SessionRepository();
