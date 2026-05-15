import { AddApiKeyInput, CreateAccountInput } from '@edgebook/shared/accounts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountExceptionFilter } from '../common/filters/account-exception.filter';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
@UseFilters(AccountExceptionFilter)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createAccount(
    @Body(new ZodValidationPipe(CreateAccountInput)) body: CreateAccountInput,
    @CurrentUserId() userId: string,
  ) {
    return this.accountsService.createAccount(userId, body);
  }

  @Get()
  listAccounts(@CurrentUserId() userId: string) {
    return this.accountsService.listAccounts(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.accountsService.deleteAccount(userId, id);
  }

  @Post(':id/keys')
  @HttpCode(HttpStatus.CREATED)
  addApiKey(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddApiKeyInput)) body: AddApiKeyInput,
    @CurrentUserId() userId: string,
  ) {
    return this.accountsService.addApiKey(userId, id, body);
  }

  @Delete(':id/keys/:keyId')
  @HttpCode(HttpStatus.OK)
  revokeApiKey(
    @Param('id') id: string,
    @Param('keyId') keyId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.accountsService.revokeApiKey(userId, id, keyId);
  }
}
