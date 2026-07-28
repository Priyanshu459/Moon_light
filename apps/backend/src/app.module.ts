import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AiModule } from './ai/ai.module';
import { EventsModule } from './events/events.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    MediaModule, 
    UsersModule, 
    PostsModule, 
    AiModule, 
    EventsModule,
    PrometheusModule.register()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
