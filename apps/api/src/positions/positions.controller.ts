import { CreateFillInput, UpdatePositionMetrics } from '@edgebook/shared/positions';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountExceptionFilter } from '../common/filters/account-exception.filter';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PositionsService } from './positions.service';

@Controller('accounts/:accountId')
@UseGuards(JwtAuthGuard)
@UseFilters(AccountExceptionFilter)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post('fills')
  @HttpCode(HttpStatus.CREATED)
  createFill(
    @Param('accountId') accountId: string,
    @Body(new ZodValidationPipe(CreateFillInput)) body: CreateFillInput,
    @CurrentUserId() userId: string,
  ) {
    return this.positionsService.createFill(userId, accountId, body);
  }

  @Get('fills')
  listFills(@Param('accountId') accountId: string, @CurrentUserId() userId: string) {
    return this.positionsService.listFills(userId, accountId);
  }

  @Post('recompute')
  @HttpCode(HttpStatus.OK)
  recompute(@Param('accountId') accountId: string, @CurrentUserId() userId: string) {
    return this.positionsService.recompute(userId, accountId);
  }

  @Get('positions')
  listPositions(@Param('accountId') accountId: string, @CurrentUserId() userId: string) {
    return this.positionsService.listPositions(userId, accountId);
  }

  @Get('positions/:positionId')
  getPosition(
    @Param('accountId') accountId: string,
    @Param('positionId') positionId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.positionsService.getPosition(userId, accountId, positionId);
  }

  @Patch('positions/:positionId')
  @HttpCode(HttpStatus.OK)
  updatePositionMetrics(
    @Param('accountId') accountId: string,
    @Param('positionId') positionId: string,
    @Body(new ZodValidationPipe(UpdatePositionMetrics)) body: UpdatePositionMetrics,
    @CurrentUserId() userId: string,
  ) {
    return this.positionsService.updatePositionMetrics(userId, accountId, positionId, body);
  }

  @Delete('positions/:positionId')
  @HttpCode(HttpStatus.OK)
  deletePosition(
    @Param('accountId') accountId: string,
    @Param('positionId') positionId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.positionsService.deletePosition(userId, accountId, positionId);
  }
}
