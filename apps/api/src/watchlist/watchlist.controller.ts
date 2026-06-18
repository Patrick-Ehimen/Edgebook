import { CreateWatchlistItem } from '@edgebook/shared';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.watchlistService.list(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateWatchlistItem)) body: CreateWatchlistItem,
    @CurrentUserId() userId: string,
  ) {
    return this.watchlistService.create(userId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.watchlistService.remove(userId, id);
  }
}
