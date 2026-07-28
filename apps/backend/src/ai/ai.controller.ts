import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-caption')
  async generateCaption(@Body('prompt') prompt: string) {
    if (!prompt) {
      return { caption: '' };
    }
    const caption = await this.aiService.generateCaption(prompt);
    return { caption };
  }
}
