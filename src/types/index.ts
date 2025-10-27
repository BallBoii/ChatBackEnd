// Re-export all types from specific modules
export * from './room.types';
export * from './session.types';
export * from './message.types';
export * from './socket.types';

// Legacy types for backwards compatibility (if needed)
export interface JoinRoomData {
  roomId: string;
  userId: string;
  username: string;
}

export interface SendMessageData {
  roomId: string;
  userId: string;
  content: string;
}

export interface CreateRoomData {
  name: string;
  userId: string;
}

export interface UserData {
  userId: string;
  username: string;
}
