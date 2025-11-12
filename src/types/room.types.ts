// Room-related types
export interface RoomData {
  id: string;
  token: string;
  name?: string;
  isPublic: boolean;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  participantCount?: number;
}

export interface CreateRoomDTO {
  name?: string;
  ttlHours?: number;
  isPublic?: boolean;
}

export interface JoinRoomDTO {
  token: string;
  nickname: string;
}

export interface RoomInfoDTO {
  token: string;
  name?: string;
  isPublic: boolean;
  expiresAt: Date;
  participantCount: number;
  createdAt: Date;
}

export interface PublicRoomDTO {
  token: string;
  name?: string;
  participantCount: number;
  expiresAt: Date;
  createdAt: Date;
}
