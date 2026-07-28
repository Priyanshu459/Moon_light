import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    if (!createPostDto.content && (!createPostDto.mediaUrls || createPostDto.mediaUrls.length === 0)) {
      throw new BadRequestException('Post must contain content or media');
    }

    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        authorId: userId,
        media: createPostDto.mediaUrls ? {
          create: createPostDto.mediaUrls.map(url => ({
            url,
            type: url.endsWith('.webp') || url.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'video',
          }))
        } : undefined,
      },
      include: {
        media: true,
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Broadcast the new post to all connected WebSocket clients
    this.eventsGateway.broadcastNewPost(post);

    return post;
  }

  async getFeed(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return posts;
  }
}
