'use client';

import React, { useEffect, useRef } from 'react';
import Logo from '@/components/logo';
import { ModeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

interface AuthLayoutProps {
  leftContent: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({ leftContent, children }: AuthLayoutProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const fillRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const W = 1200;
    const H = 800;
    const N = 140;

    function gen(): [number, number][] {
      const pts: [number, number][] = [];
      let v = H * 0.55;
      for (let i = 0; i <= N; i++) {
        v += (Math.random() - 0.5) * 22 - i * 0.55;
        v = Math.max(80, Math.min(H - 100, v));
        pts.push([i * (W / N), v]);
      }
      return pts;
    }

    function smooth(pts: [number, number][]): string {
      const first = pts[0];
      if (!first) return '';
      let d = `M${first[0]},${first[1]}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        if (!p0 || !p1) continue;
        const [x0, y0] = p0;
        const [x1, y1] = p1;
        const cx = (x0 + x1) / 2;
        d += ` Q ${cx},${y0} ${cx},${(y0 + y1) / 2} T ${x1},${y1}`;
      }
      return d;
    }

    function render() {
      const pts = gen();
      const d = smooth(pts);
      if (pathRef.current) pathRef.current.setAttribute('d', d);
      if (fillRef.current) fillRef.current.setAttribute('d', `${d} L ${W},${H} L 0,${H} Z`);
    }

    render();
    const id = setInterval(render, 5200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Radial gradients */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(700px 500px at 12% 25%, rgba(0,214,143,.07), transparent 60%)',
              'radial-gradient(700px 500px at 88% 75%, rgba(139,92,246,.08), transparent 60%)',
              'radial-gradient(800px 600px at 65% 5%, rgba(6,182,212,.05), transparent 60%)',
            ].join(','),
          }}
        />
        {/* Grid lines — dark mode */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: [
              'linear-gradient(rgba(31,39,51,.22) 1px,transparent 1px)',
              'linear-gradient(90deg,rgba(31,39,51,.22) 1px,transparent 1px)',
            ].join(','),
            backgroundSize: '42px 42px',
            maskImage: 'radial-gradient(circle at 50% 40%, #000 30%, transparent 75%)',
          }}
        />
        {/* Grid lines — light mode */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage: [
              'linear-gradient(rgba(100,120,140,.12) 1px,transparent 1px)',
              'linear-gradient(90deg,rgba(100,120,140,.12) 1px,transparent 1px)',
            ].join(','),
            backgroundSize: '42px 42px',
            maskImage: 'radial-gradient(circle at 50% 40%, #000 30%, transparent 75%)',
          }}
        />
        {/* Animated equity curve SVG */}
        <svg
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-40"
        >
          <defs>
            <linearGradient id="eq-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#00d68f" stopOpacity="0" />
              <stop offset=".5" stopColor="#00d68f" stopOpacity=".7" />
              <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00d68f" stopOpacity=".18" />
              <stop offset="1" stopColor="#00d68f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path ref={fillRef} d="" fill="url(#eq-fill)" />
          <path ref={pathRef} d="" stroke="url(#eq-line)" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Page grid */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 md:grid-cols-[1.1fr_1fr]">
        {/* Left panel — hidden on small screens */}
        <div className="hidden border-r border-border bg-gradient-to-b from-white/60 to-white/20 dark:from-black/20 dark:to-transparent md:flex md:flex-col md:justify-between md:px-12 md:py-10">
          {leftContent}
        </div>

        {/* Right panel */}
        <div className="relative flex min-h-screen flex-col px-4 md:px-12">
          {/* Mobile: brand + toggle header */}
          <div className="flex h-[68px] items-center justify-between md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Edgebook
              </span>
            </Link>
            <ModeToggle />
          </div>
          {/* Desktop: toggle aligned with left panel brand row */}
          <div className="absolute right-6 top-10 hidden md:flex md:items-center">
            <ModeToggle />
          </div>
          {/* Centered form */}
          <div className="flex flex-1 items-center justify-center py-10">{children}</div>
        </div>
      </div>
    </>
  );
}
