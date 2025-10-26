import { Server, Socket } from 'socket.io';
import prisma from '../config/database';
import { JoinRoomData, SendMessageData, CreateRoomData, UserData } from '../types';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user registration
    socket.on('register', async (data: UserData) => {
      try {
        const { userId, username } = data;

        // Create or update user
        const user = await prisma.user.upsert({
          where: { id: userId },
          update: { username },
          create: { id: userId, username },
        });

        socket.data.userId = userId;
        socket.data.username = username;

        socket.emit('registered', { success: true, user });
        console.log(`User registered: ${username} (${userId})`);
      } catch (error) {
        console.error('Error registering user:', error);
        socket.emit('error', { message: 'Failed to register user' });
      }
    });

    // Handle creating a room
    socket.on('createRoom', async (data: CreateRoomData) => {
      try {
        const { name, userId } = data;

        const room = await prisma.room.create({
          data: {
            name,
            users: {
              create: {
                userId,
              },
            },
          },
          include: {
            users: {
              include: {
                user: true,
              },
            },
          },
        });

        socket.join(room.id);
        socket.emit('roomCreated', { success: true, room });
        console.log(`Room created: ${name} (${room.id})`);
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Handle joining a room
    socket.on('joinRoom', async (data: JoinRoomData) => {
      try {
        const { roomId, userId, username } = data;

        // Check if user exists, create if not
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: { id: userId, username },
        });

        // Add user to room
        await prisma.roomUser.upsert({
          where: {
            userId_roomId: {
              userId,
              roomId,
            },
          },
          update: {},
          create: {
            userId,
            roomId,
          },
        });

        // Get room with messages and users
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            messages: {
              include: {
                user: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
              take: 50,
            },
            users: {
              include: {
                user: true,
              },
            },
          },
        });

        socket.join(roomId);
        socket.emit('joinedRoom', { success: true, room });
        socket.to(roomId).emit('userJoined', { userId, username });
        console.log(`User ${username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle sending a message
    socket.on('sendMessage', async (data: SendMessageData) => {
      try {
        const { roomId, userId, content } = data;

        const message = await prisma.message.create({
          data: {
            content,
            userId,
            roomId,
          },
          include: {
            user: true,
          },
        });

        io.to(roomId).emit('newMessage', message);
        console.log(`Message sent in room ${roomId} by ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle leaving a room
    socket.on('leaveRoom', async (roomId: string) => {
      try {
        socket.leave(roomId);
        const userId = socket.data.userId;
        const username = socket.data.username;

        if (userId) {
          socket.to(roomId).emit('userLeft', { userId, username });
          console.log(`User ${username} left room ${roomId}`);
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Handle getting room list
    socket.on('getRooms', async () => {
      try {
        const rooms = await prisma.room.findMany({
          include: {
            users: {
              include: {
                user: true,
              },
            },
            _count: {
              select: {
                messages: true,
                users: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        socket.emit('roomsList', { success: true, rooms });
      } catch (error) {
        console.error('Error getting rooms:', error);
        socket.emit('error', { message: 'Failed to get rooms' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
