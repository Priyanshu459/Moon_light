import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Example: Client sending a test message
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any): void {
    this.logger.log(`Ping received: ${JSON.stringify(data)}`);
    this.server.emit('pong', { message: 'Server is alive!' });
  }

  // We can call this method from other services to broadcast a new post event
  broadcastNewPost(post: any) {
    this.logger.log(`Broadcasting new post: ${post.id}`);
    this.server.emit('new_post', post);
  }
}
