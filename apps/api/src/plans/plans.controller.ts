import { CreatePlan, UpdatePlan } from '@edgebook/shared';
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
import { PlansService } from './plans.service';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.plansService.list(userId);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.plansService.get(userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreatePlan)) body: CreatePlan,
    @CurrentUserId() userId: string,
  ) {
    return this.plansService.create(userId, body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlan)) body: UpdatePlan,
    @CurrentUserId() userId: string,
  ) {
    return this.plansService.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.plansService.remove(userId, id);
  }
}
