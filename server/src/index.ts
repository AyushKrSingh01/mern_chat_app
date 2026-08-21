import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { prisma } from './db';
import authRoutes from './routes/authRoutes';
import { requireAuth, AuthRequest } from './middleware/authMiddleware';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from './types/socketEvents';
import { socketAuthMiddleware } from './middleware/socketAuth';
import roomRoutes from './routes/roomRoutes';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/rooms', roomRoutes
);
app.use('/api/auth', authRoutes);

app.get('/api/db-check', async (req, res) => {
  const userCount = await prisma.user.count();
  res.json({ userCount });
});


app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: { origin: 'http://localhost:5173' },
});

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (user: ${socket.data.username})`);

  socket.emit('connected', { message: `Welcome, ${socket.data.username}!` });

  socket.on('join_room', async (roomId) => {
    try {
      const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId: socket.data.userId } },
      });

      if (!membership) {
        socket.emit('error_message', { error: 'You are not a member of this room' });
        return;
      }

      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit('user_joined', {
        userId: socket.data.userId,
        username: socket.data.username,
        roomId,
      });
      console.log(`${socket.data.username} joined room ${roomId}`);
    } catch (err) {
      console.error(err);
      socket.emit('error_message', { error: 'Failed to join room' });
    }
  });

  socket.on('send_message', async ({ roomId, content }) => {
    try {
      if (!content?.trim()) return;

      const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId: socket.data.userId } },
      });
      if (!membership) {
        socket.emit('error_message', { error: 'You are not a member of this room' });
        return;
      }

      const message = await prisma.message.create({
        data: {
          roomId,
          senderId: socket.data.userId,
          content: content.trim(),
        },
      });

      io.to(`room:${roomId}`).emit('receive_message', {
        id: message.id,
        roomId,
        senderId: socket.data.userId,
        senderUsername: socket.data.username,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (err) {
      console.error(err);
      socket.emit('error_message', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id} (user: ${socket.data.username})`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));