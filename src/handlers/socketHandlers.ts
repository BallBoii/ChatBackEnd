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
  // Helper function to broadcast active users
  const broadcastActiveUsers = async () => {
    const allSockets = await io.fetchSockets();
    const activeUsers = allSockets
      .map((s) => s.data.nickname)
      .filter((n): n is string => !!n);
    
    io.emit("active_users", { users: [...new Set(activeUsers)] }); // Remove duplicates
  };

  // Helper function to broadcast public rooms
  const broadcastPublicRooms = async () => {
    try {
      const publicRooms = await roomService.getPublicRooms();
      io.emit("public_rooms_update", { rooms: publicRooms });
    } catch (error) {
      console.error("[WebSocket] Failed to broadcast public rooms:", error);
    }
  };


  io.on('connection', (socket: TypedSocket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    /**
     * Set username (before joining a room)
     */
    socket.on("set_username", async ({ username }) => {
      try {
        if (!username || typeof username !== "string") {
          socket.emit("error", {
            message: "No Username provided",
            code: "INVALID_USERNAME",
          });
          return;
        }

        const trimmedUsername = username.trim();

        // Check length
        if (trimmedUsername.length < 2) {
          socket.emit("error", {
            message: "Username must be at least 2 characters",
            code: "USERNAME_TOO_SHORT",
          });
          return;
        }

        if (trimmedUsername.length > 20) {
          socket.emit("error", {
            message: "Username must be 20 characters or less",
            code: "USERNAME_TOO_LONG",
          });
          return;
        }

        // Check if this shit existed
        const allSockets = await io.fetchSockets();
        const existingUsernames = allSockets
          .map((s) => s.data.nickname)
          .filter((n): n is string => !!n)
          .map((n) => n.toLowerCase()); // Case-insensitive comparison

        if (existingUsernames.includes(trimmedUsername.toLowerCase())) {
          socket.emit("error", {
            message: "Username is already taken",
            code: "USERNAME_TAKEN",
          });
          return;
        }
        socket.data.nickname = username;

        socket.emit("username_set", { username });
        console.log(
          `[WebSocket] Username set to ${username} for socket ${socket.id}`
        );

        await broadcastActiveUsers();
      } catch (error: any) {
        console.error("[WebSocket] Set username error:", error);
        socket.emit("error", {
          message: error.message || "Failed to set username",
          code: error.code,
        });
      }
    });

    /**
     * Get list of active users in the global server (not room-specific)
     */
    socket.on("get_active_users", async () => {
      try {
        const allSockets = await io.fetchSockets();
        const activeUsers = allSockets
          .map((s) => s.data.nickname)
          .filter((n): n is string => !!n);

        socket.emit("active_users", { users: [...new Set(activeUsers)] }); // Remove duplicates
      } catch (error: any) {
        console.error("[WebSocket] Get active users error:", error);
        socket.emit("error", {
          message: "Failed to get active users",
          code: error.code,
        });
      }
    });

    /**
     * Get public rooms list
     */
    socket.on("get_public_rooms", async () => {
      try {
        const publicRooms = await roomService.getPublicRooms();
        socket.emit("public_rooms_update", { rooms: publicRooms });
      } catch (error: any) {
        console.error("[WebSocket] Get public rooms error:", error);
        socket.emit("error", {
          message: "Failed to get public rooms",
          code: error.code || "GET_PUBLIC_ROOMS_ERROR",
        });
      }
    });

    /**
     * Join a room
     */
    socket.on("join_room", async ({ roomToken, sessionToken }) => {
      try {
        if (socket.data.roomId && socket.data.roomToken === roomToken) {
          return; // Already in the room
        }

        // Validate session
        const { sessionId, roomId, nickname } =
          await sessionService.validateSession(sessionToken);

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
          .map((s) => s.data.nickname)
          .filter((n): n is string => !!n);

        // Load and send message history to the joining user
        const messageHistory = await messageService.getRoomMessages(roomId);

        // Notify the user with room info and message history
        socket.emit("room_joined", {
          roomToken,
          participantCount,
          participants, // Send list of all nicknames
          messages: messageHistory, // Send message history
        });

        // Notify ONLY others in the room (not the joining user to avoid duplicate)
        socket
          .to(roomId)
          .emit("user_joined", { nickname, participantCount, participants });

        console.log(
          `[WebSocket] ${nickname} joined room ${roomToken} (loaded ${messageHistory.length} messages)`
        );

        // After successful join, broadcast active users and public rooms
        await broadcastPublicRooms(); // Didn't check the public flag (I'm lazy)

        // Check room TTL and send warning if needed
        const ttlInfo = await roomService.checkRoomTTL(roomId);
        if (ttlInfo.shouldWarn) {
          socket.emit("room_ttl_warning", { expiresIn: ttlInfo.expiresIn });
        }
      } catch (error: any) {
        console.error("[WebSocket] Join room error:", error);
        socket.emit("error", {
          message: error.message || "Failed to join room",
          code: error.code,
        });
      }
    });

    /**
     * Send a message
     */
    socket.on("send_message", async (data) => {
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
        console.error("[WebSocket] Send message error:", error);
        socket.emit("error", {
          message: error.message || "Failed to send message",
          code: error.code,
        });
      }
    });

    /**
     * Delete a message
     */
    socket.on("delete_message", async ({ messageId }) => {
      try {
        const { sessionToken, roomId } = socket.data;

        if (!sessionToken || !roomId) {
          socket.emit("error", {
            message: "Not connected to a room",
            code: "NOT_IN_ROOM",
          });
          return;
        }

        const session = await sessionService.validateSession(sessionToken);
        await messageService.deleteMessage(messageId, session.sessionId);

        // Notify all in the room
        io.to(roomId).emit("message_deleted", { messageId });

        console.log(`[WebSocket] Message ${messageId} deleted`);
      } catch (error: any) {
        console.error("[WebSocket] Delete message error:", error);
        socket.emit("error", {
          message: error.message || "Failed to delete message",
          code: error.code,
        });
      }
    });

    /**
     * Leave a room
     */
    socket.on("leave_room", async () => {
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
          .map((s) => s.data.nickname)
          .filter((n): n is string => !!n);

        // Notify others
        socket
          .to(roomId)
          .emit("user_left", {
            nickname: nickname || "Unknown",
            participantCount,
            participants,
          });

        // Delete session
        await sessionService.removeSession(sessionToken);
        await broadcastActiveUsers();
        await broadcastPublicRooms();

        console.log(`[WebSocket] ${nickname} left room ${roomToken}`);

        // Clear socket data to prevent disconnect handler from processing
        socket.data = {};
      } catch (error: any) {
        console.error("[WebSocket] Leave room error:", error);
      }
    });

    /**
     * Heartbeat to keep session alive
     */
    socket.on("heartbeat", async () => {
      try {
        const { sessionToken } = socket.data;
        if (sessionToken) {
          await sessionService.validateSession(sessionToken);
        }
      } catch (error) {
        socket.emit("error", {
          message: "Session expired",
          code: "SESSION_EXPIRED",
        });
      }
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", async () => {
      try {
        const { sessionToken, roomId, nickname, roomToken } = socket.data;

        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
        await broadcastActiveUsers();

        // Only process if session data exists (not already cleaned by leave_room)
        if (sessionToken && roomId) {
          // Note: Socket is already removed from the room when disconnect fires
          // So socketsInRoom already excludes the disconnected socket
          const socketsInRoom = await io.in(roomId).fetchSockets();
          const participantCount = socketsInRoom.length; // Don't subtract 1, socket already removed
          const participants = socketsInRoom
            .map((s) => s.data.nickname)
            .filter((n): n is string => !!n);

          // Notify others
          io.to(roomId).emit("user_left", {
            nickname: nickname || "Unknown",
            participantCount,
            participants,
          });

          // Delete session
          await sessionService.removeSession(sessionToken);
          await broadcastPublicRooms(); // Update public rooms on disconnect

          console.log(
            `[WebSocket] ${nickname} disconnected from room ${roomToken}`
          );
        }
      } catch (error) {
        console.error("[WebSocket] Disconnect cleanup error:", error);
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

      await broadcastPublicRooms();
    } catch (error) {
      console.error('[WebSocket] TTL warning error:', error);
    }
  }, 60000); // Check every minute

  console.log('[WebSocket] Socket handlers initialized');
};

