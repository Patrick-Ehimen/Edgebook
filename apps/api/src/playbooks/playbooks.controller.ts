import {
  CreatePlaybook,
  UpdateChecklist,
  UpdatePlaybook,
  UpdatePlaybookImages,
} from '@edgebook/shared';
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
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PlaybooksService } from './playbooks.service';

@Controller('playbooks')
@UseGuards(JwtAuthGuard)
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.playbooksService.list(userId);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.playbooksService.get(userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreatePlaybook)) body: CreatePlaybook,
    @CurrentUserId() userId: string,
  ) {
    return this.playbooksService.create(userId, body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlaybook)) body: UpdatePlaybook,
    @CurrentUserId() userId: string,
  ) {
    return this.playbooksService.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.playbooksService.remove(userId, id);
  }

  @Patch(':id/images')
  @HttpCode(HttpStatus.OK)
  updateImages(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlaybookImages)) body: UpdatePlaybookImages,
    @CurrentUserId() userId: string,
  ) {
    return this.playbooksService.updateImages(userId, id, body.images);
  }

  @Post(':id/checklists')
  @HttpCode(HttpStatus.CREATED)
  createChecklist(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChecklist)) body: UpdateChecklist,
    @CurrentUserId() userId: string,
  ) {
    return this.playbooksService.createChecklist(userId, id, body);
  }

  @Patch(':id/checklists/:checklistId')
  @HttpCode(HttpStatus.OK)
  updateChecklist(
    @Param('id') id: string,
    @Param('checklistId') checklistId: string,
    @Body(new ZodValidationPipe(UpdateChecklist)) body: UpdateChecklist,
    @CurrentUserId() userId: string,
  ) {
    return this.playbooksService.updateChecklist(userId, id, checklistId, body);
  }
}
