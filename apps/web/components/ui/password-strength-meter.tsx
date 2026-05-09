import { scorePassword } from '@/lib/password';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  className?: string;
}

const FILL_COLORS = [
  'bg-slate-200 dark:bg-white/10',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-emerald-500',
] as const;

const LABEL_COLORS = [
  'text-slate-400',
  'text-rose-500',
  'text-amber-500',
  'text-cyan-500',
  'text-emerald-500',
] as const;

export function PasswordStrengthMeter({ value, className }: Props) {
  const { score, label } = scorePassword(value);
  const empty = value.length === 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              !empty && i <= score ? FILL_COLORS[score] : 'bg-slate-200 dark:bg-white/10',
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'min-w-[5ch] text-right text-xs font-medium',
          empty ? 'text-slate-400' : LABEL_COLORS[score],
        )}
      >
        {empty ? '—' : label}
      </span>
    </div>
  );
}
