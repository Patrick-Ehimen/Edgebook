import { QUEUE_RECOMPUTE, QUEUE_SYNC } from '@edgebook/shared/queues';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { env } from '../config/env';

const redisConnection = new URL(env.REDIS_URL);

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisConnection.hostname,
        port: Number(redisConnection.port) || 6379,
        password: redisConnection.password || undefined,
      },
    }),
    BullModule.registerQueue(
      { name: QUEUE_RECOMPUTE },
      { name: QUEUE_SYNC },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
