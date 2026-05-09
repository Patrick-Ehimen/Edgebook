'use client';

// TODO: Implement OAuth sign-in when providers are configured (Google, GitHub, X)
export function OAuthButtons() {
  const handleOAuth = (provider: string) => {
    // TODO: wire up actual OAuth redirect
    console.log(`oauth:${provider}`);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border border-border bg-background/80 dark:bg-[#0a0f17] px-[10px] py-[10px] text-[12.5px] text-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0">
          <path fill="#4285f4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.28-1.93-6.15-4.52H2.17v2.84A11 11 0 0 0 12 23z" />
          <path fill="#fbbc05" d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.35-2.11V7.05H2.17A11 11 0 0 0 1 12c0 1.78.43 3.46 1.17 4.95l3.68-2.84z" />
          <path fill="#ea4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.17 7.05l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38z" />
        </svg>
        Google
      </button>

      {/* GitHub */}
      <button
        type="button"
        onClick={() => handleOAuth('github')}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border border-border bg-background/80 dark:bg-[#0a0f17] px-[10px] py-[10px] text-[12.5px] text-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0">
          <path
            className="fill-foreground"
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.94c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.74-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.13 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
        GitHub
      </button>

      {/* X (formerly Twitter) */}
      <button
        type="button"
        onClick={() => handleOAuth('x')}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border border-border bg-background/80 dark:bg-[#0a0f17] px-[10px] py-[10px] text-[12.5px] text-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0">
          <path
            className="fill-foreground"
            d="M18.244 2H21.5l-7.5 8.57L23 22h-6.93l-5.42-7.06L4.4 22H1.14l8.04-9.18L1 2h7.07l4.9 6.48L18.24 2zm-1.22 18h1.92L7.06 4H5.04l11.98 16z"
          />
        </svg>
        X
      </button>
    </div>
  );
}
