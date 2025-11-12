import prisma from '@/config/database';
import { Room, Session } from '@prisma/client';
import { customAlphabet } from 'nanoid';

// Generate a readable room token (e.g., "ghost-cat-moon-star")
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export class RoomRepository {
  /**
   * Create a new room with a unique token
   */
  async create(ttlHours: number, name?: string, isPublic: boolean = false): Promise<Room> {
    const token = this.generateRoomToken();
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    return await prisma.room.create({
      data: {
        token,
        name,
        isPublic,
        expiresAt,
        isActive: true,
      },
    });
  }

  /**
   * Find a room by its token
   */
  async findByToken(token: string): Promise<Room | null> {
    return await prisma.room.findUnique({
      where: { token },
    });
  }

  /**
   * Find a room by ID
   */
  async findById(id: string): Promise<Room | null> {
    return await prisma.room.findUnique({
      where: { id },
    });
  }

  /**
   * Get room with sessions count
   */
  async findByTokenWithSessions(token: string): Promise<(Room & { sessions: Session[] }) | null> {
    return await prisma.room.findUnique({
      where: { token },
      include: {
        sessions: true,
      },
    });
  }

  /**
   * Check if room is active and not expired
   */
  async isRoomValid(token: string): Promise<boolean> {
    const room = await this.findByToken(token);
    if (!room || !room.isActive) return false;
    if (room.expiresAt < new Date()) {
      await this.deactivate(room.id);
      return false;
    }
    return true;
  }

  /**
   * Deactivate a room
   */
  async deactivate(roomId: string): Promise<Room> {
    return await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });
  }

  /**
   * Count active sessions in a room
   */
  async countActiveSessions(roomId: string): Promise<number> {
    return await prisma.session.count({
      where: { roomId },
    });
  }

  /**
   * Delete expired rooms (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    const result = await prisma.room.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Generate a unique room token
   */
  private generateRoomToken(): string {
    return `ghost-${nanoid()}`;
  }

  /**
   * Get rooms expiring soon (for TTL warnings)
   */
  async findExpiringRooms(withinMinutes: number): Promise<Room[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinMinutes * 60 * 1000);

    return await prisma.room.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: now,
          lte: threshold,
        },
      },
    });
  }

  /**
   * Find all active public rooms
   */
  async findPublicRooms(): Promise<Room[]> {
    const now = new Date();
    
    return await prisma.room.findMany({
      where: {
        isPublic: true,
        isActive: true,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default new RoomRepository();
