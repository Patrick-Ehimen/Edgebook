'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradingStyleStep } from './steps/trading-style';
import { ConnectExchangeStep } from './steps/connect-exchange';
import { SyncStep } from './steps/sync';
import { PlaybookStep } from './steps/playbook';
import { TiltRulesStep } from './steps/tilt-rules';
import { WelcomeStep } from './steps/welcome';
import { Button } from '@/components/ui/button';

const STEPS = [
  { id: 1, title: 'Trading style', description: 'Pre-fills your defaults' },
  { id: 2, title: 'Connect exchange', description: 'Read-only · KMS encrypted' },
  { id: 3, title: 'Backfill', description: 'Last 90 days of fills' },
  { id: 4, title: 'First playbook', description: 'Optional' },
  { id: 5, title: 'Tilt rules', description: 'Discipline guardrails' },
  { id: 6, title: 'All set', description: 'First insight ready' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const progressBar = document.getElementById('onboarding-progress');
    const stepText = document.getElementById('onboarding-step-text');
    if (progressBar) {
      progressBar.style.width = `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`;
    }
    if (stepText) {
      stepText.innerText = `Step ${currentStep} of ${STEPS.length}`;
    }
  }, [currentStep]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (currentStep < STEPS.length) setCurrentStep((prev) => prev + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  return (
    <>
      <aside className="hidden lg:block w-[280px] pt-7 px-7 pb-28 border-r border-[var(--ob-border)]">
        <h4 className="text-[11px] uppercase tracking-widest text-[var(--ob-muted)] font-semibold mb-3.5">
          Set up your account
        </h4>
        <div className="space-y-1">
          {STEPS.map((step) => {
            const isDone = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div
                key={step.id}
                onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                className={`group flex gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isCurrent ? 'bg-[var(--ob-panel-2)] text-[var(--ob-text)]' : 'text-[var(--ob-muted-2)] hover:bg-[var(--ob-panel-2)]/50'
                } ${isDone ? 'text-[var(--ob-text)]' : ''}`}
              >
                <div
                  className={`flex-none w-[22px] h-[22px] rounded-full border flex items-center justify-center text-[11px] font-mono transition-colors ${
                    isCurrent
                      ? 'bg-gradient-to-br from-[var(--green)] to-[#06b6d4] border-transparent text-[#06140f] font-bold'
                      : isDone
                        ? 'bg-[var(--green)]/20 border-[var(--green)] text-[var(--green)]'
                        : 'bg-[var(--ob-panel-2)] border-[var(--ob-border)] text-[var(--ob-muted)]'
                  }`}
                >
                  {isDone ? '✓' : step.id}
                </div>
                <div>
                  <div className="text-[13px] font-medium leading-tight mb-0.5">{step.title}</div>
                  <div className="text-[11.5px] text-[var(--ob-muted)] leading-tight">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <hr className="my-4 border-[var(--ob-border)]" />
        <div className="text-xs text-[var(--ob-muted)]">
          Estimated time
          <br />
          <b className="text-[var(--ob-text)]">~3 minutes</b>
        </div>
      </aside>

      <main className="flex-1 px-4 pt-8 pb-28 md:px-12 md:pt-9 max-w-[780px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && <TradingStyleStep onNext={nextStep} />}
            {currentStep === 2 && <ConnectExchangeStep onNext={nextStep} onBack={prevStep} />}
            {currentStep === 3 && <SyncStep onNext={nextStep} />}
            {currentStep === 4 && <PlaybookStep onNext={nextStep} onBack={prevStep} />}
            {currentStep === 5 && <TiltRulesStep onNext={nextStep} onBack={prevStep} />}
            {currentStep === 6 && <WelcomeStep />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 md:px-7 md:py-4 border-t border-[var(--ob-border)] bg-[var(--ob-bg)]/85 backdrop-blur-lg flex items-center justify-between z-50">
        <span className="hidden md:block text-xs text-[var(--ob-muted)]">
          Press <span className="text-[var(--ob-text)] font-medium">↵ Enter</span> to continue
        </span>
        <div className="flex gap-2 ml-auto">
          {currentStep > 1 && currentStep < 6 && (
            <Button
              onClick={prevStep}
              className="cursor-pointer px-4 py-2 text-[13px] rounded-lg border border-[var(--ob-border)] bg-[var(--ob-panel-2)] text-[var(--ob-text)] hover:brightness-110 transition-all"
            >
              ← Back
            </Button>
          )}
          <Button
            onClick={nextStep}
            className={`cursor-pointer px-4 py-2 text-[13px] font-semibold rounded-lg transition-all ${
              currentStep === 6
                ? 'bg-gradient-to-b from-[#00e29a] to-[#00b67a] text-[#06140f]'
                : 'bg-gradient-to-b from-[#00e29a] to-[#00b67a] text-[#06140f] shadow-[0_8px_24px_rgba(0,214,143,0.18)]'
            }`}
          >
            {currentStep === 6
              ? 'Open dashboard →'
              : currentStep === 5
                ? 'Finish setup →'
                : 'Continue →'}
          </Button>
        </div>
      </footer>
    </>
  );
}
