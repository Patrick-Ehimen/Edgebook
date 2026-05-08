import { PRICES } from '@/constants';
import { Button } from '../ui/button';

export default function PricingTeaser() {
  return (
    <section
      id="pricing"
      className="border-t border-slate-200/80 bg-white/40 py-20 dark:border-white/5 dark:bg-white/[.02]"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing built for traders
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Start free. Upgrade when your edge is paying for itself. Cancel anytime.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PRICES.map((p) => (
            <div
              key={p.name}
              className={[
                'rounded-2xl border p-6',
                p.highlight
                  ? 'border-emerald-400/60 bg-white shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-400/20 dark:bg-[#0f141d]'
                  : 'border-slate-200 bg-white dark:border-white/5 dark:bg-white/[.02]',
              ].join(' ')}
            >
              {p.highlight && (
                <span className="mb-3 inline-block rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-950">
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {p.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{p.note}</span>
              </div>
              <Button
                className={[
                  'mt-5 w-full rounded-lg py-2.5 text-sm font-semibold',
                  p.highlight
                    ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                    : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {p.cta}
              </Button>
              <ul className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-emerald-500">✓</span> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          All plans include 2FA, KMS-encrypted keys, and unlimited CSV exports.
        </p>
      </div>
    </section>
  );
}
