import { Binance, Bybit, BybitDark } from '@/public';
import Image from 'next/image';

export default function ExchangePartners() {
  const exchanges = [
    { name: 'Binance', light: Binance, dark: Binance },
    { name: 'Bybit', light: Bybit, dark: BybitDark },
  ];

  return (
    <section className="border-y border-slate-200/80 bg-white/40 py-8 dark:border-white/5 dark:bg-white/[.02]">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-slate-500 dark:text-slate-500">
          Read-only sync supported on
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {exchanges.map((exchange) => (
            <div key={exchange.name} className="flex items-center justify-center">
              {/* Light mode logo */}
              <Image
                src={exchange.light}
                alt={`${exchange.name} logo`}
                className="h-8 w-auto opacity-75 transition-all hover:grayscale-0 dark:hidden"
              />

              {/* Dark mode logo */}
              <Image
                src={exchange.dark}
                alt={`${exchange.name} logo`}
                className="hidden h-8 w-auto opacity-75 transition-all hover:grayscale-0 dark:block"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
