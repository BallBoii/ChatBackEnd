import roomRepository from '@/repository/RoomRepository';
import sessionRepository from '@/repository/SessionRepository';
import { AppError } from '@/types/error/AppError';
import { config } from '@/config/config';
import { RoomInfoDTO, CreateRoomDTO, PublicRoomDTO } from '@/types/room.types';

export class RoomService {
  /**
   * Create a new room
   */
  async createRoom(data?: CreateRoomDTO): Promise<{ token: string; name?: string; expiresAt: Date }> {
    const ttlHours = data?.ttlHours || config.ROOM_TTL_HOURS;
    const name = data?.name;
    const isPublic = data?.isPublic || false;

    const room = await roomRepository.create(ttlHours, name, isPublic);

    return {
      token: room.token,
      name: room.name || undefined,
      expiresAt: room.expiresAt,
    };
  }

  /**
   * Get room information
   */
  async getRoomInfo(token: string): Promise<RoomInfoDTO> {
    const room = await roomRepository.findByTokenWithSessions(token);

    if (!room) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    if (!room.isActive || room.expiresAt < new Date()) {
      throw new AppError('Room is no longer active', 410, 'ROOM_EXPIRED');
    }

    const participantCount = room.sessions.length;

    return {
      token: room.token,
      name: room.name || undefined,
      isPublic: room.isPublic,
      expiresAt: room.expiresAt,
      participantCount,
      createdAt: room.createdAt,
    };
  }

  /**
   * Validate room token
   */
  async validateRoom(token: string): Promise<string> {
    const room = await roomRepository.findByToken(token);

    if (!room) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    if (!room.isActive) {
      throw new AppError('Room is no longer active', 410, 'ROOM_INACTIVE');
    }

    if (room.expiresAt < new Date()) {
      await roomRepository.deactivate(room.id);
      throw new AppError('Room has expired', 410, 'ROOM_EXPIRED');
    }

    // Check capacity
    const sessionCount = await roomRepository.countActiveSessions(room.id);
    if (sessionCount >= config.ROOM_MAX_CAPACITY) {
      throw new AppError('Room is at maximum capacity', 403, 'ROOM_FULL');
    }

    return room.id;
  }

  /**
   * Check if room is expiring soon
   */
  async checkRoomTTL(roomId: string): Promise<{ expiresIn: number; shouldWarn: boolean }> {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    const now = new Date();
    const expiresIn = Math.floor((room.expiresAt.getTime() - now.getTime()) / 1000); // seconds

    // Warn if less than 5 minutes remaining
    const shouldWarn = expiresIn > 0 && expiresIn <= 300;

    return { expiresIn, shouldWarn };
  }

  /**
   * Deactivate a room
   */
  async deactivateRoom(roomId: string): Promise<void> {
    await roomRepository.deactivate(roomId);
    await sessionRepository.deleteByRoomId(roomId);
  }

  /**
   * Cleanup expired rooms (scheduled job)
   */
  async cleanupExpiredRooms(): Promise<number> {
    return await roomRepository.deleteExpired();
  }

  /**
   * Get rooms that are expiring soon
   */
  async getExpiringRooms(withinMinutes: number = 5) {
    return await roomRepository.findExpiringRooms(withinMinutes);
  }

  /**
   * Get all public rooms
   */
  async getPublicRooms(): Promise<PublicRoomDTO[]> {
    const rooms = await roomRepository.findPublicRooms();
    
    // Get participant count for each room
    const roomsWithParticipants = await Promise.all(
      rooms.map(async (room) => {
        const participantCount = await roomRepository.countActiveSessions(room.id);
        return {
          token: room.token,
          name: room.name || undefined,
          participantCount,
          expiresAt: room.expiresAt,
          createdAt: room.createdAt,
        };
      })
    );

    return roomsWithParticipants;
  }
}

export default new RoomService();
