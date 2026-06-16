'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Divider } from '@/components/ui/divider';
import { SecurityBadge } from './SecurityBadge';
import { OAuthButtons } from './OAuthButtons';
import { WalletButton } from './WalletButton';
import { AuthFormSkeleton } from './AuthFormSkeleton';
import { useSignIn } from '../hooks/useSignIn';
import { SignInInput } from '../schemas';
import { cn } from '@/lib/utils';

interface IconInputProps extends React.ComponentProps<'input'> {
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
}

function IconInput({ icon, rightSlot, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        className={cn(
          'h-[42px] w-full rounded-[9px] border border-input bg-background/70 pl-[38px] pr-3 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-[#00d68f] focus:ring-[3px] focus:ring-[#00d68f]/20 dark:bg-[#0a0f17]',
          rightSlot && 'pr-10',
          className,
        )}
        {...props}
      />
      {rightSlot}
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

export function SignInForm() {
  const { mutate, isPending, error } = useSignIn();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === '1';
  const emailVerified = searchParams.get('verified') === '1';

  const form = useForm<SignInInput>({
    resolver: zodResolver(SignInInput),
    defaultValues: { email: '', password: '', remember: false },
  });

  if (isPending) return <AuthFormSkeleton variant="sign-in" />;

  return (
    <div>
      <h2 className="mb-1.5 mt-0.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        Welcome back, trader
      </h2>
      <p className="mb-[18px] text-[13px] text-muted-foreground">
        Sign in to log your trades and unlock today&apos;s insights.
      </p>

      <SecurityBadge />

      {emailVerified && (
        <p className="mb-4 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary">
          Email verified! Sign in to continue setup.
        </p>
      )}
      {resetSuccess && (
        <p className="mb-4 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary">
          Password updated. Sign in with your new password.
        </p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutate(d))} className="space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Email
                </FormLabel>
                <FormControl>
                  <IconInput
                    type="email"
                    autoComplete="email"
                    placeholder="trader@protonmail.com"
                    icon={<Mail className="h-3.5 w-3.5" />}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Password
                </FormLabel>
                <FormControl>
                  <PasswordIconInput
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember / Forgot row */}
          <div className="-mt-1 mb-[14px] flex items-center justify-between text-[12.5px]">
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-[7px] text-muted-foreground">
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    className="h-[14px] w-[14px] data-[state=checked]:bg-[#00a86b] data-[state=checked]:border-[#00a86b] data-[state=checked]:text-white"
                  />
                  <span>Keep me signed in (30d)</span>
                </label>
              )}
            />
            <Link
              href="/forgot"
              className="font-medium hover:underline"
              style={{ color: '#00a86b' }}
            >
              Forgot?
            </Link>
          </div>

          {error && <p className="text-xs text-destructive">{error.message}</p>}

          <Button
            type="submit"
            disabled={isPending}
            className="h-[46px] w-full cursor-pointer rounded-[10px] text-[14px] font-semibold tracking-[0.01em] transition-[filter] hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg,#00e29a,#00b67a)',
              color: '#06140f',
              boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
            }}
          >
            {isPending ? 'Signing in…' : 'Sign in →'}
          </Button>
        </form>
      </Form>

      <Divider className="my-[18px]">or continue with</Divider>
      <OAuthButtons />
      <WalletButton />

      <p className="mt-[18px] text-center text-[12px] text-muted-foreground">
        New to Edgebook?{' '}
        <Link href="/sign-up" className="font-bold text-primary hover:underline">
          Create an account →
        </Link>
      </p>
    </div>
  );
}
