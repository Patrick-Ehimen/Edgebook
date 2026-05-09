'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { Mail, Lock, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Divider } from '@/components/ui/divider';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { SecurityBadge } from './SecurityBadge';
import { OAuthButtons } from './OAuthButtons';
import { WalletButton } from './WalletButton';
import { useSignUp } from '../hooks/useSignUp';
import { cn } from '@/lib/utils';

// Form schema with acceptTerms as boolean for easier UX
const FormSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(3, 'Handle must be at least 3 characters.')
    .max(20, 'Handle must be 20 characters or fewer.')
    .regex(/^[a-z0-9_]+$/i, 'Letters, numbers, and underscores only.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(12, 'At least 12 characters.')
    .max(128)
    .refine((v) => /[a-z]/.test(v), 'Include a lowercase letter.')
    .refine((v) => /[A-Z]/.test(v), 'Include an uppercase letter.')
    .refine((v) => /\d/.test(v), 'Include a number.'),
  acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms.' }),
});

type FormValues = z.infer<typeof FormSchema>;

interface IconInputProps extends React.ComponentProps<'input'> {
  icon: React.ReactNode;
}

function IconInput({ icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        className={cn(
          'h-[42px] w-full rounded-[9px] border border-input bg-background/70 pl-[38px] pr-3 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#00d68f] focus:ring-[3px] focus:ring-[#00d68f]/20 dark:bg-[#0a0f17]',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function PasswordIconInput(props: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
      </span>
      <input
        type={show ? 'text' : 'password'}
        className="h-[42px] w-full rounded-[9px] border border-input bg-background/70 pl-[38px] pr-14 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#00d68f] focus:ring-[3px] focus:ring-[#00d68f]/20 dark:bg-[#0a0f17]"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-2 my-1 flex w-10 cursor-pointer items-center justify-center rounded-[7px] text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'hide' : 'show'}
      </button>
    </div>
  );
}

export function SignUpForm() {
  const { mutate, isPending, error } = useSignUp();
  const [newsletter, setNewsletter] = useState(true);
  const [pwValue, setPwValue] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { handle: '', email: '', password: '', acceptTerms: false },
  });

  const acceptTermsVal = watch('acceptTerms');

  const onSubmit = (data: FormValues) => {
    mutate({
      handle: data.handle,
      email: data.email,
      password: data.password,
      acceptTerms: true,
    });
  };

  return (
    <div>
      <h2 className="mb-1.5 mt-0.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        Start your trading edge
      </h2>
      <p className="mb-[18px] text-[12.5px] text-muted-foreground">
        Free for your first account · 30-day history · no card required.
      </p>

      <SecurityBadge />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Handle */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Trader handle
          </label>
          <IconInput
            type="text"
            autoComplete="username"
            placeholder="degenedge"
            icon={<AtSign className="h-3.5 w-3.5" />}
            {...register('handle')}
          />
          <p className="text-[11px] text-muted-foreground">
            Used on shared trade reports. Change anytime.
          </p>
          {errors.handle && <p className="text-xs text-destructive">{errors.handle.message}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Email
          </label>
          <IconInput
            type="email"
            autoComplete="email"
            placeholder="trader@protonmail.com"
            icon={<Mail className="h-3.5 w-3.5" />}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Password
          </label>
          <PasswordIconInput
            placeholder="At least 12 characters"
            autoComplete="new-password"
            {...register('password', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPwValue(e.target.value),
            })}
          />
          <PasswordStrengthMeter value={pwValue} className="mt-1.5" />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Newsletter */}
        <div className="flex items-center justify-between text-[12.5px]">
          <label className="flex cursor-pointer items-center gap-[7px] text-muted-foreground">
            <Checkbox
              checked={newsletter}
              onCheckedChange={(v) => setNewsletter(Boolean(v))}
              className="h-[14px] w-[14px] data-[state=checked]:bg-[#00a86b] data-[state=checked]:border-[#00a86b] data-[state=checked]:text-white"
            />
            <span>Send me weekly AI review reports</span>
          </label>
        </div>

        {error && <p className="text-xs text-destructive">{error.message}</p>}
        {errors.acceptTerms && (
          <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          onClick={() => setValue('acceptTerms', true)}
          className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold tracking-[0.01em] transition-[filter] hover:brightness-110"
          style={{
            background: 'linear-gradient(180deg,#00e29a,#00b67a)',
            color: '#06140f',
            boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
          }}
        >
          {isPending ? 'Creating account…' : 'Create account →'}
        </Button>

        <p className="text-center text-[11px] leading-[1.5] text-muted-foreground">
          By creating an account you agree to the{' '}
          <a href="#" className="font-medium hover:underline" style={{ color: '#00a86b' }}>
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="font-medium hover:underline" style={{ color: '#00a86b' }}>
            Privacy Policy
          </a>
          . You'll set up <b className="text-foreground">2FA</b> right after.
        </p>

        {/* Hidden to track acceptance state */}
        <input
          type="hidden"
          {...register('acceptTerms')}
          value={acceptTermsVal ? 'true' : 'false'}
        />
      </form>

      <Divider className="my-[18px]">or continue with</Divider>
      <OAuthButtons />
      <WalletButton />

      <p className="mt-[18px] text-center text-[12px] text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-bold text-primary hover:underline">
          Sign in →
        </Link>
      </p>
    </div>
  );
}
