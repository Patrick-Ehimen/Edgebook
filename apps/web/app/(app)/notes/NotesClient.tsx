'use client';

import { type LibraryNote, useCreateNote, useDeleteNote, useMoveNote, useNotes, usePinNote } from '@/features/notes';
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
      { id: 'image', label: 'Image',        desc: 'Upload, paste, or drop',            Icon: ImageIcon },
      { id: 'link',  label: 'Link preview', desc: 'Embed an article or video',         Icon: Link2 },
      { id: 'trade', label: 'Trade embed',  desc: 'Pull in a trade by symbol or ID',   Icon: BookOpen },
    ],
  },
  {
    group: 'Format',
    items: [
      { id: 'toggle',   label: 'Toggle',     desc: 'Collapsible section',           Icon: ChevronRight },
      { id: 'callout',  label: 'Callout',    desc: 'Tip · warn · info',             Icon: Lightbulb },
      { id: 'table',    label: 'Table',                                              Icon: Table },
      { id: 'code',     label: 'Code block', desc: 'DSL · JSON · SQL · TS',         Icon: Code2 },
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
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 9,
        border: '1px solid var(--eb-border)', background: 'var(--eb-panel)',
      }}
    >
      <Sk w={32} h={32} r={7} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Sk w="60%" h={12} />
        <Sk w="35%" h={10} />
      </div>
      <Sk w={36} h={10} r={4} />
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
}) {
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const FolderIcon = folder?.Icon ?? Library;
  const folderColor = folder?.iconColor ?? 'var(--green)';
  const isPinnedFolder = folder?.id === 'pinned';

  return (
    <div style={{ padding: '28px 36px 80px', maxWidth: 740, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => <NoteCardSkeleton key={i} />)}
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
            <FolderIcon size={24} style={{ color: folderColor }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
            {isPinnedFolder ? 'No pinned notes yet' : `Nothing in ${folderLabel} yet`}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', maxWidth: 340, lineHeight: 1.6 }}>
            {isPinnedFolder
              ? 'Right-click any note and choose Pin note to surface it here for quick access.'
              : 'Create your first note here — capture ideas, research, or lessons and they\'ll appear in this folder.'}
          </div>
          {!isPinnedFolder && (
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
        /* Note cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notes.map((note) => {
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
                  display: 'flex', alignItems: 'center', gap: 13,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel)',
                  cursor: 'pointer',
                  transition: 'background .1s, border-color .1s',
                  borderLeft: `3px solid ${noteFg}`,
                }}
              >
                <div
                  style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: noteBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <NoteIcon size={15} style={{ color: noteFg }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--eb-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {note.name}
                  </div>
                  {!folder && noteFolder && (
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <noteFolder.Icon size={9} style={{ color: noteFolder.iconColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', whiteSpace: 'nowrap' }}>{noteFolder.label}</span>
                    </div>
                  )}
                </div>
                {note.pinned && (
                  <Pin size={11} style={{ color: '#f5a524', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', flexShrink: 0 }}>{relativeDate(note.createdAt)}</span>
              </div>
            );
          })}
        </div>
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

// ─── Note editor ─────────────────────────────────────────────────────────────

function NoteEditor({ note, onBack, onFolderClick }: { note: LibraryNote; onBack: () => void; onFolderClick: (folderId: string) => void }) {
  const [title, setTitle] = useState(note.name);
  const [body, setBody] = useState(note.bodyMd);
  const [bodyFocused, setBodyFocused] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const noteFolder = [...QUICK_FOLDERS, ...FOLDERS].find((f) => f.id === note.folderId);
  const iconEntry = NOTE_ICONS.find((i) => i.id === note.iconId);
  const NoteIcon = iconEntry?.Icon ?? FileText;
  const noteFg = iconEntry?.fg ?? '#6495ed';
  const noteBg = iconEntry?.bg ?? 'rgba(100,149,237,.15)';

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBody(val);
    const lines = val.split('\n');
    setShowSlash(lines[lines.length - 1] === '/');
  };

  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') setShowSlash(false);
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

      {/* Title */}
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
        {metaRow(Tag, 'Tags', chip(<><Plus size={10} /> Add tag</>))}
        {metaRow(Target, 'Playbook', chip(<><Plus size={10} /> Link a playbook</>))}
        {metaRow(BookOpen, 'Linked trade', chip(<><Plus size={10} /> Link a trade</>))}
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '20px 0' }} />

      {/* Body */}
      <div style={{ position: 'relative' }}>
        {!body && !bodyFocused && (
          <button
            type="button"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
              fontSize: 14, color: 'var(--eb-muted)', cursor: 'text',
              lineHeight: 1.7, background: 'none', border: 0, padding: 0,
              textAlign: 'left', fontFamily: 'inherit',
            }}
            onClick={() => { setBodyFocused(true); bodyRef.current?.focus(); }}
          >
            Type&nbsp;
            <kbd
              style={{
                fontSize: 10.5, padding: '1px 5px',
                border: '1px solid var(--eb-border)', borderRadius: 4,
              }}
            >
              /
            </kbd>
            &nbsp;for blocks · paste image · drop file · or just start writing
          </button>
        )}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={handleBodyChange}
          onFocus={() => setBodyFocused(true)}
          onBlur={() => { setBodyFocused(false); }}
          onKeyDown={handleBodyKeyDown}
          style={{
            width: '100%', minHeight: 400, resize: 'none',
            background: 'transparent', border: 0, outline: 0,
            color: 'var(--eb-text)', fontSize: 14,
            fontFamily: 'inherit', lineHeight: 1.7,
            padding: 0, position: 'relative', zIndex: 2,
          }}
        />
      </div>

      {/* Slash menu */}
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
            style={{
              position: 'absolute', top: bodyRef.current ? bodyRef.current.offsetTop + 28 : 240,
              left: 0, width: 340, zIndex: 20,
              background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
              borderRadius: 11, boxShadow: '0 20px 50px rgba(0,0,0,.45)',
              padding: 6, maxHeight: 340, overflowY: 'auto',
            }}
          >
            {SLASH_GROUPS.map(({ group, items }) => (
              <div key={group}>
                <div
                  style={{
                    fontSize: 9.5, letterSpacing: '.08em', color: 'var(--eb-muted)',
                    textTransform: 'uppercase', padding: '8px 10px 4px', fontWeight: 600,
                  }}
                >
                  {group}
                </div>
                {items.map(({ id, label, desc, kbd, Icon: ItemIcon, iconText }) => (
                  <button
                    key={id}
                    type="button"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                      fontSize: 13, width: '100%', textAlign: 'left',
                      background: 'transparent', border: 0, fontFamily: 'inherit',
                      color: 'var(--eb-text)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--eb-panel-2)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    onClick={() => {
                      setBody((prev) => prev.slice(0, -1));
                      setShowSlash(false);
                      bodyRef.current?.focus();
                    }}
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
                ))}
              </div>
            ))}
          </div>
        </>
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

  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const moveNote = useMoveNote();
  const pinNote = usePinNote();

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

  const activeFolderNotes = activeFolder
    ? activeFolder === 'recent'
      ? notes
      : activeFolder === 'pinned'
      ? notes.filter((n) => n.pinned)
      : notes.filter((n) => n.folderId === activeFolder)
    : notes;

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
                border: '1px solid var(--eb-border)',
                padding: '4px 8px',
                borderRadius: 6,
                color: 'var(--eb-muted)',
              }}
            >
              <Search size={10} style={{ flexShrink: 0 }} />
              <input
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
            notes={activeFolderNotes}
            folder={[...QUICK_FOLDERS, ...FOLDERS].find((f) => f.id === activeFolder) ?? null}
            folderLabel={activeLabel}
            onNewNote={() => openNewNote(activeFolder)}
            isLoading={notesLoading}
            onDelete={(id) => deleteNote.mutate(id)}
            onMove={(id, folderId) => moveNote.mutate({ id, folderId })}
            onPin={(id, pinned) => pinNote.mutate({ id, pinned })}
            onNoteClick={(note) => setActiveNote(note)}
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
                What you'll use notes for
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
