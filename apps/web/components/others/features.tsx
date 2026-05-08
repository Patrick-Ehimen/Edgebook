import { FEATURES } from '@/constants';

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          A journal that does the boring work
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          So you can spend your time on the trade, not the tracking.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-white/5 dark:bg-white/[.02] dark:hover:border-emerald-500/30"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <span className="text-base">{f.icon}</span>
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
