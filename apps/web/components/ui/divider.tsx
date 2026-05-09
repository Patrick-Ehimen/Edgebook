import { cn } from '@/lib/utils';

interface DividerProps {
  children?: React.ReactNode;
  className?: string;
}

export function Divider({ children, className }: DividerProps) {
  if (!children) {
    return <hr className={cn('border-slate-200 dark:border-white/10', className)} />;
  }
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400',
        className,
      )}
    >
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  );
}
