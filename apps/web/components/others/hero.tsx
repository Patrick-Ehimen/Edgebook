import Link from 'next/link';
export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          12,408 traders journaling now
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          The crypto futures journal
          <br />
          that finds your edge —
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            and catches your tilt.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-400">
          Auto-syncs your CEX perp trades. Replays every fill. Detects revenge trades before they
          cost you money. Built for active perp traders who actually want to improve.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
          >
            Start free — no card required
          </Link>
          <Link
            href="#features"
            className="rounded-lg border border-slate-200 bg-white/60 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            See it work →
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Read-only API only · 2FA enforced · keys envelope-encrypted with KMS
        </p>
      </div>

      {/* hero visual: equity curve preview card */}
    </section>
  );
}
