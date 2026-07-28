import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createPost(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(req.user.sub, createPostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  getFeed(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.postsService.getFeed(pageNumber, limitNumber);
  }
}
