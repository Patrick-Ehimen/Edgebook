import type { Metadata } from "next";
import { ModeToggle } from "@/components/theme-toggle";
import Logo from "@/components/logo";
import { SkipSetupButton } from "./skip-setup-button";

export const metadata: Metadata = {
  title: "Get started — Edgebook",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--ob-bg)] text-[var(--ob-text)] font-sans selection:bg-green-500/30">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-green-500/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center gap-4 px-7 py-4 border-b border-[var(--ob-border)] bg-[var(--ob-bg)]/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2.5 font-semibold">
            <Logo />
            <span>Edgebook</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3 ml-4 text-xs text-[var(--ob-muted)]">
            <div className="w-36 h-1 bg-[var(--ob-panel-2)] rounded-full overflow-hidden">
              <div 
                id="onboarding-progress" 
                className="h-full bg-gradient-to-r from-[var(--green)] to-[#06b6d4] transition-all duration-300"
                style={{ width: '0%' }}
              />
            </div>
            <span id="onboarding-step-text">Step 1 of 6</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button type="button" className="cursor-pointer text-[12.5px] text-[var(--ob-muted)] hover:text-[var(--ob-text)] transition-colors">
              Need help?
            </button>
            <ModeToggle />
            <SkipSetupButton />
          </div>
        </header>

        <div className="flex-1 flex max-w-[1280px] mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
