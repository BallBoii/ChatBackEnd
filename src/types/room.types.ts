// Room-related types
export interface RoomData {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  participantCount?: number;
}

export interface CreateRoomDTO {
  ttlHours?: number;
}

export interface JoinRoomDTO {
  token: string;
  nickname: string;
}

export interface RoomInfoDTO {
  token: string;
  expiresAt: Date;
  participantCount: number;
  createdAt: Date;
}
