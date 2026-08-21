import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export async function createRoom(req: AuthRequest, res: Response) {
  try {
    const { name, isGroup, memberIds } = req.body;
    const userId = req.user!.userId;

    const room = await prisma.room.create({
      data: {
        name,
        isGroup: !!isGroup,
        members: {
          create: [
            { userId },
            ...((memberIds || []) as number[]).map((id) => ({ userId: id })),
          ],
        },
      },
      include: { members: true },
    });

    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
}


export async function getMyRooms(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const rooms = await prisma.room.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
    });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

export async function getRoomMessages(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const roomId = Number(req.params.roomId);

    const membership = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const messages = await prisma.message.findMany({
      where: { roomId },
      include: { sender: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' },
      take: 50, 
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}