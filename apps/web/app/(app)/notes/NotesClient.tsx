'use client';

import { type LibraryNote, useCreateNote, useDeleteNote, useMoveNote, useNotes, usePinNote, useUpdateNote } from '@/features/notes';
import { usePlaybooks } from '@/features/playbooks';
import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  AlertTriangle,
  Archive,
  ArrowLeft,
  BarChart2,
  Bookmark,
  BookOpen,
  Brain,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  DollarSign,
  Eye,
  FileText,
  Flag,
  FlaskConical,
  Folders,
  Globe,
  Image as ImageIcon,
  Info,
  Layers,
  Library,
  Lightbulb,
  Link2,
  List,
  type LucideIcon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Percent,
  Pin,
  PinOff,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Table,
  Tag,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Folder = { id: string; Icon: LucideIcon; iconColor: string; label: string; count: number };
type CreateNoteInput = { folderId: string; name: string; iconId: string };

const PAGE_SIZE = 9;

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUICK_FOLDERS: Folder[] = [
  { id: 'pinned', Icon: Star, iconColor: 'var(--yellow, #f5a524)', label: 'Pinned', count: 0 },
  { id: 'recent', Icon: Clock, iconColor: 'var(--eb-muted)', label: 'Recent', count: 0 },
];

const FOLDERS: Folder[] = [
  { id: 'learning', Icon: BookOpen, iconColor: 'var(--green)', label: 'Learning', count: 0 },
  { id: 'setups', Icon: Target, iconColor: 'var(--green)', label: 'Setups to research', count: 0 },
  {
    id: 'lessons',
    Icon: Lightbulb,
    iconColor: 'var(--yellow, #f5a524)',
    label: 'Lessons learned',
    count: 0,
  },
  {
    id: 'market',
    Icon: TrendingUp,
    iconColor: 'var(--cyan, #06b6d4)',
    label: 'Market notes',
    count: 0,
  },
  {
    id: 'psychology',
    Icon: Brain,
    iconColor: 'var(--purple, #8b5cf6)',
    label: 'Psychology',
    count: 0,
  },
  {
    id: 'backtests',
    Icon: FlaskConical,
    iconColor: 'var(--cyan, #06b6d4)',
    label: 'Backtests',
    count: 0,
  },
  { id: 'archive', Icon: Archive, iconColor: 'var(--eb-muted)', label: 'Archive', count: 0 },
];

const USE_CASES: {
  Icon: LucideIcon;
  color: string;
  iconColor: string;
  title: string;
  desc: string;
}[] = [
  {
    Icon: BookOpen,
    color: 'rgba(0,214,143,.12)',
    iconColor: 'var(--green)',
    title: 'Research a setup',
    desc: 'Document the criteria, examples, and edge of a trading pattern. Backtest it against your real trades. Promote it into a playbook when ready.',
  },
  {
    Icon: Lightbulb,
    color: 'rgba(245,165,36,.12)',
    iconColor: 'var(--yellow, #f5a524)',
    title: 'Capture a lesson from a loss',
    desc: "Write what went wrong, link the trade, tag the behavior. Future-you will read it before your next session — or AI will surface it when you're about to repeat the pattern.",
  },
  {
    Icon: TrendingUp,
    color: 'rgba(6,182,212,.12)',
    iconColor: 'var(--cyan, #06b6d4)',
    title: 'Track a market thesis',
    desc: 'Macro regime, narrative shifts, funding cycles. Update over time. Pin to the dashboard.',
  },
  {
    Icon: Target,
    color: 'rgba(139,92,246,.12)',
    iconColor: 'var(--purple, #8b5cf6)',
    title: 'Build a playbook from observations',
    desc: 'Start with raw notes, refine with examples, generate a structured playbook when the pattern is clear.',
  },
];

const NOTE_ICONS: { id: string; Icon: LucideIcon; bg: string; fg: string }[] = [
  { id: 'file',      Icon: FileText,      bg: 'rgba(100,149,237,.15)', fg: '#6495ed' },
  { id: 'lightbulb', Icon: Lightbulb,     bg: 'rgba(245,165,36,.15)',  fg: '#f5a524' },
  { id: 'book',      Icon: BookOpen,      bg: 'rgba(0,214,143,.15)',   fg: '#00d68f' },
  { id: 'target',    Icon: Target,        bg: 'rgba(0,214,143,.15)',   fg: '#00d68f' },
  { id: 'trend',     Icon: TrendingUp,    bg: 'rgba(6,182,212,.15)',   fg: '#06b6d4' },
  { id: 'brain',     Icon: Brain,         bg: 'rgba(139,92,246,.15)',  fg: '#8b5cf6' },
  { id: 'flask',     Icon: FlaskConical,  bg: 'rgba(6,182,212,.15)',   fg: '#06b6d4' },
  { id: 'star',      Icon: Star,          bg: 'rgba(245,165,36,.15)',  fg: '#f5a524' },
  { id: 'zap',       Icon: Zap,           bg: 'rgba(248,113,113,.15)', fg: '#f87171' },
  { id: 'eye',       Icon: Eye,           bg: 'rgba(100,149,237,.15)', fg: '#6495ed' },
  { id: 'alert',     Icon: AlertTriangle, bg: 'rgba(248,113,113,.15)', fg: '#f87171' },
  { id: 'chart',     Icon: BarChart2,     bg: 'rgba(0,214,143,.15)',   fg: '#00d68f' },
  { id: 'bookmark',  Icon: Bookmark,      bg: 'rgba(139,92,246,.15)',  fg: '#8b5cf6' },
  { id: 'flag',      Icon: Flag,          bg: 'rgba(248,113,113,.15)', fg: '#f87171' },
  { id: 'dollar',    Icon: DollarSign,    bg: 'rgba(0,214,143,.15)',   fg: '#00d68f' },
  { id: 'percent',   Icon: Percent,       bg: 'rgba(6,182,212,.15)',   fg: '#06b6d4' },
  { id: 'globe',     Icon: Globe,         bg: 'rgba(6,182,212,.15)',   fg: '#06b6d4' },
  { id: 'timer',     Icon: Timer,         bg: 'rgba(245,165,36,.15)',  fg: '#f5a524' },
  { id: 'list',      Icon: List,          bg: 'rgba(100,149,237,.15)', fg: '#6495ed' },
  { id: 'layers',    Icon: Layers,        bg: 'rgba(139,92,246,.15)',  fg: '#8b5cf6' },
  { id: 'info',      Icon: Info,          bg: 'rgba(100,149,237,.15)', fg: '#6495ed' },
  { id: 'check',     Icon: CheckSquare,   bg: 'rgba(0,214,143,.15)',   fg: '#00d68f' },
  { id: 'shield',    Icon: Shield,        bg: 'rgba(0,214,143,.15)',   fg: '#00d68f' },
  { id: 'code',      Icon: Code2,         bg: 'rgba(139,92,246,.15)',  fg: '#8b5cf6' },
];

type SlashItem = { id: string; label: string; desc?: string; kbd?: string; Icon?: LucideIcon; iconText?: string };
type SlashGroup = { group: string; items: SlashItem[] };

const SLASH_GROUPS: SlashGroup[] = [
  {
    group: 'Basic',
    items: [
      { id: 'text',   label: 'Text',      desc: 'Plain paragraph',       kbd: '↵',   Icon: AlignLeft },
      { id: 'h1',     label: 'Heading 1', desc: 'Big section header',    kbd: '/h1', iconText: 'H1' },
      { id: 'h2',     label: 'Heading 2', desc: 'Sub-section',           kbd: '/h2', iconText: 'H2' },
      { id: 'bullet', label: 'Bullet list',                                           Icon: List },
      { id: 'todo',   label: 'To-do',     desc: 'Track action items',                Icon: CheckSquare },
    ],
  },
  {
    group: 'Media',
    items: [
      { id: 'image', label: 'Image',        desc: 'Upload, paste, or drop', Icon: ImageIcon },
      { id: 'link',  label: 'Link preview', desc: 'Embed an article or video', Icon: Link2 },
    ],
  },
  {
    group: 'Format',
    items: [
      { id: 'callout',  label: 'Callout',    desc: 'Tip · warn · info',     Icon: Lightbulb },
      { id: 'code',     label: 'Code block', desc: 'DSL · JSON · SQL · TS', Icon: Code2 },
    ],
  },
];

// ─── Skeleton primitive ───────────────────────────────────────────────────────

function Sk({ w, h, r = 5 }: { w: number | string; h: number; r?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: 'var(--eb-panel-2)',
        backgroundImage:
          'linear-gradient(90deg,var(--eb-panel-2) 25%,var(--eb-border) 50%,var(--eb-panel-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'sk-shimmer 1.4s ease infinite',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FolderRow({
  folder,
  active,
  onClick,
  isLoading,
}: { folder: Folder; active: boolean; onClick: () => void; isLoading?: boolean }) {
  const { Icon } = folder;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        width: '100%',
        padding: '5px 8px',
        borderRadius: 6,
        border: 0,
        background: active ? 'rgba(0,214,143,.10)' : 'transparent',
        boxShadow: active ? 'inset 2px 0 0 var(--green)' : 'none',
        color: active ? 'var(--eb-text)' : 'var(--eb-muted-2)',
        cursor: 'pointer',
        fontSize: 12.5,
        fontFamily: 'inherit',
        textAlign: 'left',
        transition: 'background .1s, color .1s',
      }}
    >
      <Icon size={12} style={{ color: folder.iconColor, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{folder.label}</span>
      {isLoading ? (
        <Sk w={18} h={10} r={4} />
      ) : (
        <span
          style={{
            fontSize: 10,
            color: folder.count === 0 ? 'rgba(122,131,149,.4)' : 'var(--eb-muted)',
          }}
        >
          {folder.count}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 8px 4px',
        fontSize: 10,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: 'var(--eb-muted)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {children}
    </div>
  );
}

function MicroEmpty({
  icon,
  text,
  cta,
}: {
  icon: React.ReactNode;
  text: string;
  cta?: { label: string; Icon?: LucideIcon };
}) {
  return (
    <div
      style={{
        padding: '14px 12px',
        border: '1px dashed var(--eb-border)',
        borderRadius: 9,
        textAlign: 'center',
        fontSize: 11.5,
        color: 'var(--eb-muted)',
        lineHeight: 1.55,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, opacity: 0.6 }}>
        {icon}
      </div>
      {text}
      {cta && (
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted-2)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {cta.Icon && <cta.Icon size={11} />}
            {cta.label}
          </button>
        </div>
      )}
    </div>
  );
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type CtxMenu = { noteId: string; x: number; y: number; isPinned: boolean };

type PendingAction =
  | { kind: 'delete'; noteId: string; noteName: string }
  | { kind: 'move'; noteId: string; noteName: string; folderId: string; folderLabel: string };

function ConfirmDialog({
  action,
  onCancel,
  onConfirm,
}: {
  action: PendingAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const isDelete = action.kind === 'delete';
  const title = isDelete ? 'Delete note?' : 'Move note?';
  const body = isDelete
    ? <>Are you sure you want to delete <strong style={{ color: 'var(--eb-text)' }}>&ldquo;{action.noteName}&rdquo;</strong>? This can&apos;t be undone.</>
    : <>Move <strong style={{ color: 'var(--eb-text)' }}>&ldquo;{action.noteName}&rdquo;</strong> to <strong style={{ color: 'var(--eb-text)' }}>{action.folderLabel}</strong>?</>;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.50)', zIndex: 60 }}
        onClick={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        role="button"
        tabIndex={-1}
        aria-label="Cancel"
      />
      <dialog
        open
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 61,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: '22px 24px',
          width: 380,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,.55)',
          display: 'flex', flexDirection: 'column', gap: 14,
          margin: 0,
        }}
      >
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDelete ? 'rgba(248,113,113,.12)' : 'rgba(0,214,143,.10)',
              border: isDelete ? '1px solid rgba(248,113,113,.3)' : '1px solid rgba(0,214,143,.3)',
            }}
          >
            {isDelete
              ? <Trash2 size={15} style={{ color: '#f87171' }} />
              : <Folders size={15} style={{ color: 'var(--green)' }} />}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--eb-text)' }}>{title}</span>
        </div>

        {/* Body */}
        <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted-2)', lineHeight: 1.6 }}>
          {body}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 2 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer',
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)', color: 'var(--eb-muted-2)', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
              border: isDelete ? '1px solid rgba(248,113,113,.5)' : '1px solid #00b67a',
              background: isDelete
                ? 'linear-gradient(180deg,#f87171,#ef4444)'
                : 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: isDelete ? '#fff' : '#06140f',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isDelete ? 'Delete' : 'Move'}
          </button>
        </div>
      </dialog>
    </>
  );
}

