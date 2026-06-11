'use client';

import { positionsApi } from '@/features/positions/api';
import { journalApi } from '@/features/journal';
import { playbooksApi } from '@/features/playbooks/api';
import { useAccounts } from '@/features/accounts';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Brain, NotebookPen, Plug, Scale, Target, BarChart2, Zap, Trophy, Plus, TrendingDown } from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

function parsePnl(n: string | null | undefined): number {
  if (!n) return 0;
  const v = Number.parseFloat(n);
  return Number.isNaN(v) ? 0 : v;
}

function parseNum(n: string | number | null | undefined): number {
  if (n == null) return 0;
  const v = typeof n === 'number' ? n : Number.parseFloat(n);
  return Number.isNaN(v) ? 0 : v;
}

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(2)}`;
  return n < 0 ? `-${s}` : `+${s}`;
}

function fmtDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

function profitFactor(pnls: number[]): number {
  const wins = pnls.filter(v => v > 0).reduce((s, v) => s + v, 0);
  const losses = Math.abs(pnls.filter(v => v < 0).reduce((s, v) => s + v, 0));
  return losses === 0 ? (wins > 0 ? 99 : 0) : wins / losses;
}

const CONV_LABELS: Record<number, string> = { 1: 'Very low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very high' };
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── skeleton atoms ───────────────────────────────────────────────────────────

function SkeletonBox({ w = '100%', h = 12, r = 6, style }: { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: r,
      background: 'linear-gradient(90deg, var(--eb-panel-2) 25%, var(--eb-border) 50%, var(--eb-panel-2) 75%)',
      backgroundSize: '400% 100%',
      animation: 'eb-shimmer 1.4s ease infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}

function SkeletonPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--eb-panel)',
      border: '1px solid var(--eb-border)',
      borderRadius: 10,
      padding: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function MindLabSkeleton() {
  return (
    <>
      <style>{'@keyframes eb-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}'}</style>
      <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>

        {/* breadcrumb */}
        <SkeletonBox w={160} h={11} style={{ marginBottom: 14 }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <SkeletonBox w={140} h={22} r={8} />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBox w={100} h={22} r={99} />
            <SkeletonBox w={80} h={22} r={99} />
          </div>
        </div>

        {/* Row 1: Behavioral | Conviction */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {[1, 2].map(k => (
            <SkeletonPanel key={k}>
              <SkeletonBox w={160} h={11} style={{ marginBottom: 14 }} />
              {[1, 2, 3, 4].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <SkeletonBox w="40%" h={11} />
                  <SkeletonBox w="25%" h={11} />
                  <SkeletonBox w="35%" h={7} r={99} />
                </div>
              ))}
            </SkeletonPanel>
          ))}
        </div>

        {/* Row 2: Daily intent | Tilt rules */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
          <SkeletonPanel>
            <SkeletonBox w={140} h={11} style={{ marginBottom: 14 }} />
            <SkeletonBox h={11} style={{ marginBottom: 8 }} />
            <SkeletonBox w="70%" h={11} style={{ marginBottom: 8 }} />
            <SkeletonBox w={90} h={26} r={7} style={{ marginBottom: 16 }} />
            <div style={{ borderTop: '1px solid var(--eb-border)', marginBottom: 12 }} />
            <SkeletonBox w={120} h={10} style={{ marginBottom: 8 }} />
            <SkeletonBox w="50%" h={11} />
          </SkeletonPanel>
          <SkeletonPanel>
            <SkeletonBox w={80} h={11} style={{ marginBottom: 14 }} />
            {[1, 2, 3, 4].map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <SkeletonBox w={14} h={14} r={4} />
                <SkeletonBox h={11} />
              </div>
            ))}
          </SkeletonPanel>
        </div>

        {/* Row 3: Session quality | Day-of-week */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <SkeletonPanel>
            <SkeletonBox w={160} h={11} style={{ marginBottom: 14 }} />
            <SkeletonBox w={80} h={36} r={6} style={{ marginBottom: 14 }} />
            {[1, 2, 3, 4].map(r => (
              <div key={r} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <SkeletonBox w="45%" h={10} />
                  <SkeletonBox w={40} h={10} />
                </div>
                <SkeletonBox h={6} r={99} />
              </div>
            ))}
          </SkeletonPanel>
          <SkeletonPanel>
            <SkeletonBox w={140} h={11} style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '0 4px' }}>
              {[65, 90, 50, 80, 40].map((h, i) => (
                <SkeletonBox key={i} w="18%" h={h} r={4} style={{ alignSelf: 'flex-end' }} />
              ))}
            </div>
          </SkeletonPanel>
        </div>

        {/* Row 4: Edge decay tracker */}
        <SkeletonPanel style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <SkeletonBox w={160} h={11} />
            <SkeletonBox w={120} h={11} />
          </div>
          {[1, 2, 3].map(r => (
            <div key={r} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <SkeletonBox w="25%" h={11} />
              <SkeletonBox w="15%" h={11} />
              <SkeletonBox w="15%" h={11} />
              <SkeletonBox w="15%" h={11} />
              <SkeletonBox w="10%" h={11} />
            </div>
          ))}
        </SkeletonPanel>

        {/* Row 5: Plan adherence | Loss streaks */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <SkeletonPanel>
            <SkeletonBox w={180} h={11} style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, padding: '0 4px', marginBottom: 10 }}>
              {[70, 95, 55, 85].map((h, i) => (
                <SkeletonBox key={i} w="22%" h={h} r={4} style={{ alignSelf: 'flex-end' }} />
              ))}
            </div>
            <SkeletonBox w="60%" h={10} />
          </SkeletonPanel>
          <SkeletonPanel>
            <SkeletonBox w={120} h={11} style={{ marginBottom: 14 }} />
            {[1, 2, 3].map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SkeletonBox w={26} h={26} r={6} />
                  <div>
                    <SkeletonBox w={100} h={11} style={{ marginBottom: 5 }} />
                    <SkeletonBox w={70} h={9} />
                  </div>
                </div>
                <SkeletonBox w={55} h={11} />
              </div>
            ))}
          </SkeletonPanel>
        </div>

      </div>
    </>
  );
}

// ─── shared panel atoms ───────────────────────────────────────────────────────

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--eb-panel)',
      border: '1px solid var(--eb-border)',
      borderRadius: 10,
      padding: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelH3({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
        {children}
      </h3>
      {action}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color?: 'green' | 'purple' | 'yellow' | 'cyan' }) {
  type ChipStyle = { color: string; border: string; bg: string };
  const styleMap: Record<'green' | 'purple' | 'yellow' | 'cyan', ChipStyle> = {
    green:  { color: 'var(--green)',    border: 'rgba(0,214,143,.25)',  bg: 'rgba(0,214,143,.08)' },
    purple: { color: 'var(--eb-purple)', border: 'rgba(139,92,246,.25)', bg: 'rgba(139,92,246,.08)' },
    yellow: { color: 'var(--eb-yellow)', border: 'rgba(245,165,36,.25)', bg: 'rgba(245,165,36,.08)' },
    cyan:   { color: 'var(--eb-cyan)',   border: 'rgba(6,182,212,.25)',  bg: 'rgba(6,182,212,.08)' },
  };
  const s: ChipStyle = color ? styleMap[color] : { color: 'var(--eb-muted-2)', border: 'var(--eb-border)', bg: 'var(--eb-panel-2)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '2px 8px', borderRadius: 99, border: `1px solid ${s.border}`, background: s.bg, color: s.color, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ fontSize: 12, color: 'var(--eb-muted)', padding: '20px 0', textAlign: 'center' }}>{msg}</div>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: Target,    iconBg: 'rgba(139,92,246,.12)', iconColor: 'var(--eb-purple)', title: 'Conviction calibration', desc: 'Are you overconfident at low conviction or underconfident at high? We plot your stated vs realized R per conviction level.' },
  { Icon: BarChart2, iconBg: 'rgba(0,214,143,.12)',  iconColor: 'var(--green)',     title: 'Behavioral × P&L',       desc: '"Sleep < 6h reduces your expectancy by 42%." Surface correlations between your physical/mental state and your edge.' },
  { Icon: Zap,       iconBg: 'rgba(6,182,212,.12)',  iconColor: 'var(--eb-cyan)',   title: 'Tilt detector',           desc: 'Real-time guardrails: cooldowns after losses, revenge re-entry blocks, oversize confirms. Optional auto-pause.' },
  { Icon: Trophy,    iconBg: 'rgba(245,165,36,.12)', iconColor: 'var(--eb-yellow)', title: 'Discipline score',        desc: 'Daily 0–100 from rule adherence + journal completion + risk discipline. Process over outcomes.' },
];

function EmptyState() {
  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
      <div style={{ textAlign: 'center', padding: '42px 24px 32px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, background: 'linear-gradient(135deg,rgba(139,92,246,.15),rgba(6,182,212,.10))', border: '1px solid rgba(139,92,246,.25)', color: 'var(--eb-purple)' }}>
          <Brain size={36} />
        </div>
        <h2 style={{ fontSize: 24, letterSpacing: '-.015em', margin: '0 0 8px', fontWeight: 600, color: 'var(--eb-text)' }}>
          Find what makes you tilt — before the tape does
        </h2>
        <p style={{ color: 'var(--eb-muted-2)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.55 }}>
          Mind Lab tracks your conviction calibration, mood × P&amp;L correlations, rule adherence, and discipline score. Most journals tell you what happened. We tell you why.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00d68f,#00b67a)', color: '#06140f', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            <NotebookPen size={13} /> Start your daily journal
          </Link>
          <Link href="/goals" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)', color: 'var(--eb-text)', fontSize: 12, textDecoration: 'none' }}>
            <Scale size={13} /> Review tilt rules
          </Link>
          <Link href="/settings/connections" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid transparent', background: 'transparent', color: 'var(--eb-muted)', fontSize: 12, textDecoration: 'none' }}>
            <Plug size={13} /> Connect exchange
          </Link>
        </div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', margin: '24px 0 10px', textAlign: 'center' }}>What you&apos;ll unlock</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {FEATURES.map(({ Icon, iconBg, iconColor, title, desc }) => (
          <div key={title} style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, background: iconBg, color: iconColor }}><Icon size={16} /></div>
            <h4 style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>{title}</h4>
            <p style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--eb-border)', margin: '18px 0' }} />

      <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18, alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>Start with the daily journal</h4>
          <p style={{ color: 'var(--eb-muted-2)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.55 }}>
            Even with zero trades imported, journaling builds the behavioral data Mind Lab needs. It takes 60 seconds before market open.
          </p>
          <Link href="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00d68f,#00b67a)', color: '#06140f', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            <NotebookPen size={13} /> Open today&apos;s journal
          </Link>
        </div>
        <div style={{ background: 'var(--eb-panel-2)', border: '1px dashed var(--eb-border)', borderRadius: 10, padding: 14, fontSize: 12.5, lineHeight: 1.55, color: 'var(--eb-muted-2)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Sample insight (with data)</div>
          Your win rate drops <strong style={{ color: 'var(--eb-red, #ff5b6c)' }}>18%</strong> on revenge trades opened within 60s of a stop-out. Estimated recovery: <strong style={{ color: 'var(--green)' }}>+5.4R / 90 days</strong> with a 5-min lockout rule.
        </div>
      </div>
    </div>
  );
}

// ─── Behavioral × P&L table ───────────────────────────────────────────────────

interface BehavRow { label: string; value: string; pct: number; positive: boolean; dim?: boolean }

function BehavTable({ rows }: { rows: BehavRow[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} style={{ opacity: r.dim ? 0.4 : 1 }}>
            <td style={{ padding: '8px 10px 8px 0', borderBottom: '1px solid var(--eb-border)', color: 'var(--eb-text)', width: '40%' }}>{r.label}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--eb-border)', color: r.positive ? 'var(--green)' : 'var(--eb-red, #ff5b6c)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, width: '30%', whiteSpace: 'nowrap' }}>{r.value}</td>
            <td style={{ padding: '8px 0 8px 0', borderBottom: '1px solid var(--eb-border)', width: '30%' }}>
              <div style={{ width: '100%', height: 6, background: 'var(--eb-panel-2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.pct}%`, borderRadius: 99, background: r.positive ? 'linear-gradient(90deg,var(--green),var(--eb-cyan))' : 'linear-gradient(90deg,var(--eb-yellow, #f5a524),var(--eb-red, #ff5b6c))' }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Conviction calibration chart ─────────────────────────────────────────────

