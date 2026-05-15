'use client';

import React, { useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import { useResendVerification } from '../hooks/useResendVerification';

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const [otp, setOtp] = React.useState('');
  const verifyMutation = useVerifyEmail();
  const {
    mutate: resend,
    isPending: resending,
    secondsLeft,
    canResend,
  } = useResendVerification(email);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !verifyMutation.isPending) {
      verifyMutation.mutate({ email, code: otp });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div>
      <h2 className="mb-1.5 mt-0.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        Check your inbox
      </h2>
      <p className="mb-6 text-[13px] text-muted-foreground">
        We sent a 6-digit code to <b className="font-medium text-foreground">{email}</b>
      </p>

      <div className="flex justify-center mb-4">
        <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={verifyMutation.isPending}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-12 w-12 text-lg data-[active=true]:border-[#00a86b] data-[active=true]:ring-[#00a86b]/20 dark:bg-[rgba(15,20,29,.7)] dark:text-[#00d68f] dark:data-[active=true]:border-[#00d68f] dark:data-[active=true]:ring-[#00d68f]/20"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {verifyMutation.error && (
        <p className="mb-3 text-center text-xs text-destructive">{verifyMutation.error.message}</p>
      )}

      <Button
        type="button"
        onClick={() => {
          if (otp.length === 6) {
            verifyMutation.mutate({ email, code: otp });
          }
        }}
        disabled={verifyMutation.isPending || otp.length < 6}
        className="mb-4 h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
        style={{
          background: 'linear-gradient(180deg,#00e29a,#00b67a)',
          color: '#06140f',
          boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
        }}
      >
        {verifyMutation.isPending ? 'Verifying…' : 'Verify email →'}
      </Button>

      <p className="text-center text-[12px] text-muted-foreground">
        Didn&apos;t receive it?{' '}
        <button
          type="button"
          disabled={!canResend || resending}
          onClick={() => resend()}
          className="cursor-pointer font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          style={{ color: '#00a86b' }}
        >
          {canResend ? 'Resend code' : `Resend in ${secondsLeft}s`}
        </button>
      </p>
    </div>
  );
}
