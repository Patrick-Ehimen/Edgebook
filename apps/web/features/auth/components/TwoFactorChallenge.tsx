'use client';

import React, { useState, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { useTwoFactorChallenge } from '../hooks/useTwoFactorChallenge';

interface TwoFactorChallengeProps {
  challengeId: string;
}

export function TwoFactorChallenge({ challengeId }: TwoFactorChallengeProps) {
  const [otp, setOtp] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const { mutate, isPending, error } = useTwoFactorChallenge();

  // Auto-submit TOTP when 6 digits are entered
  useEffect(() => {
    if (!useRecovery && otp.length === 6 && !isPending) {
      mutate({ challengeId, code: otp });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, useRecovery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useRecovery) {
      mutate({ challengeId, code: recoveryCode });
    } else if (otp.length === 6) {
      mutate({ challengeId, code: otp });
    }
  };

  return (
    <div>
      <h2 className="mb-1.5 mt-0.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        Two-factor authentication
      </h2>
      <p className="mb-6 text-[13px] text-muted-foreground">
        {useRecovery
          ? 'Enter one of your 8-character recovery codes.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {useRecovery ? (
          <div>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="h-[42px] w-full rounded-[9px] border border-input bg-background/70 px-3 text-center font-mono text-[16px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#00a86b] focus:ring-[3px] focus:ring-[#00a86b]/20 dark:bg-[#0a0f17] dark:focus:border-[#00d68f] dark:focus:ring-[#00d68f]/20"
              autoComplete="one-time-code"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isPending}>
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
        )}

        {error && <p className="text-center text-xs text-destructive">{error.message}</p>}

        <Button
          type="submit"
          disabled={
            isPending ||
            (!useRecovery && otp.length < 6) ||
            (useRecovery && recoveryCode.length < 9)
          }
          className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
          style={{
            background: 'linear-gradient(180deg,#00e29a,#00b67a)',
            color: '#06140f',
            boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
          }}
        >
          {isPending ? 'Verifying…' : 'Verify →'}
        </Button>
      </form>

      <p className="mt-4 text-center text-[12px] text-muted-foreground">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setOtp('');
            setRecoveryCode('');
          }}
          className="cursor-pointer font-medium hover:underline"
          style={{ color: '#00a86b' }}
        >
          {useRecovery ? '← Use authenticator app instead' : 'Use a recovery code instead'}
        </button>
      </p>
    </div>
  );
}
