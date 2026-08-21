import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { verifyToken } from '../utils/jwt';
import { SocketData } from '../types/socketEvents';

export function socketAuthMiddleware(
  socket: Socket & { data: SocketData },
  next: (err?: ExtendedError) => void
) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication token missing'));
  }

  try {
    const payload = verifyToken(token);
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}