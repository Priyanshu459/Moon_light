import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  toggleLike(@Request() req: any, @Param('postId') postId: string) {
    return this.likesService.toggleLike(req.user.sub, postId);
  }
}
