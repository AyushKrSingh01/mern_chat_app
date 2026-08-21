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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
  console.log(`Client connected: ${socket.id} (user: ${socket.data.username}, id: ${socket.data.userId})`);

  socket.emit('connected', { message: `Welcome, ${socket.data.username}!` });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id} (user: ${socket.data.username})`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));