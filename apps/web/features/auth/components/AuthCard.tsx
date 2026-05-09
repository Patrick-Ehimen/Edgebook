import { cn } from '@/lib/utils';

interface AuthCardProps {
  className?: string;
  children: React.ReactNode;
}

export function AuthCard({ className, children }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[430px] rounded-2xl border border-border bg-card/90 p-7 shadow-[0_28px_80px_rgba(0,0,0,.55)] backdrop-blur-xl dark:bg-[rgba(15,20,29,.6)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
