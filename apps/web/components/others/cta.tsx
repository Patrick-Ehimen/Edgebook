import Link from 'next/link';

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Stop losing trades to the same mistake.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
        Connect your exchange in 60 seconds. Free forever for one account.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/sign-up"
          className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
        >
          Start free
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          Read the docs
        </Link>
      </div>
    </section>
  );
}
