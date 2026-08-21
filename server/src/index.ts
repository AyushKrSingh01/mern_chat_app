import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { prisma } from './db';
import authRoutes from './routes/authRoutes';
import { requireAuth, AuthRequest } from './middleware/authMiddleware';

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
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173' },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));