import { Injectable, InternalServerErrorException } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private readonly storagePath = process.env.STORAGE_PATH || './storage';

  async onModuleInit() {
    // Ensure the storage directory exists
    try {
      await fs.access(this.storagePath);
    } catch {
      await fs.mkdir(this.storagePath, { recursive: true });
    }
  }

  async processAndSaveImage(file: Express.Multer.File): Promise<string> {
    try {
      const filename = `${uuidv4()}.webp`;
      const filePath = path.join(this.storagePath, filename);

      await sharp(file.buffer)
        .webp({ quality: 80 })
        .toFile(filePath);

      // Return the URL path (Nginx or NestJS will serve it)
      return `/media/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      throw new InternalServerErrorException('Failed to process image');
    }
  }
}
