import { Server, Socket } from 'socket.io';
import roomService from '@/services/RoomService';
import sessionService from '@/services/SessionService';
import messageService from '@/services/MessageService';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '@/types/socket.types';
import { MessageType } from '@/types/message.types';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const setupSocketHandlers = (io: TypedServer) => {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    /**
     * Join a room
     */
    socket.on('join_room', async ({ roomToken, sessionToken }) => {
      try {

        if (socket.data.roomId && socket.data.roomToken === roomToken) {
          return; // Already in the room
        }

        // Validate session
        const { sessionId, roomId, nickname } = await sessionService.validateSession(sessionToken);

        // Store session data in socket
        socket.data.sessionToken = sessionToken;
        socket.data.nickname = nickname;
        socket.data.roomId = roomId;
        socket.data.roomToken = roomToken;
        socket.data.messageCount = 0;
        socket.data.lastMessageTime = 0;

        // Join the room
        socket.join(roomId);

        // Get all connected sockets in the room
        const socketsInRoom = await io.in(roomId).fetchSockets();
        const participantCount = socketsInRoom.length;
        
        // Get all nicknames of participants in the room
        const participants = socketsInRoom
          .map(s => s.data.nickname)
          .filter((n): n is string => !!n);

        // Load and send message history to the joining user
        const messageHistory = await messageService.getRoomMessages(roomId);
        
        // Notify the user with room info and message history
        socket.emit('room_joined', { 
          roomToken, 
          participantCount,
          participants, // Send list of all nicknames
          messages: messageHistory // Send message history
        });

        // Notify ONLY others in the room (not the joining user to avoid duplicate)
        socket.to(roomId).emit('user_joined', { nickname, participantCount, participants });

        console.log(`[WebSocket] ${nickname} joined room ${roomToken} (loaded ${messageHistory.length} messages)`);

        // Check room TTL and send warning if needed
        const ttlInfo = await roomService.checkRoomTTL(roomId);
        if (ttlInfo.shouldWarn) {
          socket.emit('room_ttl_warning', { expiresIn: ttlInfo.expiresIn });
        }
      } catch (error: any) {
        console.error('[WebSocket] Join room error:', error);
        socket.emit('error', { 
          message: error.message || 'Failed to join room',
          code: error.code 
        });
      }
    });

    /**
     * Send a message
     */
    socket.on('send_message', async (data) => {
      try {
        const { sessionToken, roomId, nickname } = socket.data;

        if (!sessionToken || !roomId || !nickname) {
          socket.emit("error", {
            message: "Not connected to a room",
            code: "NOT_IN_ROOM",
          });
          return;
        }

        // Validate session
        const session = await sessionService.validateSession(sessionToken);

        // Send the message with nickname (attachments are already created in the database)
        const message = await messageService.sendMessage(
          session.sessionId,
          nickname,
          roomId,
          data.type as MessageType,
          data.content || null,
          data.attachments
        );

        // Broadcast to all in the room (including sender)
        io.to(roomId).emit("new_message", {
          id: message.id,
          type: message.type,
          content: message.content,
          nickname: nickname || message.nickname,
          createdAt: message.createdAt,
          attachments: message.attachments,
        });

        console.log(`[WebSocket] Message sent in room by ${nickname}`);
      } catch (error: any) {
        console.error('[WebSocket] Send message error:', error);
        socket.emit('error', { 
          message: error.message || 'Failed to send message',
          code: error.code 
        });
      }
    });

    /**
     * Delete a message
     */
    socket.on('delete_message', async ({ messageId }) => {
      try {
        const { sessionToken, roomId } = socket.data;

        if (!sessionToken || !roomId) {
          socket.emit('error', { message: 'Not connected to a room', code: 'NOT_IN_ROOM' });
          return;
        }

        const session = await sessionService.validateSession(sessionToken);
        await messageService.deleteMessage(messageId, session.sessionId);

        // Notify all in the room
        io.to(roomId).emit('message_deleted', { messageId });

        console.log(`[WebSocket] Message ${messageId} deleted`);
      } catch (error: any) {
        console.error('[WebSocket] Delete message error:', error);
        socket.emit('error', { 
          message: error.message || 'Failed to delete message',
          code: error.code 
        });
      }
    });

    /**
     * Leave a room
     */
    socket.on('leave_room', async () => {
      try {
        const { sessionToken, roomId, nickname, roomToken } = socket.data;

        if (!sessionToken || !roomId) {
          return;
        }

        // Leave the socket room
        socket.leave(roomId);

        // Get updated participant count and nicknames
        const socketsInRoom = await io.in(roomId).fetchSockets();
        const participantCount = socketsInRoom.length;
        const participants = socketsInRoom
          .map(s => s.data.nickname)
          .filter((n): n is string => !!n);

        // Notify others
        socket.to(roomId).emit('user_left', { nickname: nickname || 'Unknown', participantCount, participants });

        // Delete session
        await sessionService.removeSession(sessionToken);

        console.log(`[WebSocket] ${nickname} left room ${roomToken}`);

        // Clear socket data
        socket.data = {};
      } catch (error: any) {
        console.error('[WebSocket] Leave room error:', error);
      }
    });

    /**
     * Heartbeat to keep session alive
     */
    socket.on('heartbeat', async () => {
      try {
        const { sessionToken } = socket.data;
        if (sessionToken) {
          await sessionService.validateSession(sessionToken);
        }
      } catch (error) {
        socket.emit('error', { message: 'Session expired', code: 'SESSION_EXPIRED' });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      try {
        const { sessionToken, roomId, nickname, roomToken } = socket.data;

        console.log(`[WebSocket] Client disconnected: ${socket.id}`);

        if (sessionToken && roomId) {
          // Get participant count and nicknames before removing
          const socketsInRoom = await io.in(roomId).fetchSockets();
          const participantCount = socketsInRoom.length - 1;
          const participants = socketsInRoom
            .filter(s => s.id !== socket.id) // Exclude the disconnecting socket
            .map(s => s.data.nickname)
            .filter((n): n is string => !!n);

          // Notify others
          io.to(roomId).emit('user_left', { 
            nickname: nickname || 'Unknown', 
            participantCount: Math.max(0, participantCount),
            participants
          });

          // Delete session
          await sessionService.removeSession(sessionToken);

          console.log(`[WebSocket] ${nickname} disconnected from room ${roomToken}`);
        }
      } catch (error) {
        console.error('[WebSocket] Disconnect cleanup error:', error);
      }
    });
  });

  // Periodic room TTL warnings
  setInterval(async () => {
    try {
      const expiringRooms = await roomService.getExpiringRooms(5); // 5 minutes warning

      for (const room of expiringRooms) {
        const now = new Date();
        const expiresIn = Math.floor((room.expiresAt.getTime() - now.getTime()) / 1000);
        
        if (expiresIn > 0) {
          io.to(room.id).emit('room_ttl_warning', { expiresIn });
        }
      }
    } catch (error) {
      console.error('[WebSocket] TTL warning error:', error);
    }
  }, 60000); // Check every minute

  console.log('[WebSocket] Socket handlers initialized');
};

