import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
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

  @Get('entry')
  getByDate(@CurrentUserId() userId: string, @Query('date') date: string) {
    return this.journalService.getByDate(userId, date);
  }

  @Patch('entry')
  upsertEntry(
    @CurrentUserId() userId: string,
    @Body() body: { date: string } & Record<string, unknown>,
  ) {
    const { date, ...data } = body;
    return this.journalService.upsert(userId, date, data);
  }

  @Get('recent')
  listRecent(@CurrentUserId() userId: string) {
    return this.journalService.listRecent(userId);
  }
}
