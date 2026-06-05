import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JournalService } from './journal.service';

@Controller('journal')
@UseGuards(JwtAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get('stats')
  getStats(@CurrentUserId() userId: string) {
    return this.journalService.getStats(userId);
  }
}
