import { ArchiveItemType } from '@edgebook/shared';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ArchiveService } from './archive.service';

@Controller('archive')
@UseGuards(JwtAuthGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.archiveService.list(userId);
  }

  @Post(':type/:id/restore')
  @HttpCode(HttpStatus.OK)
  restore(
    @Param('type', new ZodValidationPipe(ArchiveItemType)) type: ArchiveItemType,
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.archiveService.restore(userId, type, id);
  }

  @Delete(':type/:id')
  @HttpCode(HttpStatus.OK)
  purge(
    @Param('type', new ZodValidationPipe(ArchiveItemType)) type: ArchiveItemType,
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.archiveService.purge(userId, type, id);
  }
}
