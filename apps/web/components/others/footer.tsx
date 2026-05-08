import Logo from '../logo';
import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 text-sm text-slate-600 sm:flex-row sm:items-center dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-medium text-slate-900 dark:text-slate-100">Edgebook</span>
          <span>· © {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy">Privacy</Link>
          <Link href="/security">Security</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/changelog">Changelog</Link>
          <Link href="/status">Status</Link>
        </div>
      </div>
    </footer>
  );
}
