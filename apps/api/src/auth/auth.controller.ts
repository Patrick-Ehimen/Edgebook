import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUserId, CurrentSessionId } from './decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthExceptionFilter } from '../common/filters/auth-exception.filter';
import {
  SignUpInput,
  SignInInput,
  VerifyEmailInput,
  EnrollTotpConfirmInput,
  TwoFactorChallengeInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@edgebook/shared/auth';
import { z } from 'zod';

function meta(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  signUp(
    @Body(new ZodValidationPipe(SignUpInput)) body: SignUpInput,
    @Req() req: Request,
  ) {
    return this.authService.signUp(body, meta(req));
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(
    @Body(new ZodValidationPipe(SignInInput)) body: SignInInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(body, res, meta(req));
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  signOut(
    @CurrentSessionId() sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(sessionId, res);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body(new ZodValidationPipe(VerifyEmailInput)) body: VerifyEmailInput) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(
    @Body(new ZodValidationPipe(z.object({ email: z.string().email() })))
    body: { email: string },
  ) {
    return this.authService.resendVerification(body.email);
  }

  @Post('2fa/enroll-init')
  @UseGuards(JwtAuthGuard)
  enrollTotpInit(@CurrentUserId() userId: string) {
    return this.authService.enrollTotpInit(userId);
  }

  @Post('2fa/enroll-confirm')
  @UseGuards(JwtAuthGuard)
  enrollTotpConfirm(
    @Body(new ZodValidationPipe(EnrollTotpConfirmInput)) body: EnrollTotpConfirmInput,
    @CurrentUserId() userId: string,
    @Req() req: Request,
  ) {
    return this.authService.enrollTotpConfirm(userId, body, meta(req));
  }

  @Post('2fa/challenge')
  @HttpCode(HttpStatus.OK)
  twoFactorChallenge(
    @Body(new ZodValidationPipe(TwoFactorChallengeInput)) body: TwoFactorChallengeInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.twoFactorChallenge(body, res, meta(req));
  }

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body(new ZodValidationPipe(ForgotPasswordInput)) body: ForgotPasswordInput) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordInput)) body: ResetPasswordInput,
    @Req() req: Request,
  ) {
    return this.authService.resetPassword(body, meta(req));
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  getSession(@CurrentUserId() userId: string) {
    return this.authService.getSession(userId);
  }
}
