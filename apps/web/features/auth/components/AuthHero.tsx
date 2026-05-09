import Link from 'next/link';
import Logo from '@/components/logo';

export function AuthHero() {
  return (
    <div className="flex flex-col justify-between gap-8 py-2">
      {/* Brand row */}
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-base font-semibold tracking-tight text-foreground">Edgebook</span>
        </Link>
        <span className="rounded-full border border-border bg-card px-[7px] py-[2px] text-[10.5px] text-muted-foreground dark:bg-[rgba(15,20,29,.6)] dark:text-foreground/70">
          v1 · BETA
        </span>
      </div>

      {/* Hero copy */}
      <div className="flex flex-col gap-0 mt-24">
        <h1 className="mb-4 text-[44px] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground">
          The crypto futures journal that{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg,#00d68f,#06b6d4 60%,#8b5cf6)' }}
          >
            finds your edge
          </span>{' '}
          — and your tilt.
        </h1>
        <p className="mb-5 max-w-[520px] text-[15px] text-muted-foreground">
          Auto-sync Binance, Bybit and OKX. Replay every fill. Catch revenge trades before they
          happen. Built for active perp traders who actually want to improve.
        </p>

        {/* Feature tiles 2×2 */}
        <div className="mt-2 grid max-w-[540px] grid-cols-2 gap-[10px]">
          {[
            {
              icon: '⚡',
              colorClass: 'bg-green-500/12 text-green-400',
              title: 'Auto-sync CEX perps',
              desc: 'Read-only API, fill-grouped, funding-aware.',
            },
            {
              icon: '🧠',
              colorClass: 'bg-violet-500/12 text-violet-400',
              title: 'Real-time tilt detector',
              desc: 'Catches revenge trades and oversize entries.',
            },
            {
              icon: '📈',
              colorClass: 'bg-cyan-500/12 text-cyan-400',
              title: 'Edge decay watch',
              desc: 'Per-playbook PF, win-rate, drift alerts.',
            },
            {
              icon: '🔒',
              colorClass: 'bg-amber-500/12 text-amber-400',
              title: 'Read-only · 2FA · KMS',
              desc: 'Withdrawals are tested-and-blocked at onboarding.',
            },
          ].map(({ icon, colorClass, title, desc }) => (
            <div
              key={title}
              className="flex gap-[10px] rounded-[10px] border border-border bg-card/60 p-[11px_13px] backdrop-blur-sm dark:bg-[rgba(15,20,29,.6)]"
            >
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] text-[14px] ${colorClass}`}
              >
                {icon}
              </div>
              <div>
                <b className="text-[13px] font-semibold text-foreground">{title}</b>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live ticker */}
        <div className="mt-[22px] flex max-w-[540px] items-center gap-4 overflow-hidden rounded-[10px] border border-border bg-card/70 px-3 py-[10px] text-[12px] text-muted-foreground backdrop-blur-sm dark:bg-[rgba(15,20,29,.6)]">
          <span
            className="pulse-dot h-[7px] w-[7px] flex-shrink-0 rounded-full bg-primary"
            style={{ boxShadow: '0 0 0 3px rgba(0,214,143,.18)' }}
          />
          {[
            { sym: 'BTC', price: '67,142', pct: '+1.4%', up: true },
            { sym: 'ETH', price: '3,082', pct: '+2.1%', up: true },
            { sym: 'SOL', price: '184.20', pct: '−0.8%', up: false },
            { sym: 'HYPE', price: '32.40', pct: '+5.6%', up: true },
          ].map(({ sym, price, pct, up }) => (
            <span key={sym} className="flex items-center gap-1.5 whitespace-nowrap font-mono">
              <b className="font-semibold text-foreground">{sym}</b> {price}{' '}
              <span style={{ color: up ? '#00d68f' : undefined }} className={!up ? 'text-destructive' : ''}>{pct}</span>
            </span>
          ))}
          <span className="ml-auto whitespace-nowrap text-muted-foreground">
            12,408 traders journaling now
          </span>
        </div>
      </div>

      {/* Floating preview card */}
      <div
        className="pointer-events-none absolute bottom-16 -right-10 hidden w-[340px] rounded-2xl border border-border bg-card p-3 opacity-95 shadow-2xl xl:block"
        style={{ transform: 'rotate(-2.5deg)' }}
      >
        <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
          <span>Account · Binance Main</span>
          <span className="font-mono">30D</span>
        </div>
        <div className="font-mono text-[22px] font-semibold text-primary">+ $14,827</div>
        <div className="text-[11px] text-muted-foreground">+12.4R · 142W / 100L · PF 2.14</div>
        <svg viewBox="0 0 320 90" preserveAspectRatio="none" className="mt-2 h-[90px] w-full">
          <defs>
            <linearGradient id="pf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00d68f" stopOpacity=".35" />
              <stop offset="1" stopColor="#00d68f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,72 L20,68 L40,74 L60,60 L80,55 L100,48 L120,52 L140,44 L160,38 L180,42 L200,30 L220,28 L240,18 L260,22 L280,12 L300,8 L320,10 L320,90 L0,90 Z"
            fill="url(#pf-fill)"
          />
          <path
            d="M0,72 L20,68 L40,74 L60,60 L80,55 L100,48 L120,52 L140,44 L160,38 L180,42 L200,30 L220,28 L240,18 L260,22 L280,12 L300,8 L320,10"
            stroke="#00d68f"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* Credits */}
      <p className="max-w-[540px] text-[11.5px] text-muted-foreground">
        Trusted by scalpers, swing traders, and prop traders worldwide. Read-only by design —
        Edgebook never has access to move funds.
        <br />
        <a
          href="#"
          className="text-muted-foreground underline decoration-border hover:text-foreground"
        >
          Privacy
        </a>
        {' · '}
        <a
          href="#"
          className="text-muted-foreground underline decoration-border hover:text-foreground"
        >
          Security
        </a>
        {' · '}
        <a
          href="#"
          className="text-muted-foreground underline decoration-border hover:text-foreground"
        >
          System status
        </a>
      </p>
    </div>
  );
}
