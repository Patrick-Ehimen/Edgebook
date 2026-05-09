export function SecurityBadge() {
  return (
    <div
      className="mb-[14px] flex items-center justify-center gap-2 rounded-[9px] border border-dashed border-border px-3 py-2 text-[11.5px] text-muted-foreground"
      style={{ background: 'rgba(0,168,107,.06)' }}
    >
      🔒{' '}
      <span>
        <b className="font-semibold" style={{ color: 'var(--green)' }}>Read-only</b> connections only · 2FA enforced ·
        keys envelope-encrypted (KMS)
      </span>
    </div>
  );
}
