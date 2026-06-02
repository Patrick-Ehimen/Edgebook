import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { PositionsModule } from './positions/positions.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queues/queue.module';

@Module({
  imports: [PrismaModule, EncryptionModule, QueueModule, AuthModule, AccountsModule, PositionsModule, PlaybooksModule],
})
export class AppModule {}
