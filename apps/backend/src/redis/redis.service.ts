import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }

  async setTokenBlacklisted(token: string, expiresInSeconds: number): Promise<void> {
    await this.redisClient.set(`bl_${token}`, 'true', 'EX', expiresInSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redisClient.get(`bl_${token}`);
    return result === 'true';
  }
}
