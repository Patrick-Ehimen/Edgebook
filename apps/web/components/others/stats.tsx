export default function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'rose' | 'amber';
}) {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/5 dark:bg-white/[.02]">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500">
        {label}
      </div>
      <div
        className={[
          'mt-1 font-mono text-base font-semibold tabular-nums',
          tone ? tones[tone] : '',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  );
}
