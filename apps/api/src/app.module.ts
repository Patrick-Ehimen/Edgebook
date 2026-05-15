import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, EncryptionModule, AuthModule, AccountsModule],
})
export class AppModule {}
