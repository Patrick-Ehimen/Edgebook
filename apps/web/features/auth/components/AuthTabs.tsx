'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type Tab = 'sign-in' | 'sign-up';

interface AuthTabsProps {
  current: Tab;
}

export function AuthTabs({ current }: AuthTabsProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleChange = (tab: Tab) => {
    router.push(tab === 'sign-in' ? '/sign-in' : '/sign-up');
  };

  return (
    <div className="mb-5 grid grid-cols-2 cursor-pointer rounded-xl border border-border bg-[#f5f6fa] dark:bg-[#0a0f17] p-1">
      {(['sign-in', 'sign-up'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => handleChange(tab)}
          className={cn(
            'cursor-pointer rounded-[7px] px-2 py-2 text-[13px] font-medium transition-all',
            current === tab
              ? 'text-foreground shadow-sm bg-background dark:bg-transparent'
              : 'bg-transparent text-muted-foreground hover:text-foreground',
          )}
          style={
            current === tab && isDark
              ? {
                  background: 'linear-gradient(180deg,#1a2433,#161c26) padding-box, linear-gradient(135deg,#00d68f,#06b6d4) border-box',
                  border: '1px solid transparent',
                }
              : undefined
          }
        >
          {tab === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      ))}
    </div>
  );
}
