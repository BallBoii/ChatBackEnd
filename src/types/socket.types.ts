import { PublicRoomDTO } from '@/types/room.types';

// Socket.IO event types
export interface ServerToClientEvents {
  // Users events
  username_set: (data: { username: string }) => void;
  active_users: (data: { users: string[] }) => void;

  // Public rooms events
  public_rooms_update: (data: {
    rooms: PublicRoomDTO[];
  }) => void;

  // Room events
  room_joined: (data: {
    roomToken: string;
    participantCount: number;
    participants: string[]; // Array of all nicknames in the room
    messages: any[]; // Message history when joining
  }) => void;
  room_left: (data: { nickname: string }) => void;
  room_closed: (data: { reason: string }) => void;
  room_ttl_warning: (data: { expiresIn: number }) => void;

  // Message events
  new_message: (data: any) => void;
  message_deleted: (data: { messageId: string }) => void;

  // System events
  user_joined: (data: {
    nickname: string;
    participantCount: number;
    participants: string[];
  }) => void;
  user_left: (data: {
    nickname: string;
    participantCount: number;
    participants: string[];
  }) => void;
  error: (data: { message: string; code?: string }) => void;

  // Session events
  session_created: (data: { sessionToken: string; nickname: string }) => void;
}

export interface ClientToServerEvents {
  // Users events
  set_username: (data: { username: string }) => void;
  get_active_users: () => void;

  // Room events
  get_public_rooms: () => void;
  join_room: (data: { roomToken: string; sessionToken: string }) => void;
  leave_room: () => void;
  
  // Message events
  send_message: (data: any) => void;
  delete_message: (data: { messageId: string }) => void;
  
  // Heartbeat
  heartbeat: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  sessionToken?: string;
  nickname?: string;
  roomId?: string;
  roomToken?: string;
  lastMessageTime?: number;
  messageCount?: number;
}
