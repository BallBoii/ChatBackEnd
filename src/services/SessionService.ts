import sessionRepository from '@/repository/SessionRepository';
import roomRepository from '@/repository/RoomRepository';
import { AppError } from '@/types/error/AppError';
import { SessionResponseDTO, CreateSessionDTO } from '@/types/session.types';

export class SessionService {
  /**
   * Create a new session in a room
   */
  async createSession(data: CreateSessionDTO): Promise<SessionResponseDTO> {
    const { roomId, nickname } = data;

    // Validate nickname
    this.validateNickname(nickname);

    // Check if room exists and is valid
    const room = await roomRepository.findById(roomId);
    if (!room) {
      throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }

    if (!room.isActive || room.expiresAt < new Date()) {
      throw new AppError('Room is no longer active', 410, 'ROOM_EXPIRED');
    }

    // Check if nickname is already in use
    const nicknameInUse = await sessionRepository.isNicknameInUse(roomId, nickname);
    if (nicknameInUse) {
      throw new AppError(
        'Nickname is already in use in this room',
        409,
        'NICKNAME_IN_USE'
      );
    }

    // Create session
    const session = await sessionRepository.create(roomId, nickname);

    return {
      sessionToken: session.sessionToken,
      nickname: session.nickname,
      roomToken: room.token,
    };
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<{ sessionId: string; roomId: string; nickname: string }> {
    const session = await sessionRepository.findByToken(sessionToken);

    if (!session) {
      throw new AppError('Invalid session', 401, 'INVALID_SESSION');
    }

    // Check if room is still active
    const room = await roomRepository.findById(session.roomId);
    if (!room || !room.isActive || room.expiresAt < new Date()) {
      await sessionRepository.delete(sessionToken);
      throw new AppError('Room is no longer active', 410, 'ROOM_EXPIRED');
    }

    // Update last active
    await sessionRepository.updateLastActive(sessionToken);

    return {
      sessionId: session.id,
      roomId: session.roomId,
      nickname: session.nickname,
    };
  }

  /**
   * Remove a session
   */
  async removeSession(sessionToken: string): Promise<void> {
    await sessionRepository.delete(sessionToken);
  }

  /**
   * Get all sessions in a room
   */
  async getRoomSessions(roomId: string) {
    return await sessionRepository.findByRoomId(roomId);
  }

  /**
   * Validate nickname format
   */
  private validateNickname(nickname: string): void {
    if (!nickname || nickname.trim().length === 0) {
      throw new AppError('Nickname cannot be empty', 400, 'INVALID_NICKNAME');
    }

    if (nickname.length < 2 || nickname.length > 20) {
      throw new AppError('Nickname must be between 2 and 20 characters', 400, 'INVALID_NICKNAME');
    }

    // Only allow alphanumeric, spaces, and basic punctuation
    const nicknameRegex = /^[a-zA-Z0-9\s._-]+$/;
    if (!nicknameRegex.test(nickname)) {
      throw new AppError(
        'Nickname can only contain letters, numbers, spaces, dots, underscores, and hyphens',
        400,
        'INVALID_NICKNAME'
      );
    }
  }

  /**
   * Cleanup inactive sessions (scheduled job)
   */
  async cleanupInactiveSessions(inactiveMinutes: number = 30): Promise<number> {
    return await sessionRepository.deleteInactive(inactiveMinutes);
  }
}

export default new SessionService();
