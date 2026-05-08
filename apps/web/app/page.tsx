import React from 'react';
import Hero from '@/components/others/hero';
import ExchangePartners from '@/components/others/exchange-partners';

import SiteHeader from '@/components/others/siteheader';
import { ModeToggle } from '@/components/theme-toggle';
import Features from '@/components/others/features';
import HowItWorks from '@/components/others/how-it-works';
import Preview from '@/components/others/preview';
import PricingTeaser from '@/components/others/pricing';
import FinalCta from '@/components/others/cta';
import SiteFooter from '@/components/others/footer';

export default function Home() {
  return (
    <div>
      {/* ambient gradient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(700px 500px at 12% 10%, rgba(0,214,143,0.10), transparent 60%), radial-gradient(700px 500px at 88% 90%, rgba(139,92,246,0.10), transparent 60%)',
        }}
      />

      <SiteHeader />
      <Hero />
      <ExchangePartners />
      <Features />
      <HowItWorks />
      <Preview />
      <PricingTeaser />
      <FinalCta />
      <SiteFooter />
      <div className="fixed bottom-6 right-6 z-50">
        <ModeToggle />
      </div>
    </div>
  );
}
