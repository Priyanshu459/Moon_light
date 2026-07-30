import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const userToFollow = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return { following: false };
    } else {
      await this.prisma.follows.create({
        data: {
          followerId,
          followingId,
        },
      });
      return { following: true };
    }
  }

  async getFollowers(userId: string) {
    const follows = await this.prisma.follows.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      }
    });
    return follows.map(f => f.follower);
  }

  async getFollowing(userId: string) {
    const follows = await this.prisma.follows.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        }
      }
    });
    return follows.map(f => f.following);
  }
}
