// Message-related types
export enum MessageType {
  TEXT = 'TEXT',
  STICKER = 'STICKER',
  IMAGE = 'IMAGE',
  FILE = 'FILE'
}

export interface AttachmentData {
  id?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface MessageData {
  id: string;
  roomId: string;
  sessionId: string;
  type: MessageType;
  content: string | null;
  createdAt: Date;
  editedAt: Date | null;
  isDeleted: boolean;
  nickname: string;
  attachments?: AttachmentData[];
}

export interface SendMessageDTO {
  roomToken: string;
  sessionToken: string;
  type: MessageType;
  content?: string;
  attachments?: Omit<AttachmentData, 'id'>[];
}

export interface MessageResponseDTO {
  id: string;
  type: MessageType;
  content: string | null;
  nickname: string;
  createdAt: Date;
  attachments?: AttachmentData[];
}
