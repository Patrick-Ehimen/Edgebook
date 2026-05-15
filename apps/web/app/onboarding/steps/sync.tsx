"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

const SYNC_LOGS = [
  { text: "GET /api/v3/account", result: "✓ 200" },
  { text: "GET /fapi/v1/userTrades?limit=1000", result: "✓ 1000 fills" },
  { text: "GET /fapi/v1/userTrades?fromId=…", result: "✓ 1000 fills" },
  { text: "GET /fapi/v1/userTrades?fromId=…", result: "✓ 412 fills" },
  { text: "GET /fapi/v1/income?incomeType=FUNDING_FEE", result: "✓ 38 funding txns" },
  { text: "compute_positions(account=binance_main)", result: "✓ 1,284 positions" },
  { text: "compute_metrics(MFE/MAE/R)", result: "✓" },
  { text: "index_for_search()", result: "✓" },
];

export function SyncStep({ onNext }: { onNext: () => void }) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ text: string; result: string }[]>([]);
  const [fills, setFills] = useState(0);
  const [stage, setStage] = useState("Connecting...");
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    let currentFills = 0;
    
    const interval = setInterval(() => {
      if (i < SYNC_LOGS.length) {
        const log = SYNC_LOGS[i];
        if (!log) return;

        setLogs(prev => [...prev, log]);
        
        const m = log.result.match(/(\d+)/);
        if (m && log.result.includes("fills")) {
          currentFills += parseInt(m[1] || "0", 10);
          setFills(currentFills);
        }
        
        const p = Math.round(((i + 1) / SYNC_LOGS.length) * 100);
        setProgress(p);
        
        if (i < 2) setStage("Connecting...");
        else if (i < 5) setStage("Fetching fills...");
        else if (i < 7) setStage("Computing positions...");
        else setStage("Done.");
        
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11.5px] text-[var(--ob-muted)] uppercase tracking-widest font-semibold mb-2">
          Step 3 · Importing
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Backfilling your trade history</h1>
        <p className="text-[var(--ob-muted-2)]">
          We&apos;re pulling the last 90 days. This takes ~30 seconds for most accounts.
        </p>
      </div>

      <Card className="p-6 bg-[var(--ob-panel)] border-[var(--ob-border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">
            <b className="text-[var(--ob-text)]">{fills.toLocaleString()} fills</b> · <span className="text-[var(--ob-muted)]">{stage}</span>
          </div>
          <div className="font-mono text-xs text-[var(--ob-muted)]">{progress}%</div>
        </div>

        <div className="w-full h-2 bg-[var(--ob-panel-2)] rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-gradient-to-r from-[var(--green)] to-[#06b6d4] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div 
          ref={logRef}
          className="h-40 overflow-auto bg-[var(--ob-panel-2)] border border-[var(--ob-border)] rounded-lg p-3 font-mono text-[11.5px] text-[var(--ob-muted)] space-y-1"
        >
          {logs.map((log, idx) => (
            <div key={idx}>
              <span className="text-[var(--ob-muted-2)]">›</span> {log.text}{" "}
              <span className="text-[var(--green)]">{log.result}</span>
            </div>
          ))}
        </div>

        <hr className="my-5 border-[var(--ob-border)]" />

        <div className="flex flex-wrap gap-2">
          <Chip tone={progress > 0 ? "emerald" : "default"}>
            {progress > 0 ? "✓" : "○"} API key validated · read-only
          </Chip>
          <Chip tone={progress >= 20 ? "emerald" : "default"}>
            {progress >= 60 ? "✓" : progress >= 20 ? "⏳" : "○"} Fetching fills
          </Chip>
          <Chip tone={progress >= 70 ? "emerald" : "default"}>
            {progress >= 85 ? "✓" : progress >= 70 ? "⏳" : "○"} Computing positions
          </Chip>
          <Chip tone={progress >= 90 ? "emerald" : "default"}>
            {progress >= 100 ? "✓" : progress >= 90 ? "⏳" : "○"} Capturing funding
          </Chip>
          {done && <Chip tone="emerald">✓ Done</Chip>}
        </div>
      </Card>
    </div>
  );
}
