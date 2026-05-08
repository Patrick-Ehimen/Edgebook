import * as React from 'react';
import Link from 'next/link';
import Logo from '../logo';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-[#070a10]/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span>Edgebook</span>
          <span className="ml-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-normal text-slate-500 dark:border-white/10 dark:text-slate-400">
            BETA
          </span>
        </Link>
        <nav className="hidden gap-5 text-sm text-slate-600 md:flex dark:text-slate-400">
          <Link href="#features" className="hover:text-slate-900 dark:hover:text-white">
            Product
          </Link>
          <Link href="#pricing" className="hover:text-slate-900 dark:hover:text-white">
            Pricing
          </Link>
          <Link href="/docs" className="hover:text-slate-900 dark:hover:text-white">
            Docs
          </Link>
          <Link href="/changelog" className="hover:text-slate-900 dark:hover:text-white">
            Changelog
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/sign-in"
            className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
          >
            Start free →
          </Link>
        </div>
      </div>
    </header>
  );
}
