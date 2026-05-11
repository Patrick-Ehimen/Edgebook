"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

const STYLES = [
  {
    id: "scalper",
    icon: "⚡",
    title: "Scalper",
    description: "Holds < 5 minutes · 5–30 trades/day · Tight stops, fast tempo.",
    config: "Risk cap 0.3%/trade · Default sessions: EU+US · Hold expectancy < 5min · 3 default playbooks loaded",
  },
  {
    id: "day",
    icon: "📊",
    title: "Day trader",
    description: "Intraday only · 2–8 trades/day · Session-based bias.",
    config: "Risk cap 0.5%/trade · Default sessions: any · Hold expectancy < 2h · 4 default playbooks loaded",
  },
  {
    id: "swing",
    icon: "🌊",
    title: "Swing trader",
    description: "Multi-day holds · 1–4 trades/week · HTF structure.",
    config: "Risk cap 0.7%/trade · Default sessions: any · Hold expectancy multi-day · 2 default playbooks loaded",
  },
  {
    id: "hybrid",
    icon: "🎯",
    title: "Hybrid",
    description: "Mix of scalps + swings · Tag separately for clean stats.",
    config: "Two profiles created (scalp + swing) · Auto-tagging by hold time · 5 default playbooks loaded",
  },
];

export function TradingStyleStep({ onNext: _onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState("scalper");

  const selectedStyle = STYLES.find(s => s.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11.5px] text-[var(--ob-muted)] uppercase tracking-widest font-semibold mb-2">
          Step 1 · Profile
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">What&apos;s your trading style?</h1>
        <p className="text-[var(--ob-muted-2)]">
          We&apos;ll pre-fill sensible defaults — risk caps, session windows, default playbooks. You can change everything later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {STYLES.map((style) => (
          <div
            key={style.id}
            onClick={() => setSelected(style.id)}
            className={`relative p-4 rounded-xl border-2 cursor-pointer bg-[var(--ob-panel)] transition-all group ${
              selected === style.id
                ? "border-[var(--green)] shadow-[0_0_0_3px_rgba(0,214,143,0.15)]"
                : "border-[var(--ob-border)] hover:border-[var(--ob-muted)]/30 hover:-translate-y-0.5"
            }`}
          >
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected === style.id ? "bg-[var(--green)] border-[var(--green)]" : "border-[var(--ob-border)]"
            }`}>
              {selected === style.id && <span className="text-[#06140f] text-[10px] font-bold">✓</span>}
            </div>
            
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl mb-3 ${
              style.id === "scalper" ? "bg-[var(--green)]/10 text-[var(--green)]" :
              style.id === "day" ? "bg-[#06b6d4]/10 text-[#06b6d4]" :
              style.id === "swing" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" :
              "bg-[#f5a524]/10 text-[#f5a524]"
            }`}>
              {style.icon}
            </div>
            
            <h4 className="font-semibold mb-1">{style.title}</h4>
            <p className="text-xs text-[var(--ob-muted)] leading-relaxed">{style.description}</p>
          </div>
        ))}
      </div>

      <Card className="p-5 bg-[var(--ob-panel)] border-[var(--ob-border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">We&apos;ll pre-configure</h4>
            <p className="text-xs text-[var(--ob-muted)]">{selectedStyle?.config}</p>
          </div>
          <Chip tone="emerald" className="w-fit">Recommended for crypto perps</Chip>
        </div>
      </Card>
    </div>
  );
}
