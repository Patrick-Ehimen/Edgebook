import { Button } from '../ui/button';
import Stat from './stats';

export default function Preview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
            ★ Differentiator
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            We catch the trade before the tilt does
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Most journals tell you what happened. Edgebook tells you what&apos;s about to. The tilt
            detector watches your fills in real time and flags revenge entries, oversize, and
            cooldown violations the moment they fire.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              'Cooldown after N consecutive losses',
              'Block re-entry within 60s of a stop-out',
              'Confirm dialog when size is 2× your average',
              'News-window block (CPI, FOMC, NFP)',
              'Daily max-loss circuit breaker',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 text-emerald-500">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* mock alert card */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-5 shadow-xl shadow-slate-900/5 dark:shadow-black/40">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/20 text-amber-600">
              !
            </div>
            <div className="flex-1 text-sm">
              <p className="text-amber-700 dark:text-amber-300">
                <b>Tilt watch:</b> 2 consecutive losses on ETHUSDT in the last 18 minutes. Position
                size on last entry was <b>1.7×</b> your 30-trade average.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-400">
                  Start 30-min cooldown
                </Button>
                <Button className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  Override
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
            <Stat label="Today's R" value="−1.2" tone="rose" />
            <Stat label="Discipline" value="68/100" tone="amber" />
            <Stat label="Cooldowns" value="2 today" />
          </div>
        </div>
      </div>
    </section>
  );
}
