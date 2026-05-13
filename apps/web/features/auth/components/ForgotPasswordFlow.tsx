'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { useResetPassword } from '../hooks/useResetPassword';
import { ForgotPasswordInput, ResetPasswordInput } from '../schemas';

type FlowStep = 'email' | 'code' | 'password';

const NewPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(12, 'At least 12 characters.')
    .max(128)
    .refine((v) => /[a-z]/.test(v), 'Include a lowercase letter.')
    .refine((v) => /[A-Z]/.test(v), 'Include an uppercase letter.')
    .refine((v) => /\d/.test(v), 'Include a number.'),
});

const STEPS = ['Send code', 'Verify code', 'New password'] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                i <= current
                  ? 'border-[#00a86b] bg-[rgba(0,168,107,.10)] text-[#00a86b] dark:border-[#00d68f] dark:bg-[rgba(15,20,29,.7)] dark:text-[#00d68f]'
                  : 'border-border bg-muted text-muted-foreground dark:bg-[rgba(15,20,29,.7)]'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-[11px] whitespace-nowrap ${
                i === current ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className="h-px flex-1 bg-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function ForgotPasswordFlow() {
  const [step, setStep] = useState<FlowStep>('email');
  const [storedEmail, setStoredEmail] = useState('');
  const [storedCode, setStoredCode] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [pwValue, setPwValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordInput),
    defaultValues: { email: '' },
  });

  const pwForm = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const stepIndex = step === 'email' ? 0 : step === 'code' ? 1 : 2;

  // Step 1: Send reset code
  const handleEmailSubmit = emailForm.handleSubmit((data) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        setStoredEmail(data.email);
        setStep('code');
      },
    });
  });

  // Step 2: Verify code (local — just advance)
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length === 6) {
      setStoredCode(otpValue);
      setStep('password');
    }
  };

  // Step 3: Reset password
  const handlePasswordSubmit = pwForm.handleSubmit((data) => {
    const input: ResetPasswordInput = {
      email: storedEmail,
      code: storedCode,
      newPassword: data.newPassword,
    };
    resetMutation.mutate(input);
  });

  return (
    <div>
      <StepIndicator current={stepIndex} />

      {step === 'email' && (
        <>
          <h2 className="mb-1.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
            Reset your password
          </h2>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Enter your email and we&apos;ll send you a reset code.
          </p>
          <Form {...emailForm}>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="trader@protonmail.com"
                          className="h-[42px] w-full rounded-[9px] border border-input bg-background/70 pl-[38px] pr-3 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#00d68f] focus:ring-[3px] focus:ring-[#00d68f]/20 dark:bg-[#0a0f17]"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {forgotMutation.error && (
                <p className="text-xs text-destructive">{forgotMutation.error.message}</p>
              )}
              <Button
                type="submit"
                disabled={forgotMutation.isPending}
                className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg,#00e29a,#00b67a)',
                  color: '#06140f',
                  boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
                }}
              >
                {forgotMutation.isPending ? 'Sending…' : 'Send reset code →'}
              </Button>
            </form>
          </Form>
        </>
      )}

      {step === 'code' && (
        <>
          <h2 className="mb-1.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
            Check your inbox
          </h2>
          <p className="mb-5 text-[13px] text-muted-foreground">
            We sent a 6-digit reset code to{' '}
            <b className="font-medium text-foreground">{storedEmail}</b>
          </p>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-12 text-lg data-[active=true]:border-[#00a86b] data-[active=true]:ring-[#00a86b]/20 dark:bg-[rgba(15,20,29,.7)] dark:text-[#00d68f] dark:data-[active=true]:border-[#00d68f] dark:data-[active=true]:ring-[#00d68f]/20"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              disabled={otpValue.length < 6}
              className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
              style={{
                background: 'linear-gradient(180deg,#00e29a,#00b67a)',
                color: '#06140f',
                boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
              }}
            >
              Verify code →
            </Button>
          </form>
        </>
      )}

      {step === 'password' && (
        <>
          <h2 className="mb-1.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
            Choose a new password
          </h2>
          <p className="mb-5 text-[13px] text-muted-foreground">
            Must be at least 12 characters with mixed case and a number.
          </p>
          <Form {...pwForm}>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <FormField
                control={pwForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                      New password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="At least 12 characters"
                          className="h-[42px] w-full rounded-[9px] border border-input bg-background/70 pl-3 pr-14 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#00d68f] focus:ring-[3px] focus:ring-[#00d68f]/20 dark:bg-[#0a0f17]"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setPwValue(e.target.value);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute inset-y-0 right-2 my-1 flex w-10 cursor-pointer items-center justify-center rounded-[7px] text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'hide' : 'show'}
                        </button>
                      </div>
                    </FormControl>
                    <PasswordStrengthMeter value={pwValue} className="mt-1.5" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {resetMutation.error && (
                <p className="text-xs text-destructive">{resetMutation.error.message}</p>
              )}
              <Button
                type="submit"
                disabled={resetMutation.isPending}
                className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg,#00e29a,#00b67a)',
                  color: '#06140f',
                  boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
                }}
              >
                {resetMutation.isPending ? 'Resetting…' : 'Reset password →'}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}
