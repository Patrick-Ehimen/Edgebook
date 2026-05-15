'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { useEnrollTotpInit, useEnrollTotpConfirm } from '../hooks/useEnrollTwoFactor';
import { RecoveryCodesPanel } from './RecoveryCodesPanel';

export function TwoFactorEnroll() {
  const { data, isLoading, error: initError } = useEnrollTotpInit();
  const confirmMutation = useEnrollTotpConfirm();
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'qr' | 'confirm' | 'recovery'>('qr');
  const [copied, setCopied] = useState(false);

  const handleCopySecret = async () => {
    if (data?.secret) {
      await navigator.clipboard.writeText(data.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (step === 'confirm' && otp.length === 6 && !confirmMutation.isPending) {
      confirmMutation.mutate({ code: otp });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Failed to initialize 2FA setup. Please refresh and try again.
      </div>
    );
  }

  if (!data) return null;

  if (confirmMutation.isSuccess && step !== 'recovery') {
    // Transition to recovery codes step
    return (
      <RecoveryCodesPanel
        codes={data.recoveryCodes}
        onSaved={() => {
          // Router push happens via useEnrollTotpConfirm onSuccess → /dashboard
          // but we also need the user to click "Continue" to actually navigate.
          // The hook already pushes to /dashboard on success, so just let it through.
        }}
      />
    );
  }

  return (
    <div>
      <h2 className="mb-1.5 mt-0.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        Set up two-factor authentication
      </h2>
      <p className="mb-5 text-[13px] text-muted-foreground">
        2FA is required on Edgebook. Scan the QR code or enter the secret manually in your
        authenticator app (Authy, Google Authenticator, 1Password, etc.).
      </p>

      {step === 'qr' && (
        <>
          {/* QR Code */}
          <div className="mb-4 flex justify-center rounded-[10px] border border-border bg-white p-4">
            <QRCodeSVG value={data.otpauthUri} size={180} />
          </div>

          {/* Manual entry */}
          <div className="mb-4 rounded-[9px] border border-border bg-muted/20 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
              Manual entry secret
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all font-mono text-[13px] text-foreground">
                {data.secret}
              </code>
              <button
                type="button"
                onClick={handleCopySecret}
                className="flex-shrink-0 rounded-[6px] border border-border bg-background/80 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-card"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setStep('confirm')}
            className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg,#00e29a,#00b67a)',
              color: '#06140f',
              boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
            }}
          >
            I&apos;ve scanned the QR code →
          </Button>
        </>
      )}

      {step === 'confirm' && (
        <>
          <p className="mb-4 text-[13px] text-muted-foreground">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>

          <div className="mb-4 flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={confirmMutation.isPending}
            >
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

          {confirmMutation.error && (
            <p className="mb-3 text-center text-xs text-destructive">
              {confirmMutation.error.message}
            </p>
          )}

          <Button
            type="button"
            disabled={confirmMutation.isPending || otp.length < 6}
            onClick={() => confirmMutation.mutate({ code: otp })}
            className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold transition-[filter] hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg,#00e29a,#00b67a)',
              color: '#06140f',
              boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
            }}
          >
            {confirmMutation.isPending ? 'Verifying…' : 'Confirm 2FA →'}
          </Button>

          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setStep('qr')}
              className="cursor-pointer font-medium hover:underline"
              style={{ color: '#00a86b' }}
            >
              ← Back to QR code
            </button>
          </p>
        </>
      )}
    </div>
  );
}
