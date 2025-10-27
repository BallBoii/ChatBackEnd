// Session-related types
export interface SessionData {
  id: string;
  roomId: string;
  nickname: string;
  sessionToken: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface CreateSessionDTO {
  roomId: string;
  nickname: string;
}

export interface SessionResponseDTO {
  sessionToken: string;
  nickname: string;
  roomToken: string;
}
