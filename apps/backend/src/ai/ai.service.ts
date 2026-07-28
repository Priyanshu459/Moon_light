import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor() {
    // Configure OpenAI SDK to point to the local LM Studio instance.
    // When running in Docker on Windows/Mac, host.docker.internal points to the host machine.
    this.openai = new OpenAI({
      baseURL: 'http://host.docker.internal:1234/v1',
      apiKey: 'lm-studio', // LM Studio doesn't require a real key
    });
  }

  async generateCaption(prompt: string): Promise<string> {
    try {
      this.logger.log(`Generating caption for prompt: ${prompt}`);
      
      const response = await this.openai.chat.completions.create({
        model: 'local-model', // LM Studio uses the currently loaded model regardless of this string
        messages: [
          { 
            role: 'system', 
            content: "You are a creative social media manager. Generate a short, engaging, and creative caption (with 2-3 emojis) for a social media post based on the user's prompt. Do NOT include quotes, hashtags, or any other conversational text. Just output the final caption directly." 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const caption = response.choices[0]?.message?.content?.trim() || '';
      return caption;
    } catch (error) {
      this.logger.error('Failed to generate AI caption', error);
      throw new Error('Failed to connect to local AI server. Make sure LM Studio is running on port 1234.');
    }
  }
}
