import type { ArchiveItemType } from '@edgebook/shared';
import { BookOpen, Eye, NotebookPen, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TypeMeta = {
  label: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
};

export const TYPE_META: Record<ArchiveItemType, TypeMeta> = {
  watchlist: {
    label: 'Watchlist',
    Icon: Eye,
    color: 'var(--eb-yellow)',
    bg: 'rgba(245,165,36,.14)',
    border: 'rgba(245,165,36,.25)',
  },
  notes: {
    label: 'Notes',
    Icon: BookOpen,
    color: 'var(--eb-cyan)',
    bg: 'rgba(6,182,212,.14)',
    border: 'rgba(6,182,212,.25)',
  },
  playbook: {
    label: 'Playbooks',
    Icon: Target,
    color: 'var(--eb-purple)',
    bg: 'rgba(139,92,246,.14)',
    border: 'rgba(139,92,246,.25)',
  },
  journal: {
    label: 'Journal',
    Icon: NotebookPen,
    color: 'var(--green)',
    bg: 'rgba(0,214,143,.14)',
    border: 'rgba(0,214,143,.25)',
  },
};

export type Urgency = 'safe' | 'warn' | 'urgent';

export function daysRemaining(removedAt: string, retentionDays: number): number {
  const expiresAt = new Date(removedAt).getTime() + retentionDays * 86_400_000;
  return (expiresAt - Date.now()) / 86_400_000;
}

export function urgencyOf(daysLeft: number): Urgency {
  if (daysLeft < 5) return 'urgent';
  if (daysLeft < 15) return 'warn';
  return 'safe';
}

export function fmtCountdown(daysLeft: number): string {
  const clamped = Math.max(daysLeft, 0);
  const d = Math.floor(clamped);
  const h = Math.floor((clamped - d) * 24);
  return `${d}d ${h}h`;
}

export function daysAgoLabel(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d <= 0) return 'today';
  if (d === 1) return '1d ago';
  return `${d}d ago`;
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
