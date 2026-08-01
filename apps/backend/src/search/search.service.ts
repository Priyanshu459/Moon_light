import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string) {
    if (!query || query.trim().length === 0) {
      return { users: [], posts: [] };
    }

    const searchQuery = query.trim();

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode: 'insensitive' } },
          { displayName: { contains: searchQuery, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 20
    });

    const posts = await this.prisma.post.findMany({
      where: {
        content: { contains: searchQuery, mode: 'insensitive' }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        media: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    return { users, posts };
  }
}