interface ConvBar { level: string; conviction: number; avgPnl: number | null; count: number }

function ConvChart({ data, insight }: { data: ConvBar[]; insight: string | null }) {
  const hasAny = data.some(d => d.count >= 1);
  if (!hasAny) return <Empty msg="Tag conviction on journal entries to unlock calibration" />;
  return (
    <div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={26} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--eb-border)" strokeOpacity={0.5} />
            <XAxis dataKey="level" tick={{ fontSize: 10, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}$${v.toFixed(0)}`} />
            <ReferenceLine y={0} stroke="var(--eb-border)" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as ConvBar;
                return (
                  <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ color: 'var(--eb-muted)', marginBottom: 2 }}>{CONV_LABELS[d.conviction]} conviction</div>
                    <div style={{ fontWeight: 600 }}>{d.avgPnl !== null ? `Avg ${fmtMoney(d.avgPnl)} / day` : 'No data'}</div>
                    <div style={{ fontSize: 10, color: 'var(--eb-muted)', marginTop: 2 }}>{d.count} session{d.count !== 1 ? 's' : ''}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="avgPnl" radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.level} fill={d.avgPnl === null || d.count === 0 ? 'var(--eb-panel-2)' : (d.avgPnl ?? 0) >= 0 ? 'rgba(0,214,143,.75)' : 'rgba(255,91,108,.75)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {insight && (
        <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 8, lineHeight: 1.55 }}
          dangerouslySetInnerHTML={{ __html: insight }}
        />
      )}
    </div>
  );
}

// ─── Daily intent panel ───────────────────────────────────────────────────────

function DailyIntentPanel({ entry }: {
  entry: {
    bias?: string | null | undefined;
    intentMd?: string | null | undefined;
    riskCap?: string | number | null | undefined;
    maxTrades?: number | null | undefined;
    eodMd?: string | null | undefined;
    finalizedAt?: string | null | undefined;
    sessionNotesMd?: string | null | undefined;
  } | null | undefined
}) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  if (!entry) {
    return (
      <>
        <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginBottom: 12 }}>No entry for today · {today}</div>
        <Link href="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 7, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00d68f,#00b67a)', color: '#06140f', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          <NotebookPen size={13} /> Write today&apos;s journal
        </Link>
      </>
    );
  }

  const lockedAt = entry.finalizedAt
    ? `Pre-market journal · locked at ${new Date(entry.finalizedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC`
    : `Pre-market journal · ${today}`;

  const riskCapStr = entry.riskCap != null ? String(entry.riskCap) : null;

  return (
    <>
      <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginBottom: 8 }}>{lockedAt}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--eb-text)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {entry.bias && <div><b>Bias:</b> {entry.bias}</div>}
        {entry.intentMd && <div><b>Plan:</b> {entry.intentMd}</div>}
        {(riskCapStr || entry.maxTrades != null) && (
          <div>
            <b>Max risk today:</b>{' '}
            {riskCapStr && <span>{riskCapStr}% account</span>}
            {riskCapStr && entry.maxTrades != null && <span> · </span>}
            {entry.maxTrades != null && <span>{entry.maxTrades} trades</span>}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--eb-border)', margin: '14px 0' }} />
      <h3 style={{ margin: '0 0 6px', fontSize: 12.5, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase' }}>End-of-day review</h3>
      {entry.eodMd ? (
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--eb-text)' }}>{entry.eodMd}</div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--eb-muted)' }}>Available after session close</div>
      )}
    </>
  );
}

// ─── Tilt rules panel ─────────────────────────────────────────────────────────

const DEFAULT_RULES = [
  '3 consecutive losses → 30m cooldown',
  'Re-entry < 60s after stop → block',
  'Size > 2× 30T avg → confirm dialog',
  'No-trade: news ±15m',
];

function TiltRulesPanel() {
  return (
    <>
      {DEFAULT_RULES.map((rule) => (
        <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px dashed var(--eb-border)', fontSize: 12.5 }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--green)', background: 'rgba(0,214,143,.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', fontSize: 11, flexShrink: 0 }}>✓</span>
          <span style={{ color: 'var(--eb-text)' }}>{rule}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', fontSize: 12.5 }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--eb-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--eb-muted)', fontSize: 11, flexShrink: 0 }}><Plus size={9} /></span>
        <Link href="/goals" style={{ color: 'var(--eb-muted)', textDecoration: 'none', fontSize: 12 }}>Manage rules…</Link>
      </div>

      <div style={{ borderTop: '1px solid var(--eb-border)', marginTop: 10, paddingTop: 10 }}>
        <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginBottom: 6 }}>Triggered today</div>
        <div style={{ fontSize: 12, color: 'var(--eb-muted)', fontStyle: 'italic' }}>No triggers recorded</div>
      </div>
    </>
  );
}

// ─── Session quality score ─────────────────────────────────────────────────────

interface DisciplineBreakdown {
  score: number;
  planAdherence: { score: number; delta: number };
  ruleViolations: { score: number; delta: number };
  journalCompletion: { score: number; delta: number };
  riskDiscipline: { score: number; delta: number };
}

function SessionQualityPanel({ breakdown }: { breakdown: DisciplineBreakdown | undefined }) {
  if (!breakdown) return <Empty msg="Complete journal entries to unlock quality tracking" />;

  const rows = [
    { label: 'Plan adherence',    ...breakdown.planAdherence },
    { label: 'Rule violations',   ...breakdown.ruleViolations },
    { label: 'Journal completion',...breakdown.journalCompletion },
    { label: 'Risk discipline',   ...breakdown.riskDiscipline },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>{breakdown.score}</span>
        <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>/ 100 overall</span>
      </div>
      {rows.map(({ label, score, delta }) => {
        const barColor = score >= 70
          ? 'linear-gradient(90deg,var(--green),var(--eb-cyan))'
          : score >= 40
            ? 'rgba(245,165,36,.85)'
            : 'rgba(255,91,108,.85)';
        return (
          <div key={label} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--eb-text)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                <span style={{ color: 'var(--eb-text)', fontWeight: 600 }}>{score}</span>
                <span style={{ color: delta >= 0 ? 'var(--green)' : 'var(--eb-red, #ff5b6c)', fontSize: 10.5, marginLeft: 4 }}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(0)}
                </span>
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--eb-panel-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${score}%`, background: barColor, borderRadius: 99, transition: 'width .4s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day-of-week P&L chart ─────────────────────────────────────────────────────

interface DowBar { day: string; avgPnl: number; count: number }

function DowChart({ data }: { data: DowBar[] }) {
  if (!data.some(d => d.count > 0)) return <Empty msg="Need more closed trades to show day-of-week patterns" />;
  return (
    <div style={{ height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28} margin={{ top: 6, right: 0, left: -28, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--eb-border)" strokeOpacity={0.5} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
          <ReferenceLine y={0} stroke="var(--eb-border)" strokeWidth={1} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as DowBar;
              return (
                <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: 'var(--eb-muted)', marginBottom: 2 }}>{d.day}</div>
                  <div style={{ fontWeight: 600 }}>{d.count > 0 ? `Avg ${fmtMoney(d.avgPnl)}` : 'No data'}</div>
                  <div style={{ fontSize: 10, color: 'var(--eb-muted)', marginTop: 2 }}>{d.count} session{d.count !== 1 ? 's' : ''}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="avgPnl" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.day} fill={d.count === 0 ? 'transparent' : d.avgPnl >= 0 ? 'rgba(0,214,143,.75)' : 'rgba(255,91,108,.75)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Edge decay tracker ────────────────────────────────────────────────────────

interface EdgeRow {
  name: string;
  id: string;
  allTimePf: number;
  recentPf: number | null;
  allTimeTrades: number;
  recentTrades: number;
}

function EdgeDecayPanel({ rows }: { rows: EdgeRow[] }) {
  if (rows.length === 0) return <Empty msg="Tag positions with a playbook to track edge decay" />;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <thead>
        <tr>
          {(['Playbook', 'All-time PF', 'Recent 4W PF', 'Trades', 'Status'] as const).map(h => (
            <th key={h} style={{ padding: '0 0 8px', textAlign: h === 'Playbook' ? 'left' : 'right', fontSize: 10.5, fontWeight: 600, color: 'var(--eb-muted)', letterSpacing: '.04em', textTransform: 'uppercase', borderBottom: '1px solid var(--eb-border)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const decay = r.recentPf !== null && r.allTimePf > 0
            ? (r.recentPf - r.allTimePf) / r.allTimePf
            : null;
          const status = r.recentTrades < 3
            ? { label: 'Low data', color: 'var(--eb-muted)' }
            : decay === null
              ? { label: 'No recent', color: 'var(--eb-muted)' }
              : decay > 0.1
                ? { label: 'Improving', color: 'var(--green)' }
                : decay > -0.2
                  ? { label: 'Stable', color: 'var(--eb-cyan)' }
                  : decay > -0.4
                    ? { label: 'Watch', color: 'var(--eb-yellow)' }
                    : { label: 'Decaying', color: 'var(--eb-red, #ff5b6c)' };

          return (
            <tr key={r.id}>
              <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid var(--eb-border)', color: 'var(--eb-text)', fontWeight: 500 }}>{r.name}</td>
              <td style={{ padding: '9px 0', borderBottom: '1px solid var(--eb-border)', color: 'var(--eb-muted-2)', fontFamily: 'var(--font-mono, monospace)', textAlign: 'right' }}>{r.allTimePf.toFixed(2)}x</td>
              <td style={{ padding: '9px 0 9px 12px', borderBottom: '1px solid var(--eb-border)', fontFamily: 'var(--font-mono, monospace)', textAlign: 'right', color: r.recentPf !== null ? (r.recentPf >= r.allTimePf ? 'var(--green)' : 'var(--eb-red, #ff5b6c)') : 'var(--eb-muted)' }}>
                {r.recentPf !== null ? `${r.recentPf.toFixed(2)}x` : '—'}
              </td>
              <td style={{ padding: '9px 0 9px 12px', borderBottom: '1px solid var(--eb-border)', color: 'var(--eb-muted)', textAlign: 'right', fontSize: 11.5 }}>{r.allTimeTrades} / {r.recentTrades}</td>
              <td style={{ padding: '9px 0 9px 12px', borderBottom: '1px solid var(--eb-border)', textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: status.color }}>{status.label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Plan adherence × R-multiple ──────────────────────────────────────────────

interface AdherenceBar { bucket: string; avgR: number; count: number }

function AdherenceChart({ data }: { data: AdherenceBar[] }) {
  if (!data.some(d => d.count > 0)) return <Empty msg="Set plan adherence on trades to unlock this chart" />;
  return (
    <div style={{ height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={32} margin={{ top: 6, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--eb-border)" strokeOpacity={0.5} />
          <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}R`} />
          <ReferenceLine y={0} stroke="var(--eb-border)" strokeWidth={1} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,.04)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as AdherenceBar;
              return (
                <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: 'var(--eb-muted)', marginBottom: 2 }}>Adherence {d.bucket}</div>
                  <div style={{ fontWeight: 600 }}>{d.count > 0 ? `Avg ${d.avgR >= 0 ? '+' : ''}${d.avgR.toFixed(2)}R` : 'No data'}</div>
                  <div style={{ fontSize: 10, color: 'var(--eb-muted)', marginTop: 2 }}>{d.count} trade{d.count !== 1 ? 's' : ''}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="avgR" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.bucket} fill={d.count === 0 ? 'transparent' : d.avgR >= 0 ? 'rgba(0,214,143,.75)' : 'rgba(255,91,108,.75)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Loss streak history ───────────────────────────────────────────────────────

interface LossStreak { start: string; end: string; length: number; totalLoss: number }

function LossStreakPanel({ streaks }: { streaks: LossStreak[] }) {
  if (streaks.length === 0) {
    return <Empty msg="No consecutive loss streaks detected — keep it up" />;
  }
  return (
    <div>
      {streaks.map((s, i) => (
        <div key={`${s.start}-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--eb-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,91,108,.12)', border: '1px solid rgba(255,91,108,.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingDown size={13} style={{ color: 'var(--eb-red, #ff5b6c)' }} />
            </span>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--eb-text)', fontWeight: 500 }}>{s.length}-loss streak</div>
              <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{s.start}{s.start !== s.end ? ` → ${s.end}` : ''}</div>
            </div>
          </div>
          <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--eb-red, #ff5b6c)' }}>{fmtMoney(s.totalLoss)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MindLabClient() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();

  const positionQueries = useQueries({
    queries: (accounts ?? []).map((a) => ({
      queryKey: ['positions', a.id],
      queryFn: () => positionsApi.list(a.id),
      staleTime: 60_000,
    })),
  });

  const { data: journalStats } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: () => journalApi.getStats(),
    staleTime: 60_000,
  });

  const { data: recentEntries } = useQuery({
    queryKey: ['journal-recent'],
    queryFn: () => journalApi.listRecent(),
    staleTime: 60_000,
  });

  const { data: playbooks } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => playbooksApi.list(),
    staleTime: 120_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayEntry } = useQuery({
    queryKey: ['journal-entry', today],
    queryFn: () => journalApi.getEntry(today),
    staleTime: 30_000,
  });

  const allPositions = useMemo(
    () => positionQueries.flatMap((q) => q.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionQueries.map((q) => q.dataUpdatedAt).join(',')],
  );

  const isLoading = loadingAccounts || positionQueries.some((q) => q.isLoading);

  if (isLoading) return <MindLabSkeleton />;

  const closedPositions = allPositions.filter((p) => p.status === 'closed');
  const hasData = closedPositions.length > 0 || (recentEntries?.length ?? 0) > 0;

  if (!hasData) return <EmptyState />;

  // ── Day P&L map (by close date) ──────────────────────────────────────────
  const dayPnl = new Map<string, number>();
  for (const p of closedPositions) {
    if (!p.closedAt) continue;
    const key = fmtDayKey(new Date(p.closedAt));
    dayPnl.set(key, (dayPnl.get(key) ?? 0) + parsePnl(p.netPnl));
  }

  // ── Behavioral rows ──────────────────────────────────────────────────────
  const behavRows: BehavRow[] = [];
  const entries = recentEntries ?? [];
  const entriesWithPnl = entries
    .map((e) => ({ ...e, pnl: dayPnl.get(e.date) ?? null }))
    .filter((e) => e.pnl !== null) as (typeof entries[0] & { pnl: number })[];

  const baselineWr = entriesWithPnl.length > 0
    ? entriesWithPnl.filter(e => e.pnl > 0).length / entriesWithPnl.length * 100
    : 50;

  const sleepLow = entriesWithPnl.filter(e => e.sleepHours != null && Number(e.sleepHours) < 6);
  const sleepOk  = entriesWithPnl.filter(e => e.sleepHours != null && Number(e.sleepHours) >= 6);
  if (sleepLow.length >= 2 && sleepOk.length >= 2) {
    const diff = sleepLow.filter(e => e.pnl > 0).length / sleepLow.length * 100
               - sleepOk.filter(e => e.pnl > 0).length / sleepOk.length * 100;
    behavRows.push({ label: 'Sleep < 6h', value: `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}% win rate`, pct: Math.min(Math.abs(diff), 100), positive: diff >= 0 });
  } else {
    behavRows.push({ label: 'Sleep < 6h', value: 'Insufficient data', pct: 0, positive: false, dim: true });
  }

  const journaled    = entriesWithPnl.filter(e => e.finalizedAt != null);
  const notJournaled = entriesWithPnl.filter(e => e.finalizedAt == null);
  if (journaled.length >= 2 && notJournaled.length >= 2) {
    const diff = journaled.filter(e => e.pnl > 0).length / journaled.length * 100
               - notJournaled.filter(e => e.pnl > 0).length / notJournaled.length * 100;
    behavRows.push({ label: 'Journal completed', value: `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}% win rate`, pct: Math.min(Math.abs(diff), 100), positive: diff >= 0 });
  } else {
    behavRows.push({ label: 'Journal completed', value: 'Insufficient data', pct: 0, positive: true, dim: true });
  }

  const convHigh  = entriesWithPnl.filter(e => e.conviction != null && e.conviction >= 4);
  const convOther = entriesWithPnl.filter(e => e.conviction != null && e.conviction < 4);
  if (convHigh.length >= 2 && convOther.length >= 2) {
    const diff = convHigh.filter(e => e.pnl > 0).length / convHigh.length * 100 - baselineWr;
    behavRows.push({ label: 'High conviction (4–5)', value: `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}% win rate`, pct: Math.min(Math.abs(diff), 100), positive: diff >= 0 });
  } else {
    behavRows.push({ label: 'High conviction (4–5)', value: 'Insufficient data', pct: 0, positive: true, dim: true });
  }

  const moodMap = new Map<string, number[]>();
  for (const e of entriesWithPnl) {
    const moods: string[] = Array.isArray(e.moodTagsJson) ? (e.moodTagsJson as string[]) : [];
    for (const m of moods) {
      if (!moodMap.has(m)) moodMap.set(m, []);
      moodMap.get(m)!.push(e.pnl);
    }
  }
  [...moodMap.entries()]
    .filter(([, arr]) => arr.length >= 2)
    .map(([mood, arr]) => ({ label: `Mood: ${mood}`, diff: arr.filter(v => v > 0).length / arr.length * 100 - baselineWr }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 2)
    .forEach(r => behavRows.push({ label: r.label, value: `${r.diff >= 0 ? '+' : ''}${r.diff.toFixed(0)}% win rate`, pct: Math.min(Math.abs(r.diff), 100), positive: r.diff >= 0 }));

  // ── Conviction calibration ───────────────────────────────────────────────
  const convGroups: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const e of entries) {
    const pnl = dayPnl.get(e.date);
    if (pnl === undefined || !e.conviction) continue;
    const c = Math.min(5, Math.max(1, Math.round(e.conviction)));
    convGroups[c]!.push(pnl);
  }
  const convData: ConvBar[] = [1, 2, 3, 4, 5].map((c) => ({
    level: `C${c}`,
    conviction: c,
    avgPnl: convGroups[c]!.length > 0 ? avg(convGroups[c]!) : null,
    count: convGroups[c]!.length,
  }));

  const convInsight = (() => {
    const withData = convData.filter(d => d.count >= 2 && d.avgPnl !== null);
    if (withData.length < 2) return null;
    const best  = withData.reduce((a, b) => ((a.avgPnl ?? Number.NEGATIVE_INFINITY) > (b.avgPnl ?? Number.NEGATIVE_INFINITY) ? a : b));
    const worst = withData.reduce((a, b) => ((a.avgPnl ?? Number.POSITIVE_INFINITY) < (b.avgPnl ?? Number.POSITIVE_INFINITY) ? a : b));
    if (best.conviction >= worst.conviction) {
      return `You're <b style="color:var(--green)">well-calibrated</b> at conviction ${best.conviction} (avg ${fmtMoney(best.avgPnl ?? 0)}/day).`;
    }
    return `You're <b style="color:var(--eb-red,#ff5b6c)">overconfident</b> — lower conviction trades outperform higher ones. Review your sizing at C${worst.conviction}.`;
  })();

  // ── Day-of-week chart ─────────────────────────────────────────────────────
  const dowBuckets: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const p of closedPositions) {
    if (!p.closedAt) continue;
    const d = new Date(p.closedAt).getDay();
    if (d >= 1 && d <= 5) dowBuckets[d]!.push(parsePnl(p.netPnl));
  }
  const dowData: DowBar[] = [1, 2, 3, 4, 5].map(d => ({
    day: DOW_NAMES[d] ?? '',
    avgPnl: dowBuckets[d]!.length > 0 ? avg(dowBuckets[d]!) : 0,
    count: dowBuckets[d]!.length,
  }));

  // ── Edge decay rows ───────────────────────────────────────────────────────
  const playbookMap = new Map((playbooks ?? []).map(pb => [pb.id, pb.name]));
  const cutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const pbPnl = new Map<string, number[]>();
  const pbPnlRecent = new Map<string, number[]>();
  for (const p of closedPositions) {
    if (!p.playbookId || !p.closedAt) continue;
    const pnl = parsePnl(p.netPnl);
    if (!pbPnl.has(p.playbookId)) { pbPnl.set(p.playbookId, []); pbPnlRecent.set(p.playbookId, []); }
    pbPnl.get(p.playbookId)!.push(pnl);
    if (new Date(p.closedAt) >= cutoff) pbPnlRecent.get(p.playbookId)!.push(pnl);
  }

  const edgeRows: EdgeRow[] = [...pbPnl.entries()]
    .filter(([, arr]) => arr.length >= 3)
    .map(([id, arr]) => {
      const recent = pbPnlRecent.get(id) ?? [];
      return {
        id,
        name: playbookMap.get(id) ?? id.slice(0, 8),
        allTimePf: profitFactor(arr),
        recentPf: recent.length >= 2 ? profitFactor(recent) : null,
        allTimeTrades: arr.length,
        recentTrades: recent.length,
      };
    })
    .sort((a, b) => b.allTimeTrades - a.allTimeTrades);

  // ── Plan adherence × R-multiple ───────────────────────────────────────────
  const adherenceBuckets: Record<string, number[]> = { '0–25': [], '25–50': [], '50–75': [], '75–100': [] };
  for (const p of closedPositions) {
    if (!p.planAdherence || !p.rRealized) continue;
    const pa = parseNum(p.planAdherence);
    const r  = parseNum(p.rRealized);
    const bucket = pa < 25 ? '0–25' : pa < 50 ? '25–50' : pa < 75 ? '50–75' : '75–100';
    adherenceBuckets[bucket]!.push(r);
  }
  const adherenceData: AdherenceBar[] = Object.entries(adherenceBuckets).map(([bucket, arr]) => ({
    bucket,
    avgR: arr.length > 0 ? avg(arr) : 0,
    count: arr.length,
  }));

  // ── Loss streaks ──────────────────────────────────────────────────────────
  const sorted = [...closedPositions]
    .filter(p => p.closedAt)
    .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime());

  const lossStreaks: LossStreak[] = [];
  let i = 0;
  while (i < sorted.length) {
    if (parsePnl(sorted[i]?.netPnl) < 0) {
      let j = i;
      let total = 0;
      while (j < sorted.length && parsePnl(sorted[j]?.netPnl) < 0) {
        total += parsePnl(sorted[j]!.netPnl);
        j++;
      }
      if (j - i >= 2) {
        const startDate = new Date(sorted[i]!.closedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const endDate   = new Date(sorted[j - 1]!.closedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        lossStreaks.push({ start: startDate, end: endDate, length: j - i, totalLoss: total });
      }
      i = j;
    } else {
      i++;
    }
  }
  const recentStreaks = lossStreaks.slice(-5).reverse();

  // ── Discipline ────────────────────────────────────────────────────────────
  const discipline = journalStats?.discipline;
  const discScore  = discipline?.score ?? null;
  const streak     = journalStats?.streak ?? 0;

  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>

      {/* breadcrumb */}
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>Workspace / Mind Lab</div>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>🧠 Mind Lab</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {discScore != null && <Chip color="purple">Discipline {discScore}</Chip>}
          {streak > 0 && <Chip color="green">Streak {streak} {streak === 1 ? 'day' : 'days'}</Chip>}
        </div>
      </div>

      {/* ── Row 1: Behavioral | Conviction ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Panel>
          <PanelH3>Behavioral × P&amp;L correlations</PanelH3>
          <BehavTable rows={behavRows} />
        </Panel>
        <Panel>
          <PanelH3>Conviction calibration</PanelH3>
          <ConvChart data={convData} insight={convInsight} />
        </Panel>
      </div>

      {/* ── Row 2: Daily intent | Tilt rules ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <Panel>
          <PanelH3>Daily intent · today</PanelH3>
          <DailyIntentPanel entry={todayEntry} />
        </Panel>
        <Panel>
          <PanelH3>Tilt rules</PanelH3>
          <TiltRulesPanel />
        </Panel>
      </div>

      {/* ── Row 3: Session quality | Day-of-week P&L ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Panel>
          <PanelH3>Session quality score</PanelH3>
          <SessionQualityPanel breakdown={discipline} />
        </Panel>
        <Panel>
          <PanelH3>P&amp;L by day of week</PanelH3>
          <DowChart data={dowData} />
        </Panel>
      </div>

      {/* ── Row 4: Edge decay tracker ── */}
      <Panel style={{ marginBottom: 14 }}>
        <PanelH3
          action={<span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>All-time vs last 28 days · {edgeRows.length} playbook{edgeRows.length !== 1 ? 's' : ''}</span>}
        >
          Edge decay tracker
        </PanelH3>
        <EdgeDecayPanel rows={edgeRows} />
      </Panel>

      {/* ── Row 5: Plan adherence × R | Loss streaks ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <Panel>
          <PanelH3>Plan adherence × R-multiple</PanelH3>
          <AdherenceChart data={adherenceData} />
          <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 8 }}>
            Avg realized R grouped by how closely you followed your plan (0–100%).
          </div>
        </Panel>
        <Panel>
          <PanelH3>Recent loss streaks</PanelH3>
          <LossStreakPanel streaks={recentStreaks} />
        </Panel>
      </div>

    </div>
  );
}
