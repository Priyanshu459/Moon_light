import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  toggleFollow(@Request() req: any, @Param('userId') followingId: string) {
    return this.followsService.toggleFollow(req.user.sub, followingId);
  }

  @Get(':userId/followers')
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get(':userId/following')
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }
}
