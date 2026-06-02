import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlaybooksController } from './playbooks.controller';
import { PlaybooksService } from './playbooks.service';

@Module({
  imports: [AuthModule],
  controllers: [PlaybooksController],
  providers: [PlaybooksService],
})
export class PlaybooksModule {}