function NoteContextMenu({
  menu,
  onClose,
  onDelete,
  onMove,
  onPin,
}: {
  menu: CtxMenu;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, folderId: string) => void;
  onPin: (id: string, pinned: boolean) => void;
}) {
  const [showMove, setShowMove] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Clamp position so the menu never goes off-screen
  const menuW = 200;
  const menuH = showMove ? 300 : 115;
  const left = Math.min(menu.x, window.innerWidth - menuW - 8);
  const top  = Math.min(menu.y, window.innerHeight - menuH - 8);

  const item: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', fontSize: 12.5, cursor: 'pointer',
    color: 'var(--eb-muted-2)', background: 'transparent',
    border: 0, width: '100%', textAlign: 'left', fontFamily: 'inherit',
    borderRadius: 5,
  };

  return (
    <>
      {/* Transparent backdrop — click anywhere outside to close */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 199 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close menu"
      />

      <div
        style={{
          position: 'fixed', left, top, zIndex: 200,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          padding: '4px',
          minWidth: menuW,
        }}
      >
        {!showMove ? (
          <>
            <button
              type="button"
              style={item}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--eb-panel-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-text)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-muted-2)'; }}
              onClick={() => { onPin(menu.noteId, !menu.isPinned); onClose(); }}
            >
              {menu.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
              {menu.isPinned ? 'Unpin note' : 'Pin note'}
            </button>
            <button
              type="button"
              style={item}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--eb-panel-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-text)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-muted-2)'; }}
              onClick={() => setShowMove(true)}
            >
              <Folders size={13} />
              <span style={{ flex: 1 }}>Move to folder</span>
              <ChevronRight size={11} style={{ opacity: 0.5 }} />
            </button>
            <div style={{ height: 1, background: 'var(--eb-border)', margin: '3px 0' }} />
            <button
              type="button"
              style={{ ...item, color: '#f87171' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              onClick={() => { onDelete(menu.noteId); onClose(); }}
            >
              <Trash2 size={13} /> Delete note
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              style={{ ...item, fontSize: 11.5, color: 'var(--eb-muted)' }}
              onClick={() => setShowMove(false)}
            >
              <ChevronLeft size={11} /> Back
            </button>
            <div style={{ height: 1, background: 'var(--eb-border)', margin: '2px 0 4px' }} />
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {FOLDERS.map((f) => {
                const { Icon } = f;
                return (
                  <button
                    key={f.id}
                    type="button"
                    style={item}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--eb-panel-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-text)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-muted-2)'; }}
                    onClick={() => { onMove(menu.noteId, f.id); onClose(); }}
                  >
                    <Icon size={12} style={{ color: f.iconColor, flexShrink: 0 }} />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function NoteCardSkeleton() {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '14px 16px', borderRadius: 10,
        border: '1px solid var(--eb-border)', background: 'var(--eb-panel)',
        minHeight: 110,
      }}
    >
      <Sk w={32} h={32} r={7} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        <Sk w="75%" h={12} />
        <Sk w="50%" h={10} />
      </div>
      <Sk w={60} h={10} r={4} />
    </div>
  );
}

function FolderNoteList({
  notes,
  folder,
  folderLabel,
  onNewNote,
  isLoading,
  onDelete,
  onMove,
  onPin,
  onNoteClick,
  searchQuery,
}: {
  notes: LibraryNote[];
  folder: Folder | null;
  folderLabel: string;
  onNewNote: () => void;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onMove: (id: string, folderId: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onNoteClick: (note: LibraryNote) => void;
  searchQuery?: string;
}) {
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const FolderIcon = folder?.Icon ?? Library;
  const folderColor = folder?.iconColor ?? 'var(--green)';
  const isPinnedFolder = folder?.id === 'pinned';

  const displayedNotes = notes.slice(0, visibleCount);
  const hasMore = notes.length > visibleCount;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) setVisibleCount((c) => c + PAGE_SIZE); },
      { rootMargin: '120px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-observe only when hasMore changes
  }, [hasMore]);

  return (
    <div style={{ padding: '28px 36px 80px', maxWidth: 1000, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,.12)',
        }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `color-mix(in srgb, ${folderColor} 18%, transparent)`,
            border: `1px solid color-mix(in srgb, ${folderColor} 35%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <FolderIcon size={18} style={{ color: folderColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--eb-text)', letterSpacing: '-.01em' }}>
            {folderLabel}
          </div>
          {!isLoading && (
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 1 }}>
              {notes.length === 0 ? 'No notes yet' : `${notes.length} note${notes.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
        {isPinnedFolder ? (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 7,
              border: '1px solid rgba(245,165,36,.4)',
              background: 'rgba(245,165,36,.08)',
              color: '#f5a524', fontSize: 12, fontWeight: 600,
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            <Pin size={12} /> Pin notes via right-click
          </div>
        ) : (
          <button
            type="button"
            onClick={onNewNote}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 7,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            <Plus size={12} /> New note
          </button>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => <NoteCardSkeleton key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        /* Empty state */
        <div
          style={{
            marginTop: 8,
            padding: '48px 32px',
            borderRadius: 14,
            background: `linear-gradient(145deg, color-mix(in srgb, ${folderColor} 6%, var(--eb-panel)), var(--eb-panel))`,
            border: `1px dashed color-mix(in srgb, ${folderColor} 30%, var(--eb-border))`,
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}
        >
          <div
            style={{
              width: 56, height: 56, borderRadius: 14,
              background: `color-mix(in srgb, ${folderColor} 18%, transparent)`,
              border: `1px solid color-mix(in srgb, ${folderColor} 35%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            {searchQuery ? <Search size={24} style={{ color: folderColor }} /> : <FolderIcon size={24} style={{ color: folderColor }} />}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : isPinnedFolder ? 'No pinned notes yet' : `Nothing in ${folderLabel} yet`}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', maxWidth: 340, lineHeight: 1.6 }}>
            {searchQuery
              ? 'Try a different keyword, or search by tag name.'
              : isPinnedFolder
              ? 'Right-click any note and choose Pin note to surface it here for quick access.'
              : 'Create your first note here — capture ideas, research, or lessons and they\'ll appear in this folder.'}
          </div>
          {!isPinnedFolder && !searchQuery && (
            <button
              type="button"
              onClick={onNewNote}
              style={{
                marginTop: 6,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8,
                border: '1px solid #00b67a',
                background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={13} /> Create first note
            </button>
          )}
        </div>
      ) : (
        /* Note cards — 3-column grid */
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {displayedNotes.map((note) => {
            const iconEntry = NOTE_ICONS.find((i) => i.id === note.iconId);
            const NoteIcon = iconEntry?.Icon ?? FileText;
            const noteBg  = iconEntry?.bg  ?? 'rgba(100,149,237,.15)';
            const noteFg  = iconEntry?.fg  ?? '#6495ed';
            const noteFolder = FOLDERS.find((f) => f.id === note.folderId);
            return (
              <div
                key={note.id}
                onClick={() => onNoteClick(note)}
                onKeyDown={(e) => e.key === 'Enter' && onNoteClick(note)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setCtxMenu({ noteId: note.id, x: e.clientX, y: e.clientY, isPinned: note.pinned });
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--eb-panel-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--eb-panel)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--eb-border)'; }}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 0,
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--eb-border)',
                  borderTop: `3px solid ${noteFg}`,
                  background: 'var(--eb-panel)',
                  cursor: 'pointer',
                  transition: 'background .1s, border-color .1s',
                  minHeight: 110,
                }}
              >
                {/* Top row: icon + pin */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: noteBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <NoteIcon size={15} style={{ color: noteFg }} />
                  </div>
                  {note.pinned && (
                    <Pin size={11} style={{ color: '#f5a524', flexShrink: 0, marginTop: 2 }} />
                  )}
                </div>
                {/* Note name */}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)', lineHeight: 1.4, flex: 1,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.name}
                </div>
                {/* Bottom row: folder tag + date */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                  {!folder && noteFolder ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <noteFolder.Icon size={9} style={{ color: noteFolder.iconColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', whiteSpace: 'nowrap' }}>{noteFolder.label}</span>
                    </div>
                  ) : <span />}
                  <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', flexShrink: 0 }}>{relativeDate(note.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite-scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', color: 'var(--eb-muted)', fontSize: 12 }}>
            Loading more…
          </div>
        )}
        </>
      )}

      {ctxMenu && (
        <NoteContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onPin={(id, pinned) => {
            onPin(id, pinned);
            setCtxMenu(null);
          }}
          onDelete={(id) => {
            const noteName = notes.find((n) => n.id === id)?.name ?? 'this note';
            setPending({ kind: 'delete', noteId: id, noteName });
            setCtxMenu(null);
          }}
          onMove={(id, folderId) => {
            const noteName = notes.find((n) => n.id === id)?.name ?? 'this note';
            const fl = [...QUICK_FOLDERS, ...FOLDERS].find((f) => f.id === folderId)?.label ?? folderId;
            setPending({ kind: 'move', noteId: id, noteName, folderId, folderLabel: fl });
            setCtxMenu(null);
          }}
        />
      )}

      {pending && (
        <ConfirmDialog
          action={pending}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (pending.kind === 'delete') {
              onDelete(pending.noteId);
            } else {
              onMove(pending.noteId, pending.folderId);
            }
            setPending(null);
          }}
        />
      )}
    </div>
  );
}

function NewNoteDialog({
  defaultFolder,
  onClose,
  onCreate,
}: {
  defaultFolder?: string | null;
  onClose: () => void;
  onCreate: (note: CreateNoteInput) => void;
}) {
  const allFolders = [...QUICK_FOLDERS, ...FOLDERS];
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState(defaultFolder ?? FOLDERS[0]?.id ?? '');
  const [iconId, setIconId] = useState('file');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), folderId, iconId });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.50)', zIndex: 50 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <dialog
        open
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 51,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: '20px 22px',
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,.55)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          margin: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>New note</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 5, border: 0,
              background: 'transparent', color: 'var(--eb-muted)', cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Note name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="nn-name" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--eb-muted-2)' }}>
            Note name
          </label>
          <input
            id="nn-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Liquidity sweep setup"
            style={{
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 7,
              padding: '7px 10px',
              color: 'var(--eb-text)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Folder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label htmlFor="nn-folder" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--eb-muted-2)' }}>
            Folder
          </label>
          <select
            id="nn-folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            style={{
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 7,
              padding: '7px 10px',
              color: 'var(--eb-text)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            {allFolders.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Icon picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--eb-muted-2)' }}>Icon</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {NOTE_ICONS.map(({ id, Icon }) => {
              const selected = iconId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIconId(id)}
                  style={{
                    width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
                    border: selected ? '1.5px solid var(--green)' : '1px solid var(--eb-border)',
                    background: selected ? 'rgba(0,214,143,.10)' : 'var(--eb-panel-2)',
                    color: selected ? 'var(--green)' : 'var(--eb-muted-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color .1s, background .1s, color .1s',
                  }}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer',
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)', color: 'var(--eb-muted-2)', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
              border: '1px solid #00b67a',
              background: name.trim()
                ? 'linear-gradient(180deg,#00d68f,#00b67a)'
                : 'var(--eb-panel-2)',
              color: name.trim() ? '#06140f' : 'var(--eb-muted)',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'background .15s, color .15s',
            }}
          >
            Create note
          </button>
        </div>
      </dialog>
    </>
  );
}

// ─── Cover generator ──────────────────────────────────────────────────────────

function generateCoverBg(id: string): string {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (((hash << 5) + hash) + id.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash);

  const bases = [
    '#0f172a,#1e293b 45%,#312e81 80%',
    '#0a0e14,#0d1f16 45%,#064e35 80%',
    '#0f172a,#1a1025 45%,#2d1b4e 80%',
    '#0a1020,#0e2033 45%,#0c4a6e 80%',
    '#1a0e0e,#2d1515 45%,#4c1c1c 80%',
    '#0f1620,#1e2b12 45%,#1a3320 80%',
    '#0c0e1a,#1e1a2e 45%,#3b1f6b 80%',
    '#0a1214,#0e2430 45%,#083344 80%',
  ];

  const accentPairs: [string, string, string, string][] = [
    ['rgba(0,214,143,.25)', '20% 30%', 'rgba(139,92,246,.20)', '80% 70%'],
    ['rgba(6,182,212,.22)', '15% 40%', 'rgba(0,214,143,.18)', '75% 60%'],
    ['rgba(139,92,246,.28)', '30% 20%', 'rgba(6,182,212,.18)', '70% 80%'],
    ['rgba(245,165,36,.22)', '25% 35%', 'rgba(0,214,143,.15)', '75% 65%'],
    ['rgba(248,113,113,.20)', '20% 40%', 'rgba(139,92,246,.18)', '80% 60%'],
    ['rgba(0,214,143,.20)', '70% 25%', 'rgba(6,182,212,.22)', '30% 75%'],
    ['rgba(139,92,246,.25)', '50% 20%', 'rgba(248,113,113,.15)', '20% 80%'],
    ['rgba(6,182,212,.25)', '80% 30%', 'rgba(245,165,36,.18)', '25% 70%'],
  ];

  const baseIdx = h % bases.length;
  const accentIdx = ((h >> 3) + 1) % accentPairs.length;
  const fallbackAccent: [string, string, string, string] = ['rgba(0,214,143,.25)', '20% 30%', 'rgba(139,92,246,.20)', '80% 70%'];
  const [c1, p1, c2, p2] = accentPairs[accentIdx] ?? fallbackAccent;

  return `radial-gradient(400px 200px at ${p1}, ${c1}, transparent 60%), radial-gradient(400px 200px at ${p2}, ${c2}, transparent 60%), linear-gradient(135deg, ${bases[baseIdx]})`;
}

// ─── Image picker / Link popover / Bubble toolbar ────────────────────────────

type LinkFormat   = 'embed' | 'link' | 'bookmark' | 'plain';
type TextBlock    = { type: 'text'; id: string; content: string };
type LinkBlockData = { type: 'link'; id: string; url: string; domain: string; format: 'embed' | 'link' | 'bookmark' };
type HeadingBlock = { type: 'h1' | 'h2'; id: string; content: string };
type BulletBlock  = { type: 'bullet'; id: string; content: string };
type TodoBlock    = { type: 'todo'; id: string; content: string; checked: boolean };
type CalloutBlock = { type: 'callout'; id: string; content: string; variant: 'info' | 'warn' | 'tip' };
type Block = TextBlock | LinkBlockData | HeadingBlock | BulletBlock | TodoBlock | CalloutBlock;

function ImagePickerPanel({
  onConfirm,
  onClose,
}: {
  onConfirm: (url: string, alt: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'upload' | 'url' | 'notebook' | 'trade'>('upload');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const tabStyle = (id: typeof tab): React.CSSProperties => ({
    flex: 1, padding: '8px 10px', background: 'transparent', border: 0,
    borderBottom: `2px solid ${tab === id ? 'var(--green)' : 'transparent'}`,
    color: tab === id ? 'var(--eb-text)' : 'var(--eb-muted)',
    cursor: 'pointer', fontSize: 11.5, fontFamily: 'inherit',
  });

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.50)', zIndex: 50 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button" tabIndex={-1} aria-label="Close"
      />
      <dialog
        open
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 51, margin: 0,
          background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
          borderRadius: 12, width: 480, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,.55)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--eb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <ImageIcon size={13} /> Insert image
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: 3, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)' }}>
          {(['upload', 'url', 'notebook', 'trade'] as const).map((id) => (
            <button key={id} type="button" onClick={() => setTab(id)} style={tabStyle(id)}>
              {id === 'upload' ? '📤 Upload' : id === 'url' ? '📎 Paste URL' : id === 'notebook' ? '🗂 Notebook' : '📒 From trade'}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{ padding: 20 }}>
          {tab === 'upload' && (
            <>
              <input
                ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => onConfirm(reader.result as string, file.name.replace(/\.[^.]+$/, ''));
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                type="button"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file?.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = () => onConfirm(reader.result as string, file.name.replace(/\.[^.]+$/, ''));
                    reader.readAsDataURL(file);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? 'var(--green)' : 'var(--eb-border)'}`,
                  borderRadius: 9, padding: '28px 20px', cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%',
                  background: dragging ? 'rgba(0,214,143,.04)' : 'var(--eb-panel-2)',
                  transition: 'border-color .12s, background .12s', fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 32, opacity: .7 }}>📥</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}>Drop image to upload</div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
                  or click to browse · paste with{' '}
                  <kbd style={{ fontSize: 10.5, padding: '1px 5px', border: '1px solid var(--eb-border)', borderRadius: 4 }}>⌘V</kbd>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  {['PNG', 'JPG', 'SVG', 'WebP', 'GIF'].map((f) => (
                    <span key={f} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)' }}>{f}</span>
                  ))}
                </div>
              </button>
            </>
          )}

          {tab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="ip-url" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--eb-muted-2)' }}>Image URL</label>
                <input
                  id="ip-url"
                  ref={(el) => { if (el && tab === 'url') el.focus(); }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && url.trim() && onConfirm(url.trim(), alt || 'image')}
                  placeholder="https://example.com/image.png"
                  style={{
                    background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
                    borderRadius: 7, padding: '7px 10px', color: 'var(--eb-text)',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="ip-alt" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--eb-muted-2)' }}>
                  Alt text <span style={{ color: 'var(--eb-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="ip-alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe the image"
                  style={{
                    background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
                    borderRadius: 7, padding: '7px 10px', color: 'var(--eb-text)',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => url.trim() && onConfirm(url.trim(), alt || 'image')}
                  disabled={!url.trim()}
                  style={{
                    padding: '6px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                    border: '1px solid #00b67a',
                    background: url.trim() ? 'linear-gradient(180deg,#00d68f,#00b67a)' : 'var(--eb-panel-2)',
                    color: url.trim() ? '#06140f' : 'var(--eb-muted)',
                    cursor: url.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  }}
                >
                  Insert image
                </button>
              </div>
            </div>
          )}

          {(tab === 'notebook' || tab === 'trade') && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ fontSize: 28, marginBottom: 10, opacity: .6 }}>🚧</div>
              <div style={{ fontWeight: 600, color: 'var(--eb-text)', marginBottom: 4 }}>
                {tab === 'notebook' ? 'Browse notebook images' : 'Pull chart from a trade'}
              </div>
              {tab === 'notebook'
                ? 'Coming soon — reuse screenshots already saved in your notebook.'
                : 'Coming soon — pull the entry / exit chart from any logged trade.'}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function LinkPopover({
  url,
  onChoose,
  onDismiss,
}: {
  url: string;
  onChoose: (format: LinkFormat) => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
      if (e.key === 'l' || e.key === 'L') onChoose('link');
      if (e.key === 'b' || e.key === 'B') onChoose('bookmark');
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onChoose, onDismiss]);

  const domain = (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } })();

  const opts: { format: LinkFormat; Icon: LucideIcon; label: string; desc: string; kbd: string }[] = [
    { format: 'embed',    Icon: Globe,    label: 'Embed as preview card', desc: 'Rich card with title and thumbnail.',   kbd: '↵' },
    { format: 'link',     Icon: Link2,    label: 'Display as link',       desc: 'Inline hyperlink with the page title.', kbd: 'L' },
    { format: 'bookmark', Icon: Bookmark, label: 'Bookmark (small)',       desc: 'Compact card with favicon and title.',  kbd: 'B' },
    { format: 'plain',    Icon: FileText, label: 'Keep as plain text',     desc: "Don't convert — leave as written.",     kbd: 'esc' },
  ];

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
        onClick={onDismiss}
        onKeyDown={(e) => e.key === 'Escape' && onDismiss()}
        role="button" tabIndex={-1} aria-label="Dismiss"
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 51,
          width: 420, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
          borderRadius: 11, boxShadow: '0 20px 50px rgba(0,0,0,.45)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--eb-border)', fontSize: 11.5, color: 'var(--eb-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link2 size={11} style={{ flexShrink: 0 }} />
          You pasted{' '}
          <span style={{ color: 'var(--eb-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
            {domain}
          </span>
          — how would you like to add it?
        </div>
        <div style={{ padding: 8 }}>
          {opts.map(({ format, Icon: Ic, label, desc, kbd }) => (
            <button
              key={format}
              type="button"
              onClick={() => onChoose(format)}
              style={{
                display: 'flex', gap: 11, padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                alignItems: 'center', width: '100%', textAlign: 'left',
                background: 'transparent', border: 0, fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--eb-panel-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 7, background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic size={14} style={{ color: 'var(--eb-muted-2)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--eb-text)' }}>{label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 1 }}>{desc}</div>
              </div>
              <kbd style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--eb-border)', borderRadius: 4, color: 'var(--eb-muted)', fontFamily: 'inherit', flexShrink: 0 }}>{kbd}</kbd>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function BubbleToolbar({
  position,
  onFormat,
}: {
  position: { x: number; y: number };
  onFormat: (type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'highlight' | 'textColor' | 'wl') => void;
}) {
  const left = Math.min(Math.max(position.x - 200, 8), window.innerWidth - 440);
  const top  = Math.max(position.y - 52, 8);

  const btn: React.CSSProperties = {
    background: 'transparent', border: 0, color: 'var(--eb-text)', cursor: 'pointer',
    fontSize: 12, padding: '5px 7px', borderRadius: 5,
    fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26,
  };
  const sep = <div style={{ width: 1, height: 18, background: 'var(--eb-border)', margin: '0 2px', flexShrink: 0 }} />;

  return (
    <div
      style={{
        position: 'fixed', left, top, zIndex: 30,
        background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
        borderRadius: 9, boxShadow: '0 12px 30px rgba(0,0,0,.45)',
        padding: '3px 5px', display: 'flex', alignItems: 'center', gap: 1,
      }}
      onMouseDownCapture={(e) => e.preventDefault()}
    >
      {/* Style dropdown */}
      <button type="button" style={{ ...btn, gap: 2, fontSize: 11.5, paddingRight: 4 }} title="Text style">
        <span style={{ fontWeight: 600 }}>Aa</span>
        <span style={{ fontSize: 9, color: 'var(--eb-muted)', marginTop: 1 }}>▾</span>
      </button>
      {sep}
      {/* Format buttons */}
      <button type="button" style={{ ...btn, fontWeight: 700 }} title="Bold (⌘B)" onClick={() => onFormat('bold')}>B</button>
      <button type="button" style={{ ...btn, fontStyle: 'italic', fontWeight: 600 }} title="Italic (⌘I)" onClick={() => onFormat('italic')}>I</button>
      <button type="button" style={{ ...btn, textDecoration: 'underline' }} title="Underline (⌘U)" onClick={() => onFormat('underline')}>U</button>
      <button type="button" style={{ ...btn, textDecoration: 'line-through', color: 'var(--eb-muted)' }} title="Strikethrough" onClick={() => onFormat('strike')}>S</button>
      <button type="button" style={{ ...btn, fontFamily: 'monospace', fontSize: 10.5, color: 'var(--eb-muted)' }} title="Inline code (⌘E)" onClick={() => onFormat('code')}>{'</>'}</button>
      {sep}
      {/* Highlight + Color */}
      <button type="button" style={{ ...btn, gap: 3 }} title="Highlight" onClick={() => onFormat('highlight')}>
        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>HL</span>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'block', flexShrink: 0 }} />
      </button>
      <button type="button" style={{ ...btn, gap: 3 }} title="Text color" onClick={() => onFormat('textColor')}>
        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>A</span>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', display: 'block', flexShrink: 0 }} />
      </button>
      <button type="button" style={{ ...btn, gap: 3 }} title="White / clear formatting" onClick={() => onFormat('wl')}>
        <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>WL</span>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ffffff', border: '1px solid var(--eb-border)', display: 'block', flexShrink: 0 }} />
      </button>
    </div>
  );
}

function LinkInsertPanel({ onConfirm, onClose }: { onConfirm: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const submit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onConfirm(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.50)', zIndex: 50 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button" tabIndex={-1} aria-label="Close"
      />
      <dialog
        open
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 51, margin: 0,
          background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
          borderRadius: 12, width: 420, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,.55)', padding: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--eb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Link2 size={13} /> Add link preview
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: 3, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="li-url" style={{ fontSize: 11.5, color: 'var(--eb-muted)', fontWeight: 500 }}>URL</label>
            <input
              id="li-url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              ref={(el) => { if (el) el.focus(); }}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 7,
                background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
                color: 'var(--eb-text)', fontSize: 13, fontFamily: 'inherit', outline: 0,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--eb-border)', background: 'transparent', color: 'var(--eb-muted)', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Cancel</button>
            <button
              type="button"
              onClick={submit}
              disabled={!url.trim()}
              style={{ padding: '7px 14px', borderRadius: 7, border: 0, background: 'var(--green)', color: '#000', cursor: url.trim() ? 'pointer' : 'default', fontSize: 12.5, fontFamily: 'inherit', fontWeight: 600, opacity: url.trim() ? 1 : 0.4 }}
            >
              Add
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function LinkCard({ block, onRemove }: { block: LinkBlockData; onRemove: () => void }) {
  const icon =
    /youtube/.test(block.url) ? '🎥' :
    /twitter\.com|x\.com/.test(block.url) ? '𝕏' :
    /github\.com/.test(block.url) ? '🐙' :
    /reddit\.com/.test(block.url) ? '🔴' :
    /medium\.com/.test(block.url) ? '📝' :
    '🔗';

  return (
    <a
      href={block.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: 10, borderRadius: 9, border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)', textDecoration: 'none', color: 'inherit',
        marginBottom: 8, position: 'relative',
        transition: 'border-color .12s, background .12s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--eb-muted)';
        (e.currentTarget as HTMLElement).style.background = 'var(--eb-panel)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--eb-border)';
        (e.currentTarget as HTMLElement).style.background = 'var(--eb-panel-2)';
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 7, flexShrink: 0,
          background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block.domain}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {block.url}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        style={{
          position: 'absolute', top: 6, right: 6,
          background: 'none', border: 0, color: 'var(--eb-muted)',
          cursor: 'pointer', padding: 2, display: 'flex', borderRadius: 4,
        }}
        title="Remove"
      >
        <X size={11} />
      </button>
    </a>
  );
}

// ─── contenteditable DOM helpers ─────────────────────────────────────────────

function getNodeAtOffset(el: HTMLElement, target: number): [Node, number] {
  let rem = target;
  const walk = (node: Node): [Node, number] | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (rem <= len) return [node, rem];
      rem -= len;
      return null;
    }
    for (const child of Array.from(node.childNodes)) {
      const r = walk(child);
      if (r) return r;
    }
    return null;
  };
  return walk(el) ?? [el, el.childNodes.length];
}

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function setCaretOffset(el: HTMLElement, offset: number): void {
  const max = el.textContent?.length ?? 0;
  const [node, off] = getNodeAtOffset(el, Math.min(offset, max));
  const range = document.createRange();
  range.setStart(node, off);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function extractHTMLBefore(el: HTMLElement, textOffset: number): string {
  if (textOffset === 0) return '';
  const range = document.createRange();
  range.selectNodeContents(el);
  const [node, off] = getNodeAtOffset(el, textOffset);
  range.setEnd(node, off);
  const tmp = document.createElement('div');
  tmp.appendChild(range.cloneContents());
  return tmp.innerHTML;
}

function extractHTMLAfter(el: HTMLElement, textOffset: number): string {
  const fullLen = el.textContent?.length ?? 0;
  if (textOffset >= fullLen) return '';
  const range = document.createRange();
  const [node, off] = getNodeAtOffset(el, textOffset);
  range.setStart(node, off);
  const [endNode, endOff] = getNodeAtOffset(el, fullLen);
  range.setEnd(endNode, endOff);
  const tmp = document.createElement('div');
  tmp.appendChild(range.cloneContents());
  return tmp.innerHTML;
}

// ─── Note editor ─────────────────────────────────────────────────────────────

function NoteEditor({ note, onBack, onFolderClick }: { note: LibraryNote; onBack: () => void; onFolderClick: (folderId: string) => void }) {
  const updateNote = useUpdateNote();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [title, setTitle] = useState(note.name);
  const [tags, setTags] = useState<string[]>(() => note.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [playbookId, setPlaybookId] = useState<string | null>(() => note.playbookId ?? null);
  const [showPlaybookMenu, setShowPlaybookMenu] = useState(false);
  const { data: playbooks } = usePlaybooks();
  const linkedPlaybook = playbooks?.find((p) => p.id === playbookId) ?? null;

  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (note.bodyMd) {
      try {
        const parsed = JSON.parse(note.bodyMd);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as Block[];
      } catch {}
    }
    return [{ type: 'text', id: 'b0', content: note.bodyMd ?? '' }];
  });
  const [bodyFocused, setBodyFocused] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashCursor, setSlashCursor] = useState(0);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLinkInsert, setShowLinkInsert] = useState(false);
  const [linkPopover, setLinkPopover] = useState<{ url: string } | null>(null);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const [slashMenuPos, setSlashMenuPos] = useState<{ x: number; anchorTop: number; anchorBottom: number }>({ x: 0, anchorTop: 0, anchorBottom: 0 });
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const activeBlockId = useRef<string>('b0');
  const pendingInsertBlockId = useRef<string>('b0');
  const pendingAfterHTML = useRef<string>('');
  const pendingNewAfterBlockId = useRef<string | null>(null);
  const pendingLinkRange = useRef<{ blockId: string; start: number; end: number; url: string } | null>(null);

  const genId = () => `b-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const getDomain = (url: string) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } };

  // Auto-save: debounce 1 s after any change to blocks or title
  const noteId = note.id;
  const mutate = updateNote.mutate;
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('idle');
    saveTimer.current = setTimeout(() => {
      setSaveState('saving');
      mutate(
        { id: noteId, name: title, bodyMd: JSON.stringify(blocks), tags, playbookId },
        { onSettled: () => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 1500); } },
      );
    }, 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [blocks, title, tags, playbookId, noteId, mutate]);

  const noteFolder = [...QUICK_FOLDERS, ...FOLDERS].find((f) => f.id === note.folderId);
  const iconEntry = NOTE_ICONS.find((i) => i.id === note.iconId);
  const NoteIcon = iconEntry?.Icon ?? FileText;
  const noteFg = iconEntry?.fg ?? '#6495ed';

  const handleBlockInput = (blockId: string, el: HTMLDivElement) => {
    setBubblePos(null);
    setBlocks((prev) => prev.map((b) => b.id === blockId && b.type === 'text' ? { ...b, content: el.innerHTML } : b));

    // Slash detection: look at text in current node before cursor
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const startNode = range.startContainer;
      const nodeText = startNode.nodeType === Node.TEXT_NODE ? (startNode.textContent ?? '') : '';
      const before = nodeText.slice(0, range.startOffset);
      const lastSep = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n'));
      const currentWord = before.slice(lastSep + 1);
      if (currentWord.startsWith('/') && !currentWord.includes(' ')) {
        const rect = el.getBoundingClientRect();
        setSlashMenuPos({ x: rect.left, anchorTop: rect.top, anchorBottom: rect.bottom + 4 });
        setSlashQuery(currentWord.slice(1));
        setShowSlash(true);
        setSlashCursor(0);
        return;
      }
    }
    setShowSlash(false);
    setSlashQuery('');
  };

  const updateBlockContent = (id: string, content: string) =>
    setBlocks((prev) => prev.map((b) => b.id === id && 'content' in b ? { ...b, content } as Block : b));

  const focusPrev = (blockId: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      const prevId = idx > 0 ? prev[idx - 1]?.id : undefined;
      setTimeout(() => { if (prevId) blockRefs.current.get(prevId)?.focus(); }, 0);
      return prev.filter((b) => b.id !== blockId);
    });
  };

  const insertAfterBlock = (blockId: string, newBlock: Block) => {
    const focusId = newBlock.id;
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return [...prev, newBlock];
      return [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)];
    });
    setTimeout(() => blockRefs.current.get(focusId)?.focus(), 0);
  };

  const handleHeadingKeyDown = (blockId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (e.key === 'Enter') {
      e.preventDefault();
      insertAfterBlock(blockId, { type: 'text', id: genId(), content: '' });
      return;
    }
    if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      const prevId = (blocks[idx - 1] as Block | undefined)?.id;
      if (prevId) setTimeout(() => blockRefs.current.get(prevId)?.focus(), 0);
      return;
    }
    if (e.key === 'ArrowDown' && idx < blocks.length - 1) {
      e.preventDefault();
      const nextId = (blocks[idx + 1] as Block | undefined)?.id;
      if (nextId) setTimeout(() => blockRefs.current.get(nextId)?.focus(), 0);
      return;
    }
    if (e.key === 'Backspace') {
      const el = blockRefs.current.get(blockId) as HTMLInputElement | undefined;
      if ((el?.selectionStart ?? 1) === 0 && (el?.selectionEnd ?? 1) === 0) {
        const b = blocks.find((b) => b.id === blockId) as HeadingBlock | undefined;
        if (!b?.content) { e.preventDefault(); focusPrev(blockId); }
      }
    }
  };

  const handleListKeyDown = (blockId: string, e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const b = blocks.find((bl) => bl.id === blockId) as BulletBlock | TodoBlock | undefined;
    if (!b) return;

    if (e.key === 'Enter') {
      if (b.type === 'bullet') {
        const el = blockRefs.current.get(blockId) as HTMLTextAreaElement | undefined;
        const val = el?.value ?? b.content;
        const cursor = el?.selectionStart ?? val.length;
        const lineStart = val.lastIndexOf('\n', cursor - 1) + 1;
        const lineEnd = val.indexOf('\n', cursor);
        const currentLineText = lineEnd === -1 ? val.slice(lineStart) : val.slice(lineStart, lineEnd);

        if (currentLineText.trim() === '') {
          e.preventDefault();
          const before = lineStart > 0 ? val.slice(0, lineStart - 1) : '';
          const after = lineEnd !== -1 ? val.slice(lineEnd + 1) : '';
          const newContent = (before + (before && after ? '\n' : '') + after).trimEnd();

          if (!newContent) {
            setBlocks((prev) => prev.map((bl) => bl.id === blockId ? { type: 'text', id: blockId, content: '' } as TextBlock : bl));
            setTimeout(() => blockRefs.current.get(blockId)?.focus(), 0);
          } else {
            const newTextId = genId();
            setBlocks((prev) => {
              const i = prev.findIndex((bl) => bl.id === blockId);
              const updated = prev.map((bl) => bl.id === blockId ? { ...bl, content: newContent } : bl);
              return [...updated.slice(0, i + 1), { type: 'text', id: newTextId, content: '' } as TextBlock, ...updated.slice(i + 1)];
            });
            setTimeout(() => blockRefs.current.get(newTextId)?.focus(), 0);
          }
        }
        // non-empty line: allow natural newline
        return;
      }
      // todo: Enter creates new todo or converts empty to text
      e.preventDefault();
      if (!b.content) {
        setBlocks((prev) => prev.map((bl) => bl.id === blockId ? { type: 'text', id: blockId, content: '' } as TextBlock : bl));
        setTimeout(() => blockRefs.current.get(blockId)?.focus(), 0);
        return;
      }
      insertAfterBlock(blockId, { type: 'todo', id: genId(), content: '', checked: false });
      return;
    }
    if (e.key === 'ArrowUp' && idx > 0) {
      const el = blockRefs.current.get(blockId) as HTMLTextAreaElement | HTMLInputElement | undefined;
      const onFirstLine = !el || (el as HTMLTextAreaElement).value?.indexOf('\n') === -1 || (el as HTMLTextAreaElement).selectionStart <= ((el as HTMLTextAreaElement).value?.indexOf('\n') ?? 0);
      if (onFirstLine) {
        e.preventDefault();
        const prevId = (blocks[idx - 1] as Block | undefined)?.id;
        if (prevId) setTimeout(() => blockRefs.current.get(prevId)?.focus(), 0);
      }
      return;
    }
    if (e.key === 'ArrowDown' && idx < blocks.length - 1) {
      const el = blockRefs.current.get(blockId) as HTMLTextAreaElement | HTMLInputElement | undefined;
      const val = (el as HTMLTextAreaElement)?.value ?? '';
      const lastNl = val.lastIndexOf('\n');
      const onLastLine = lastNl === -1 || (el as HTMLTextAreaElement).selectionStart > lastNl;
      if (onLastLine) {
        e.preventDefault();
        const nextId = (blocks[idx + 1] as Block | undefined)?.id;
        if (nextId) setTimeout(() => blockRefs.current.get(nextId)?.focus(), 0);
      }
      return;
    }
    if (e.key === 'Backspace') {
      const el = blockRefs.current.get(blockId) as HTMLTextAreaElement | HTMLInputElement | undefined;
      if ((el?.selectionStart ?? 1) === 0 && (el?.selectionEnd ?? 1) === 0) {
        if (!b.content) { e.preventDefault(); focusPrev(blockId); }
      }
    }
  };

  const slashFilteredGroups = slashQuery
    ? SLASH_GROUPS.map(({ group, items }) => ({
        group,
        items: items.filter(
          (item) =>
            item.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
            (item.desc ?? '').toLowerCase().includes(slashQuery.toLowerCase()),
        ),
      })).filter(({ items }) => items.length > 0)
    : SLASH_GROUPS;

  const slashFlatItems = slashFilteredGroups.flatMap((g) => g.items);

  const insertBlock = (itemId: string) => {
    const blockId = activeBlockId.current;
    const el = blockRefs.current.get(blockId) as HTMLDivElement | undefined;
    if (!el) return;

    const activeBlock = blocks.find((b) => b.id === blockId);
    if (!activeBlock || activeBlock.type !== 'text') return;

    const caretOffset = getCaretOffset(el);
    // Find start of current word (the slash line)
    const sel = window.getSelection();
    let lineStart = caretOffset;
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const nodeText = range.startContainer.textContent ?? '';
        const before = nodeText.slice(0, range.startOffset);
        const lastSep = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n'));
        const wordLen = before.slice(lastSep + 1).length;
        lineStart = caretOffset - wordLen;
      }
    }

    const closeSlash = () => { setShowSlash(false); setSlashQuery(''); setSlashCursor(0); };

    if (itemId === 'image') {
      const beforeHTML = extractHTMLBefore(el, lineStart);
      const afterHTML = extractHTMLAfter(el, caretOffset);
      setBlocks((prev) => prev.map((b) => b.id === blockId && b.type === 'text' ? { ...b, content: beforeHTML } : b));
      pendingInsertBlockId.current = blockId;
      pendingAfterHTML.current = afterHTML;
      closeSlash();
      setShowImagePicker(true);
      return;
    }

    if (itemId === 'link') {
      const beforeHTML = extractHTMLBefore(el, lineStart);
      const afterHTML = extractHTMLAfter(el, caretOffset);
      const newAfterId = genId();
      pendingInsertBlockId.current = blockId;
      pendingNewAfterBlockId.current = newAfterId;
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const updatedBefore: TextBlock = { type: 'text', id: blockId, content: beforeHTML };
        const newAfter: TextBlock = { type: 'text', id: newAfterId, content: afterHTML };
        return [...prev.slice(0, idx), updatedBefore, newAfter, ...prev.slice(idx + 1)];
      });
      closeSlash();
      setShowLinkInsert(true);
      return;
    }

    if (itemId === 'h1' || itemId === 'h2' || itemId === 'bullet' || itemId === 'todo') {
      const beforeHTML = extractHTMLBefore(el, lineStart);
      const afterHTML = extractHTMLAfter(el, caretOffset);
      const newBlockId = genId();
      const newAfterId = genId();
      const newBlock: Block =
        itemId === 'h1'     ? { type: 'h1',     id: newBlockId, content: '' } :
        itemId === 'h2'     ? { type: 'h2',     id: newBlockId, content: '' } :
        itemId === 'bullet' ? { type: 'bullet', id: newBlockId, content: '' } :
                              { type: 'todo',   id: newBlockId, content: '', checked: false };
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const updatedBefore: TextBlock = { type: 'text', id: blockId, content: beforeHTML };
        const newAfter: TextBlock = { type: 'text', id: newAfterId, content: afterHTML };
        return [...prev.slice(0, idx), updatedBefore, newBlock, newAfter, ...prev.slice(idx + 1)];
      });
      closeSlash();
      setTimeout(() => blockRefs.current.get(newBlockId)?.focus(), 0);
      return;
    }

    if (itemId === 'callout') {
      const beforeHTML = extractHTMLBefore(el, lineStart);
      const afterHTML = extractHTMLAfter(el, caretOffset);
      const newBlockId = genId();
      const newAfterId = genId();
      const newBlock: CalloutBlock = { type: 'callout', id: newBlockId, content: '', variant: 'info' };
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const updatedBefore: TextBlock = { type: 'text', id: blockId, content: beforeHTML };
        const newAfter: TextBlock = { type: 'text', id: newAfterId, content: afterHTML };
        return [...prev.slice(0, idx), updatedBefore, newBlock, newAfter, ...prev.slice(idx + 1)];
      });
      closeSlash();
      setTimeout(() => blockRefs.current.get(newBlockId)?.focus(), 0);
      return;
    }

    // text, code — just clear the slash and insert text
    const INSERTIONS: Record<string, string> = {
      text: '', code: '```\n\n```\n',
    };
    const insertion = INSERTIONS[itemId] ?? '';
    const beforeHTML = extractHTMLBefore(el, lineStart);
    const afterHTML = extractHTMLAfter(el, caretOffset);
    const newContent = beforeHTML + (insertion ? insertion.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '') + afterHTML;
    setBlocks((prev) => prev.map((b) => b.id === blockId && b.type === 'text' ? { ...b, content: newContent } : b));
    closeSlash();
    setTimeout(() => { el.focus(); setCaretOffset(el, (el.textContent?.length ?? 0)); }, 0);
  };

  const handleBlockKeyDown = (blockId: string, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (showSlash) {
      if (e.key === 'Escape') { setShowSlash(false); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashCursor((c) => Math.min(c + 1, slashFlatItems.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashCursor((c) => Math.max(c - 1, 0)); return; }
      if (e.key === 'Enter') { e.preventDefault(); const item = slashFlatItems[slashCursor]; if (item) insertBlock(item.id); return; }
      return;
    }

    const el = blockRefs.current.get(blockId) as HTMLDivElement | undefined;
    const idx = blocks.findIndex((b) => b.id === blockId);
    const block = blocks[idx] as TextBlock | undefined;
    if (!el || !block) return;

    const sel = window.getSelection();
    const isCollapsed = sel?.isCollapsed ?? true;
    const caretOffset = sel ? getCaretOffset(el) : 0;
    const textLen = el.textContent?.length ?? 0;

    // Enter → split into two text blocks
    if (e.key === 'Enter') {
      e.preventDefault();
      const beforeHTML = extractHTMLBefore(el, caretOffset);
      const afterHTML = extractHTMLAfter(el, caretOffset);
      const newBlockId = genId();
      setBlocks((prev) => {
        const i = prev.findIndex((b) => b.id === blockId);
        if (i === -1) return prev;
        const updated: TextBlock = { type: 'text', id: blockId, content: beforeHTML };
        const newBlock: TextBlock = { type: 'text', id: newBlockId, content: afterHTML };
        return [...prev.slice(0, i), updated, newBlock, ...prev.slice(i + 1)];
      });
      setTimeout(() => blockRefs.current.get(newBlockId)?.focus(), 0);
      return;
    }

    // Backspace at col 0 → merge into previous block, or remove if empty
    if (e.key === 'Backspace' && isCollapsed && caretOffset === 0 && idx > 0) {
      const prevBlock = blocks[idx - 1] as Block | undefined;
      if (!prevBlock) return;
      if (prevBlock.type === 'text') {
        e.preventDefault();
        const prevId = prevBlock.id;
        const prevLen = prevBlock.content.replace(/<[^>]*>/g, '').length;
        const mergedHTML = prevBlock.content + block.content;
        setBlocks((prev) => {
          const i = prev.findIndex((b) => b.id === blockId);
          if (i <= 0) return prev;
          const pi = i - 1;
          if (prev[pi]?.type !== 'text') return prev;
          const merged: TextBlock = { type: 'text', id: (prev[pi] as TextBlock).id, content: mergedHTML };
          return [...prev.slice(0, pi), merged, ...prev.slice(i + 1)];
        });
        setTimeout(() => {
          const pEl = blockRefs.current.get(prevId) as HTMLDivElement | undefined;
          if (pEl) { pEl.focus(); setCaretOffset(pEl, prevLen); }
        }, 0);
      } else if (!block.content) {
        e.preventDefault();
        const prevId = prevBlock.id;
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
        setTimeout(() => blockRefs.current.get(prevId)?.focus(), 0);
      }
      return;
    }

    // ArrowUp at first char → focus previous block
    if (e.key === 'ArrowUp' && idx > 0 && caretOffset === 0) {
      e.preventDefault();
      const prevId = (blocks[idx - 1] as Block | undefined)?.id;
      if (prevId) setTimeout(() => blockRefs.current.get(prevId)?.focus(), 0);
      return;
    }

    // ArrowDown at last char → focus next block
    if (e.key === 'ArrowDown' && idx < blocks.length - 1 && caretOffset === textLen) {
      e.preventDefault();
      const nextId = (blocks[idx + 1] as Block | undefined)?.id;
      if (nextId) setTimeout(() => blockRefs.current.get(nextId)?.focus(), 0);
      return;
    }
  };

  const onImageConfirm = (imgUrl: string, imgAlt: string) => {
    const altEsc = imgAlt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const urlEsc = imgUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const imgHtml = `<img src="${urlEsc}" alt="${altEsc}" style="max-width:100%;border-radius:6px;display:block;margin:4px 0;" />`;
    const blockId = pendingInsertBlockId.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id === blockId && b.type === 'text') {
        return { ...b, content: b.content + imgHtml + pendingAfterHTML.current };
      }
      return b;
    }));
    pendingAfterHTML.current = '';
    setShowImagePicker(false);
    setTimeout(() => blockRefs.current.get(blockId)?.focus(), 0);
  };

  const onLinkInsertConfirm = (url: string) => {
    const domain = getDomain(url);
    const insertAfterId = pendingInsertBlockId.current;
    const afterId = pendingNewAfterBlockId.current;
    const newCard: LinkBlockData = { type: 'link', id: genId(), url, domain, format: 'embed' };
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === insertAfterId);
      if (idx === -1) return [...prev, newCard];
      return [...prev.slice(0, idx + 1), newCard, ...prev.slice(idx + 1)];
    });
    setShowLinkInsert(false);
    pendingNewAfterBlockId.current = null;
    setTimeout(() => {
      const taId = afterId ?? insertAfterId;
      const ta = blockRefs.current.get(taId);
      if (ta) { ta.focus(); if ('textContent' in ta) setCaretOffset(ta as HTMLDivElement, 0); }
    }, 0);
  };

  const handleBlockPaste = (blockId: string, e: React.ClipboardEvent<HTMLDivElement>) => {
    const imageFile = Array.from(e.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (imageFile) {
      e.preventDefault();
      const file = imageFile.getAsFile();
      if (file) {
        const el = blockRefs.current.get(blockId) as HTMLDivElement | undefined;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = (reader.result as string).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          const imgHtml = `<img src="${dataUrl}" alt="image" style="max-width:100%;border-radius:6px;display:block;margin:4px 0;" />`;
          setBlocks((prev) => prev.map((b) => {
            if (b.id === blockId && b.type === 'text') {
              return { ...b, content: (el?.innerHTML ?? b.content) + imgHtml };
            }
            return b;
          }));
        };
        reader.readAsDataURL(file);
      }
      return;
    }
    const text = e.clipboardData.getData('text').trim();
    if (/^https?:\/\/[^\s]+$/.test(text)) {
      e.preventDefault();
      const el = blockRefs.current.get(blockId) as HTMLDivElement | undefined;
      if (!el) return;
      const start = getCaretOffset(el);
      document.execCommand('insertText', false, text);
      const end = start + text.length;
      setBlocks((prev) => prev.map((b) => b.id === blockId && b.type === 'text' ? { ...b, content: el.innerHTML } : b));
      pendingLinkRange.current = { blockId, start, end, url: text };
      setTimeout(() => setLinkPopover({ url: text }), 0);
    }
  };

  const handleLinkFormat = (format: LinkFormat) => {
    const pending = pendingLinkRange.current;
    if (!pending) { setLinkPopover(null); return; }
    const { blockId, start, end } = pending;
    const activeBlock = blocks.find((b) => b.id === blockId);
    if (!activeBlock || activeBlock.type !== 'text') { setLinkPopover(null); return; }
    const pastedUrl = pending.url;
    const domain = getDomain(pastedUrl);

    if (format === 'plain') {
      pendingLinkRange.current = null;
      setLinkPopover(null);
      return;
    }

    const el = blockRefs.current.get(blockId) as HTMLDivElement | undefined;
    const beforeContent = el ? extractHTMLBefore(el, start) : '';
    const afterContent = el ? extractHTMLAfter(el, end) : '';
    const newAfterId = genId();
    const newCard: LinkBlockData = { type: 'link', id: genId(), url: pastedUrl, domain, format };
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const updatedBefore: TextBlock = { type: 'text', id: blockId, content: beforeContent };
      const newAfter: TextBlock = { type: 'text', id: newAfterId, content: afterContent };
      return [...prev.slice(0, idx), updatedBefore, newCard, newAfter, ...prev.slice(idx + 1)];
    });
    pendingLinkRange.current = null;
    setLinkPopover(null);
    setTimeout(() => {
      const ta = blockRefs.current.get(newAfterId) as HTMLDivElement | undefined;
      if (ta) { ta.focus(); setCaretOffset(ta, 0); }
    }, 0);
  };

  const handleBlockMouseUp = () => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setBubblePos({ x: rect.left + rect.width / 2, y: rect.top });
      } else {
        setBubblePos(null);
      }
    }, 10);
  };

  const applyFormat = (type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'highlight' | 'textColor' | 'wl') => {
    const blockId = activeBlockId.current;
    const el = blockRefs.current.get(blockId) as HTMLDivElement | undefined;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const execMap: Record<string, string> = {
      bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough',
    };

    if (execMap[type]) {
      document.execCommand(execMap[type], false);
    } else if (type === 'code') {
      const selected = sel.toString();
      document.execCommand('insertHTML', false, `<code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:0.9em">${selected.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`);
    } else if (type === 'highlight') {
      const range = sel.getRangeAt(0);
      // Walk up from cursor to find an ancestor <mark>
      let markAncestor: Element | null = null;
      let n: Node | null = range.startContainer;
      while (n && n !== el) {
        if (n.nodeName === 'MARK') { markAncestor = n as Element; break; }
        n = n.parentNode;
      }

      if (markAncestor) {
        // Select the entire mark's content, then replace with plain text to remove it
        const r = document.createRange();
        r.selectNodeContents(markAncestor);
        sel.removeAllRanges();
        sel.addRange(r);
        const plain = (markAncestor.textContent ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        document.execCommand('insertHTML', false, plain);
      } else {
        // No mark ancestor — apply highlight
        const selected = sel.toString();
        document.execCommand('insertHTML', false, `<mark style="background:rgba(74,222,128,0.45);border-radius:2px;padding:1px 0">${selected.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</mark>`);
      }
    } else if (type === 'textColor') {
      const range = sel.getRangeAt(0);
      // Walk up from cursor to find a colored ancestor element
      let colorAncestor: HTMLElement | null = null;
      let cn: Node | null = range.startContainer;
      while (cn && cn !== el) {
        const ce = cn as HTMLElement;
        if (ce.style?.color) { colorAncestor = ce; break; }
        cn = cn.parentNode;
      }
      if (colorAncestor) {
        // Select entire colored element's content and replace with plain text
        const r = document.createRange();
        r.selectNodeContents(colorAncestor);
        sel.removeAllRanges();
        sel.addRange(r);
        const plain = (colorAncestor.textContent ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        document.execCommand('insertHTML', false, plain);
      } else {
        document.execCommand('foreColor', false, '#ef4444');
      }
    } else if (type === 'wl') {
      const range = sel.getRangeAt(0);
      // Remove all <mark> highlights within the selection
      const probe = document.createElement('div');
      probe.appendChild(range.cloneContents());
      if (probe.querySelector('mark')) {
        const extracted = range.extractContents();
        const tmp = document.createElement('div');
        tmp.appendChild(extracted);
        for (const mark of Array.from(tmp.querySelectorAll('mark'))) {
          const p = mark.parentNode;
          if (!p) continue;
          while (mark.firstChild) p.insertBefore(mark.firstChild, mark);
          p.removeChild(mark);
        }
        const frag = document.createDocumentFragment();
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
        range.insertNode(frag);
      }
      // Also check ancestor mark and unwrap it
      let mn: Node | null = range.startContainer;
      while (mn && mn !== el) {
        if (mn.nodeName === 'MARK') {
          const r2 = document.createRange();
          r2.selectNodeContents(mn);
          sel.removeAllRanges();
          sel.addRange(r2);
          const plain = (mn.textContent ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          document.execCommand('insertHTML', false, plain);
          break;
        }
        mn = mn.parentNode;
      }
      // Set text color to white
      document.execCommand('foreColor', false, '#ffffff');
    }

    setBlocks((prev) => prev.map((b) => b.id === blockId && b.type === 'text' ? { ...b, content: el.innerHTML } : b));
    setBubblePos(null);
  };

  const chip = (content: React.ReactNode) => (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11.5, padding: '2px 8px', borderRadius: 5,
        background: 'var(--eb-panel-2)', color: 'var(--eb-muted)',
        border: '1px dashed var(--eb-border)', cursor: 'pointer',
      }}
    >
      {content}
    </span>
  );

  const metaRow = (Icon: LucideIcon, label: string, value: React.ReactNode) => (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8,
        fontSize: 12.5, alignItems: 'center', padding: '3px 0',
        color: 'var(--eb-muted)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={12} style={{ flexShrink: 0 }} />
        <span>{label}</span>
      </div>
      <div>{value}</div>
    </div>
  );

  return (
    <div style={{ padding: '28px 60px 80px', maxWidth: 740, width: '100%', margin: '0 auto', position: 'relative' }}>
      {/* Cover */}
      <div
        style={{
          height: 120,
          borderRadius: 11,
          margin: '0 -20px 0',
          background: generateCoverBg(note.id),
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 14,
          overflow: 'hidden',
        }}
      >
        {/* Back button — top-left */}
        <button
          type="button"
          onClick={onBack}
          style={{
            position: 'absolute', top: 10, left: 14, zIndex: 2,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(10,14,20,.60)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.10)',
            color: '#fff', cursor: 'pointer',
          }}
          title="Back"
        >
          <ArrowLeft size={13} />
        </button>

      </div>

      {/* Icon badge — overlaps cover bottom */}
      <div
        style={{
          width: 64, height: 64, borderRadius: 12,
          background: 'var(--eb-bg)',
          border: `1px solid ${noteFg}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -32, marginBottom: 10,
          position: 'relative', zIndex: 2, cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,.35)',
        }}
      >
        <NoteIcon size={28} style={{ color: noteFg }} />
      </div>

      {/* Folder breadcrumb under the badge */}
      {noteFolder && (
        <button
          type="button"
          onClick={() => onFolderClick(noteFolder.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5,
            color: 'var(--eb-muted)', marginBottom: 10,
            background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <noteFolder.Icon size={10} style={{ color: noteFolder.iconColor, flexShrink: 0 }} />
          <span>{noteFolder.label}</span>
        </button>
      )}

      {/* Title + save indicator */}
      <div style={{ position: 'relative' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled note"
          style={{
            fontSize: 32, fontWeight: 700, letterSpacing: '-.02em',
            color: title ? 'var(--eb-text)' : 'rgba(122,131,149,.45)',
            background: 'transparent', border: 0, width: '100%',
            outline: 0, padding: 0, margin: '0 0 16px', fontFamily: 'inherit',
          }}
        />
        {saveState !== 'idle' && (
          <span style={{
            position: 'absolute', bottom: 20, right: 0,
            fontSize: 11, color: 'var(--eb-muted)',
            transition: 'opacity .3s',
          }}>
            {saveState === 'saving' ? 'Saving…' : 'Saved'}
          </span>
        )}
      </div>

      {/* Meta rows */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 4 }}>
        {metaRow(
          Folders, 'Folder',
          <button
            type="button"
            onClick={() => noteFolder && onFolderClick(noteFolder.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11.5, padding: '2px 8px', borderRadius: 5,
              background: 'var(--eb-panel-2)', color: 'var(--eb-muted)',
              border: '1px dashed var(--eb-border)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {noteFolder ? (
              <>
                <noteFolder.Icon size={10} style={{ color: noteFolder.iconColor }} />
                {noteFolder.label}
              </>
            ) : 'Choose folder'}
          </button>,
        )}
        {metaRow(Tag, 'Tags', (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {tags.map((t) => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 11.5, padding: '2px 7px', borderRadius: 5,
                background: 'rgba(20,184,166,.15)', color: '#2dd4bf',
                border: '1px solid rgba(20,184,166,.35)',
              }}>
                {t}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, lineHeight: 1, color: 'inherit', opacity: .7 }}
                >
                  <X size={9} />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/,/g, '');
                  if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
                  setTagInput('');
                } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                  setTags((prev) => prev.slice(0, -1));
                }
              }}
              placeholder={tags.length === 0 ? 'Add tag…' : '+'}
              style={{
                background: 'none', border: 0, outline: 0, fontSize: 11.5,
                color: 'var(--eb-muted)', fontFamily: 'inherit', padding: '2px 2px',
                width: tagInput ? `${tagInput.length + 2}ch` : tags.length === 0 ? '7ch' : '3ch',
                minWidth: 0,
              }}
            />
          </div>
        ))}
        {metaRow(Target, 'Playbook', (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowPlaybookMenu((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11.5, padding: '2px 8px', borderRadius: 5,
                background: linkedPlaybook ? 'rgba(139,92,246,.15)' : 'var(--eb-panel-2)',
                color: linkedPlaybook ? '#a78bfa' : 'var(--eb-muted)',
                border: linkedPlaybook ? '1px solid rgba(139,92,246,.35)' : '1px dashed var(--eb-border)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {linkedPlaybook ? <><Target size={10} /> {linkedPlaybook.name}</> : <><Plus size={10} /> Link a playbook</>}
            </button>
            {linkedPlaybook && (
              <button
                type="button"
                onClick={() => setPlaybookId(null)}
                style={{ background: 'none', border: 0, cursor: 'pointer', padding: '0 2px', color: 'var(--eb-muted)', verticalAlign: 'middle' }}
              >
                <X size={10} />
              </button>
            )}
            {showPlaybookMenu && (
              <div
                style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
                  background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
                  borderRadius: 8, padding: 4, minWidth: 200, maxHeight: 220, overflowY: 'auto',
                  boxShadow: '0 4px 16px rgba(0,0,0,.25)',
                }}
              >
                {(!playbooks || playbooks.length === 0) ? (
                  <div style={{ fontSize: 12, color: 'var(--eb-muted)', padding: '8px 10px' }}>No playbooks yet</div>
                ) : playbooks.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPlaybookId(p.id); setShowPlaybookMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '6px 10px', borderRadius: 5, border: 0,
                      background: p.id === playbookId ? 'rgba(139,92,246,.15)' : 'transparent',
                      color: p.id === playbookId ? '#a78bfa' : 'var(--eb-text)',
                      fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {metaRow(BookOpen, 'Linked trade', chip(<><Plus size={10} /> Link a trade</>))}
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '20px 0' }} />

      {/* Body */}
      <div style={{ position: 'relative', minHeight: 400 }}>
        {blocks.every((b) => b.type !== 'text' || b.content === '') && !bodyFocused && (
          <button
            type="button"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
              fontSize: 14, color: 'var(--eb-muted)', cursor: 'text',
              lineHeight: 1.7, background: 'none', border: 0, padding: 0,
              textAlign: 'left', fontFamily: 'inherit',
            }}
            onClick={() => {
              setBodyFocused(true);
              const firstText = blocks.find((b) => b.type === 'text');
              if (firstText) blockRefs.current.get(firstText.id)?.focus();
            }}
          >
            Type&nbsp;
            <kbd style={{ fontSize: 10.5, padding: '1px 5px', border: '1px solid var(--eb-border)', borderRadius: 4 }}>
              /
            </kbd>
            &nbsp;for blocks · paste image · drop file · or just start writing
          </button>
        )}

        {blocks.map((block) => {
          const inputRef = (el: HTMLInputElement | null) => {
            if (el) blockRefs.current.set(block.id, el);
            else blockRefs.current.delete(block.id);
          };
          const sharedInputStyle: React.CSSProperties = {
            flex: 1, background: 'transparent', border: 0, outline: 0,
            color: 'var(--eb-text)', fontSize: 14, fontFamily: 'inherit',
            lineHeight: 1.7, padding: 0,
          };
          const focusHandlers = {
            onFocus: () => { setBodyFocused(true); activeBlockId.current = block.id; },
            onBlur: () => setBodyFocused(false),
          };

          if (block.type === 'link') {
            return (
              <LinkCard
                key={block.id}
                block={block}
                onRemove={() =>
                  setBlocks((prev) => {
                    const idx = prev.findIndex((b) => b.id === block.id);
                    if (idx === -1) return prev;
                    const before = prev[idx - 1];
                    const after = prev[idx + 1];
                    if (before?.type === 'text' && after?.type === 'text') {
                      const merged: TextBlock = { type: 'text', id: before.id, content: before.content + after.content };
                      return [...prev.slice(0, idx - 1), merged, ...prev.slice(idx + 2)];
                    }
                    return prev.filter((b) => b.id !== block.id);
                  })
                }
              />
            );
          }

          if (block.type === 'h1' || block.type === 'h2') {
            return (
              <input
                key={block.id}
                ref={inputRef}
                type="text"
                value={block.content}
                placeholder={block.type === 'h1' ? 'Heading 1' : 'Heading 2'}
                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                onKeyDown={(e) => handleHeadingKeyDown(block.id, e)}
                onMouseUp={handleBlockMouseUp}
                {...focusHandlers}
                style={{
                  display: 'block', width: '100%', background: 'transparent', border: 0, outline: 0,
                  fontFamily: 'inherit', padding: 0,
                  fontSize: block.type === 'h1' ? 26 : 20,
                  fontWeight: 700,
                  letterSpacing: '-.02em',
                  lineHeight: 1.3,
                  color: block.content ? 'var(--eb-text)' : 'var(--eb-muted)',
                  margin: block.type === 'h1' ? '16px 0 4px' : '12px 0 4px',
                }}
              />
            );
          }

          if (block.type === 'bullet') {
            return (
              <div key={block.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '1px 0' }}>
                <span style={{ color: 'var(--eb-muted)', lineHeight: 1.7, fontSize: 16, flexShrink: 0, userSelect: 'none', paddingTop: 1 }}>•</span>
                <textarea
                  ref={(el) => {
                    if (el) {
                      blockRefs.current.set(block.id, el);
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    } else {
                      blockRefs.current.delete(block.id);
                    }
                  }}
                  value={block.content}
                  rows={1}
                  placeholder="List item"
                  onChange={(e) => {
                    updateBlockContent(block.id, e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => handleListKeyDown(block.id, e)}
                  onMouseUp={handleBlockMouseUp}
                  {...focusHandlers}
                  style={{ ...sharedInputStyle, resize: 'none', overflow: 'hidden' }}
                />
              </div>
            );
          }

          if (block.type === 'todo') {
            return (
              <div key={block.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '1px 0' }}>
                <input
                  type="checkbox"
                  checked={block.checked}
                  onChange={(e) => setBlocks((prev) => prev.map((b) => b.id === block.id && b.type === 'todo' ? { ...b, checked: e.target.checked } : b))}
                  style={{ marginTop: 5, flexShrink: 0, accentColor: 'var(--green)', cursor: 'pointer', width: 14, height: 14 }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={block.content}
                  placeholder="To-do"
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  onKeyDown={(e) => handleListKeyDown(block.id, e)}
                  onMouseUp={handleBlockMouseUp}
                  {...focusHandlers}
                  style={{
                    ...sharedInputStyle,
                    color: block.checked ? 'var(--eb-muted)' : 'var(--eb-text)',
                    textDecoration: block.checked ? 'line-through' : 'none',
                  }}
                />
              </div>
            );
          }

          if (block.type === 'callout') {
            const CALLOUT_STYLES: Record<CalloutBlock['variant'], { bg: string; border: string; icon: string }> = {
              info: { bg: 'rgba(6,182,212,.08)', border: 'rgba(6,182,212,.30)', icon: '💡' },
              warn: { bg: 'rgba(245,165,36,.08)', border: 'rgba(245,165,36,.30)', icon: '⚠️' },
              tip:  { bg: 'rgba(139,92,246,.08)', border: 'rgba(139,92,246,.30)', icon: '✨' },
            };
            const cs = CALLOUT_STYLES[block.variant];
            return (
              <div
                key={block.id}
                style={{
                  display: 'flex', gap: 12, padding: '12px 14px',
                  borderRadius: 9, margin: '6px 0',
                  background: cs.bg, border: `1px solid ${cs.border}`,
                  fontSize: 13.5, lineHeight: 1.6,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.6, userSelect: 'none', marginTop: 1 }}>{cs.icon}</span>
                <textarea
                  ref={(el) => {
                    if (el) { blockRefs.current.set(block.id, el); el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
                    else blockRefs.current.delete(block.id);
                  }}
                  value={block.content}
                  placeholder="Write something…"
                  rows={1}
                  onChange={(e) => {
                    updateBlockContent(block.id, e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    const idx2 = blocks.findIndex((b) => b.id === block.id);
                    const ta = e.currentTarget;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      // Empty callout → exit to new text block; otherwise newline
                      if (!block.content.trim()) {
                        e.preventDefault();
                        focusPrev(block.id);
                      }
                      // default: inserts newline via browser
                    } else if (e.key === 'Backspace' && !block.content) {
                      e.preventDefault();
                      focusPrev(block.id);
                    } else if (e.key === 'ArrowUp' && idx2 > 0 && !(ta.value.slice(0, ta.selectionStart ?? 0).includes('\n'))) {
                      e.preventDefault();
                      const prevId = (blocks[idx2 - 1] as Block | undefined)?.id;
                      if (prevId) setTimeout(() => blockRefs.current.get(prevId)?.focus(), 0);
                    } else if (e.key === 'ArrowDown' && idx2 < blocks.length - 1 && !(ta.value.slice(ta.selectionStart ?? ta.value.length).includes('\n'))) {
                      e.preventDefault();
                      const nextId = (blocks[idx2 + 1] as Block | undefined)?.id;
                      if (nextId) setTimeout(() => blockRefs.current.get(nextId)?.focus(), 0);
                    }
                  }}
                  onMouseUp={handleBlockMouseUp}
                  {...focusHandlers}
                  style={{
                    flex: 1, background: 'transparent', border: 0, outline: 0,
                    color: 'var(--eb-text)', fontSize: 13.5,
                    fontFamily: 'inherit', lineHeight: 1.6, padding: 0,
                    resize: 'none', overflow: 'hidden',
                  }}
                />
              </div>
            );
          }

          // type === 'text'
          return (
            <div
              key={block.id}
              contentEditable
              suppressContentEditableWarning
              ref={(el) => {
                if (!el) { blockRefs.current.delete(block.id); return; }
                blockRefs.current.set(block.id, el);
                if (el.innerHTML !== block.content) {
                  el.innerHTML = block.content || '';
                }
              }}
              onInput={(e) => handleBlockInput(block.id, e.currentTarget as HTMLDivElement)}
              onKeyDown={(e) => handleBlockKeyDown(block.id, e)}
              onPaste={(e) => handleBlockPaste(block.id, e)}
              onMouseUp={handleBlockMouseUp}
              {...focusHandlers}
              style={{
                width: '100%', outline: 0,
                background: 'transparent',
                color: 'var(--eb-text)', fontSize: 14,
                fontFamily: 'inherit', lineHeight: 1.7,
                minHeight: '1.5em', wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            />
          );
        })}

        {/* Slash menu — rendered inside position:relative so `top:28` is relative to textarea */}
        {showSlash && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 19 }}
              onClick={() => setShowSlash(false)}
              onKeyDown={(e) => e.key === 'Escape' && setShowSlash(false)}
              role="button"
              tabIndex={-1}
              aria-label="Close menu"
            />
            <div
              style={(() => {
                const spaceBelow = window.innerHeight - slashMenuPos.anchorBottom;
                const openUp = spaceBelow < 380 && slashMenuPos.anchorTop > 200;
                return {
                  position: 'fixed' as const,
                  ...(openUp
                    ? { bottom: window.innerHeight - slashMenuPos.anchorTop + 4 }
                    : { top: slashMenuPos.anchorBottom }),
                  left: Math.min(slashMenuPos.x, window.innerWidth - 356),
                  width: 340, zIndex: 20,
                  background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
                  borderRadius: 11, boxShadow: '0 20px 50px rgba(0,0,0,.45)',
                  overflow: 'hidden',
                };
              })()}
          >
            {/* Query header */}
            <div
              style={{
                padding: '7px 10px', borderBottom: '1px solid var(--eb-border)',
                fontFamily: 'monospace', fontSize: 12.5, color: 'var(--eb-muted)',
              }}
            >
              Type to filter ·{' '}
              <span style={{ color: 'var(--green)' }}>/{slashQuery}</span>
            </div>

            {/* Items */}
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
              {slashFilteredGroups.length === 0 ? (
                <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--eb-muted)', textAlign: 'center' }}>
                  No blocks match &ldquo;{slashQuery}&rdquo;
                </div>
              ) : slashFilteredGroups.map(({ group, items }) => (
                <div key={group}>
                  <div
                    style={{
                      fontSize: 9.5, letterSpacing: '.08em', color: 'var(--eb-muted)',
                      textTransform: 'uppercase', padding: '8px 10px 4px', fontWeight: 600,
                    }}
                  >
                    {group}
                  </div>
                  {items.map(({ id, label, desc, kbd, Icon: ItemIcon, iconText }) => {
                    const idx = slashFlatItems.findIndex((it) => it.id === id);
                    const isActive = idx === slashCursor;
                    return (
                      <button
                        key={id}
                        type="button"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                          fontSize: 13, width: '100%', textAlign: 'left',
                          background: isActive ? 'var(--eb-panel-2)' : 'transparent',
                          border: 0, fontFamily: 'inherit', color: 'var(--eb-text)',
                        }}
                        onMouseEnter={() => setSlashCursor(idx)}
                        onClick={() => insertBlock(id)}
                      >
                        <div
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: 'var(--eb-panel-2)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: iconText ? 10 : 14, fontWeight: iconText ? 700 : undefined,
                            color: 'var(--eb-muted-2)',
                          }}
                        >
                          {iconText ? iconText : (ItemIcon ? <ItemIcon size={14} /> : null)}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>
                          {desc && <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{desc}</div>}
                        </div>
                        {kbd && (
                          <span
                            style={{
                              fontSize: 10, padding: '1px 5px',
                              border: '1px solid var(--eb-border)', borderRadius: 4,
                              color: 'var(--eb-muted)', fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >
                            {kbd}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '5px 10px', borderTop: '1px solid var(--eb-border)',
                fontSize: 10.5, color: 'var(--eb-muted)',
                display: 'flex', justifyContent: 'space-between',
                background: 'var(--eb-panel-2)',
              }}
            >
              <span>
                <kbd style={{ padding: '1px 4px', border: '1px solid var(--eb-border)', borderRadius: 3, marginRight: 2, fontFamily: 'inherit' }}>↑</kbd>
                <kbd style={{ padding: '1px 4px', border: '1px solid var(--eb-border)', borderRadius: 3, marginRight: 5, fontFamily: 'inherit' }}>↓</kbd>
                navigate ·{' '}
                <kbd style={{ padding: '1px 4px', border: '1px solid var(--eb-border)', borderRadius: 3, marginRight: 3, fontFamily: 'inherit' }}>↵</kbd>
                insert
              </span>
              <span>
                <kbd style={{ padding: '1px 4px', border: '1px solid var(--eb-border)', borderRadius: 3, fontFamily: 'inherit' }}>esc</kbd>
                {' '}close
              </span>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Image picker dialog */}
      {showImagePicker && (
        <ImagePickerPanel
          onConfirm={onImageConfirm}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Link insert dialog (from /link slash command) */}
      {showLinkInsert && (
        <LinkInsertPanel
          onConfirm={onLinkInsertConfirm}
          onClose={() => { setShowLinkInsert(false); setTimeout(() => blockRefs.current.get(activeBlockId.current)?.focus(), 0); }}
        />
      )}

      {/* Link paste popover */}
      {linkPopover && (
        <LinkPopover
          url={linkPopover.url}
          onChoose={handleLinkFormat}
          onDismiss={() => { setLinkPopover(null); pendingLinkRange.current = null; }}
        />
      )}

      {/* Bubble formatting toolbar */}
      {bubblePos && !showSlash && (
        <BubbleToolbar
          position={bubblePos}
          onFormat={applyFormat}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotesClient() {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<LibraryNote | null>(null);
  const [search, setSearch] = useState('');
  const [railOpen, setRailOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFolder, setDialogFolder] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const moveNote = useMoveNote();
  const pinNote = usePinNote();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target as HTMLElement).isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearch('');
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openNewNote = (folderId?: string | null) => {
    setDialogFolder(folderId ?? null);
    setDialogOpen(true);
  };

  const handleCreateNote = (note: CreateNoteInput) => {
    createNote.mutate(note, {
      onSuccess: (created) => {
        setActiveFolder(created.folderId);
        setDialogOpen(false);
      },
    });
  };

  const folderNotes = activeFolder
    ? activeFolder === 'recent'
      ? notes
      : activeFolder === 'pinned'
      ? notes.filter((n) => n.pinned)
      : notes.filter((n) => n.folderId === activeFolder)
    : notes;

  const activeFolderNotes = search.trim()
    ? (() => {
        const q = search.trim().toLowerCase();
        return folderNotes.filter((n) =>
          n.name.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.bodyMd.toLowerCase().includes(q),
        );
      })()
    : folderNotes;

  const activeLabel =
    [...QUICK_FOLDERS, ...FOLDERS].find((f) => f.id === activeFolder)?.label ?? 'All notes';

  const quickFoldersWithCount = QUICK_FOLDERS.map((f) => ({
    ...f,
    count:
      f.id === 'recent' ? notes.length :
      f.id === 'pinned' ? notes.filter((n) => n.pinned).length :
      0,
  }));

  const foldersWithCount = FOLDERS.map((f) => ({
    ...f,
    count: notes.filter((n) => n.folderId === f.id).length,
  }));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 53px)', overflow: 'hidden' }}>
      <style>{'@keyframes sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
      {/* ── Folder tree ─────────────────────────────────────────────────── */}
      <aside
        style={{
          width: treeOpen ? 252 : 0,
          flexShrink: 0,
          background: 'var(--eb-panel)',
          borderRight: treeOpen ? '1px solid var(--eb-border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width .2s ease',
        }}
      >
        <div style={{ width: 252, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Tree header */}
          <div
            style={{
              padding: '11px 10px 9px',
              borderBottom: '1px solid var(--eb-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              position: 'sticky',
              top: 0,
              background: 'var(--eb-panel)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Library size={13} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
              <button
                type="button"
                onClick={() => { setActiveFolder(null); setActiveNote(null); }}
                style={{ fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--eb-text)', background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Library
                {notesLoading ? (
                  <Sk w={18} h={10} r={4} />
                ) : notes.length > 0 ? (
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 5px', borderRadius: 10, background: 'rgba(0,214,143,.12)', color: 'var(--green)', border: '1px solid rgba(0,214,143,.25)' }}>
                    {notes.length}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => openNewNote()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '3px 8px',
                  borderRadius: 5,
                  border: '1px solid #00b67a',
                  background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                  color: '#06140f',
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Plus size={10} /> New
              </button>
              <button
                type="button"
                onClick={() => setTreeOpen(false)}
                title="Close sidebar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  borderRadius: 5,
                  border: 0,
                  background: 'transparent',
                  color: 'var(--eb-muted)',
                  cursor: 'pointer',
                }}
              >
                <PanelLeftClose size={13} />
              </button>
            </div>

            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--eb-panel-2)',
                border: `1px solid ${search ? 'rgba(0,214,143,.4)' : 'var(--eb-border)'}`,
                padding: '4px 8px',
                borderRadius: 6,
                color: 'var(--eb-muted)',
                transition: 'border-color .15s',
              }}
            >
              <Search size={10} style={{ flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  color: 'var(--eb-text)',
                  fontSize: 11.5,
                  fontFamily: 'inherit',
                }}
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--eb-muted)', lineHeight: 1 }}
                >
                  <X size={11} />
                </button>
              ) : (
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 4px',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 3,
                    color: 'var(--eb-muted)',
                  }}
                >
                  /
                </span>
              )}
            </div>
          </div>

          {/* Tree body */}
          <div style={{ padding: '6px 4px 60px', flex: 1, overflowY: 'auto' }}>
            <SectionLabel>Quick</SectionLabel>
            {quickFoldersWithCount.map((f) => (
              <FolderRow
                key={f.id}
                folder={f}
                active={activeFolder === f.id}
                onClick={() => { setActiveFolder(f.id); setActiveNote(null); }}
                isLoading={notesLoading}
              />
            ))}

            <SectionLabel>
              Folders
              <button
                type="button"
                onClick={() => openNewNote()}
                style={{
                  background: 'none',
                  border: 0,
                  color: 'var(--eb-muted-2)',
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: 1,
                  display: 'flex',
                }}
              >
                <Plus size={12} />
              </button>
            </SectionLabel>
            {foldersWithCount.map((f) => (
              <FolderRow
                key={f.id}
                folder={f}
                active={activeFolder === f.id}
                onClick={() => { setActiveFolder(f.id); setActiveNote(null); }}
                isLoading={notesLoading}
              />
            ))}

            <SectionLabel>Tags</SectionLabel>
            <div
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--eb-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontStyle: 'italic',
              }}
            >
              <Tag size={10} style={{ opacity: 0.5 }} /> No tags yet
            </div>
          </div>
        </div>
      </aside>

      {/* ── Editor / empty state ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: 'var(--eb-bg)',
        }}
      >
        {/* Editor topbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 22px',
            borderBottom: '1px solid var(--eb-border)',
            background: 'var(--eb-bg)',
            position: 'sticky',
            top: 0,
            zIndex: 3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!treeOpen && (
              <button
                type="button"
                onClick={() => setTreeOpen(true)}
                title="Open sidebar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 6px',
                  borderRadius: 6,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-muted-2)',
                  cursor: 'pointer',
                }}
              >
                <PanelLeftOpen size={13} />
              </button>
            )}
            <span style={{ color: 'var(--eb-muted)', fontSize: 12 }}>
              <button
                type="button"
                onClick={() => { setActiveFolder(null); setActiveNote(null); }}
                style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--eb-muted)', fontSize: 12, fontFamily: 'inherit' }}
              >
                Library
              </button>
              {' / '}
              {activeNote ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveNote(null)}
                    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--eb-muted)', fontSize: 12, fontFamily: 'inherit' }}
                  >
                    {activeLabel}
                  </button>
                  {' / '}
                  <strong style={{ color: 'var(--eb-text)' }}>{activeNote.name || 'Untitled note'}</strong>
                </>
              ) : (
                <strong style={{ color: 'var(--eb-text)' }}>
                  {activeFolder ? activeLabel : 'All notes'}
                </strong>
              )}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setRailOpen((v) => !v)}
              title={railOpen ? 'Close panel' : 'Open panel'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px 7px',
                borderRadius: 7,
                border: `1px solid ${railOpen ? 'rgba(0,214,143,.35)' : 'var(--eb-border)'}`,
                background: railOpen ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
                color: railOpen ? 'var(--green)' : 'var(--eb-muted-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background .12s, border-color .12s, color .12s',
              }}
            >
              {railOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </button>
          </div>
        </div>

        {/* Note editor — shown when a note card is clicked */}
        {activeNote ? (
          <NoteEditor
            note={activeNote}
            onBack={() => setActiveNote(null)}
            onFolderClick={(folderId) => { setActiveFolder(folderId); setActiveNote(null); }}
          />
        ) : notesLoading || activeFolder !== null || notes.length > 0 ? (
          <FolderNoteList
            key={`${activeFolder ?? 'all'}::${search.trim()}`}
            notes={activeFolderNotes}
            folder={[...QUICK_FOLDERS, ...FOLDERS].find((f) => f.id === activeFolder) ?? null}
            folderLabel={activeLabel}
            onNewNote={() => openNewNote(activeFolder)}
            isLoading={notesLoading}
            onDelete={(id) => deleteNote.mutate(id)}
            onMove={(id, folderId) => moveNote.mutate({ id, folderId })}
            onPin={(id, pinned) => pinNote.mutate({ id, pinned })}
            onNoteClick={(note) => setActiveNote(note)}
            searchQuery={search.trim()}
          />
        ) : (
          /* First-time empty state / hero */
          <div
            style={{
              padding: '32px 60px 80px',
              maxWidth: 880,
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            {/* Hero */}
            <div style={{ textAlign: 'center', padding: '20px 24px 8px' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  background: 'linear-gradient(135deg,rgba(0,214,143,.15),rgba(6,182,212,.10))',
                  border: '1px solid rgba(0,214,143,.20)',
                }}
              >
                <Library size={32} style={{ color: 'var(--green)' }} />
              </div>
              <h1
                style={{
                  fontSize: 26,
                  letterSpacing: '-.015em',
                  margin: '0 0 10px',
                  fontWeight: 600,
                  color: 'var(--eb-text)',
                }}
              >
                Your trading Brain
              </h1>
              <p
                style={{
                  color: 'var(--eb-muted-2)',
                  fontSize: 14,
                  margin: '0 auto 20px',
                  maxWidth: 560,
                  lineHeight: 1.65,
                }}
              >
                Faster than Notion, smarter than Apple Notes — because it knows your trades. Capture
                setup research, document lessons from losses, and turn observations into playbooks.
                Every note can link to the real trades that prove (or disprove) it.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => openNewNote()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #00b67a',
                    background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                    color: '#06140f',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Plus size={14} /> Create your first note
                </button>
              </div>
            </div>

            {/* What you'll use notes for */}
            <div>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--eb-muted-2)',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                }}
              >
                What you&apos;ll use notes for
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {USE_CASES.map((u) => {
                  const { Icon } = u;
                  return (
                    <div
                      key={u.title}
                      style={{
                        padding: '13px 14px',
                        border: '1px solid var(--eb-border)',
                        borderRadius: 10,
                        background: 'var(--eb-panel)',
                        display: 'flex',
                        gap: 11,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: u.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} style={{ color: u.iconColor }} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 3,
                            color: 'var(--eb-text)',
                          }}
                        >
                          {u.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.55 }}>
                          {u.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating right rail ──────────────────────────────────────────── */}
      {railOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 19 }}
            onClick={() => setRailOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setRailOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close panel"
          />
          <aside
            style={{
              position: 'fixed',
              right: 0,
              top: 53,
              bottom: 0,
              width: 'min(340px, 50%)',
              background: 'var(--eb-panel)',
              borderLeft: '1px solid var(--eb-border)',
              boxShadow: '-12px 0 40px rgba(0,0,0,.35)',
              zIndex: 20,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRailOpen(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--eb-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 4,
                  borderRadius: 5,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* AI card */}
            <div
              style={{
                padding: '11px 12px',
                borderRadius: 9,
                background: 'linear-gradient(180deg,rgba(139,92,246,.10),rgba(6,182,212,.04))',
                border: '1px solid rgba(139,92,246,.30)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={11} style={{ color: '#fff' }} />
                </div>
                AI · ready when you are
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--eb-muted-2)', lineHeight: 1.55 }}>
                Once you have at least one note, AI can summarize, link to relevant trades, generate
                playbooks, and suggest follow-up notes from your trading data.
              </div>
            </div>

            {/* Backlinks */}
            <section>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--eb-muted-2)',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Network size={11} /> Backlinks
              </h3>
              <MicroEmpty
                icon={<Network size={20} />}
                text="No notes yet, so nothing references each other. Backlinks appear when one note mentions another by name."
              />
            </section>

            {/* Linked trades */}
            <section>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--eb-muted-2)',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Link2 size={11} /> Linked trades
              </h3>
              <MicroEmpty
                icon={<BookOpen size={20} />}
                text="Notes that link real trades show up here."
                cta={{ label: 'Link a trade', Icon: Plus }}
              />
            </section>

            {/* Attachments */}
            <section>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--eb-muted-2)',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Paperclip size={11} /> Attachments
              </h3>
              <MicroEmpty
                icon={<Paperclip size={20} />}
                text="Drop a screenshot, paste from clipboard, or attach a file."
                cta={{ label: 'Add attachment', Icon: Paperclip }}
              />
            </section>
          </aside>
        </>
      )}

      {/* ── New note dialog ──────────────────────────────────────────────── */}
      {dialogOpen && (
        <NewNoteDialog
          defaultFolder={dialogFolder}
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreateNote}
        />
      )}
    </div>
  );
}
