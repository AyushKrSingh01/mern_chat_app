import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export async function searchUsers(req: AuthRequest, res: Response) {
  try {
    const query = (req.query.q as string) || '';
    const currentUserId = req.user!.userId;

    if (!query.trim()) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' },
        id: { not: currentUserId },
      },
      select: { id: true, username: true, email: true },
      take: 10,
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}   