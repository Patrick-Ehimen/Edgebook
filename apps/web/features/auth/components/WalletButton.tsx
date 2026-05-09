'use client';

// TODO: Implement SIWE (Sign-In with Ethereum) when wallet integration is configured
export function WalletButton() {
  const handleClick = () => {
    // TODO: wire up MetaMask / Rabby / WalletConnect SIWE flow
    console.log('wallet:connect');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-2 flex w-full cursor-pointer items-center gap-[10px] rounded-[10px] border border-violet-500/25 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 px-3 py-[11px] text-[13px] transition-[filter] hover:brightness-110"
    >
      {/* Fox icon */}
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] text-[14px]"
        style={{ background: 'linear-gradient(135deg,#f6851b,#e2761b)' }}
        aria-hidden="true"
      >
        🦊
      </span>
      <span className="flex flex-col items-start">
        <b className="font-semibold text-foreground">Sign in with wallet</b>
        <span className="text-[11px] text-muted-foreground">
          MetaMask · Rabby · WalletConnect — gasless SIWE
        </span>
      </span>
      <span className="ml-auto text-muted-foreground" aria-hidden="true">
        →
      </span>
    </button>
  );
}
