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
import { NotesService } from './notes.service';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.notesService.list(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: { folderId: string; name: string; iconId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.notesService.create(userId, body);
  }

  @Patch(':id/move')
  @HttpCode(HttpStatus.OK)
  move(
    @Param('id') id: string,
    @Body() body: { folderId: string },
    @CurrentUserId() userId: string,
  ) {
    return this.notesService.move(userId, id, body.folderId);
  }

  @Patch(':id/pin')
  @HttpCode(HttpStatus.OK)
  pin(
    @Param('id') id: string,
    @Body() body: { pinned: boolean },
    @CurrentUserId() userId: string,
  ) {
    return this.notesService.pin(userId, id, body.pinned);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; bodyMd?: string; tags?: string[]; playbookId?: string | null },
    @CurrentUserId() userId: string,
  ) {
    return this.notesService.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.notesService.remove(userId, id);
  }
}

