import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  default:
    'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, tone = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = 'Chip';
