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
