import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--eb-bg)',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-4px',
          background: 'linear-gradient(135deg, #00d68f 0%, #06b6d4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 16,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--eb-text)',
          margin: '0 0 8px',
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontSize: 14,
          color: 'var(--eb-muted)',
          margin: '0 0 32px',
          maxWidth: 340,
          lineHeight: 1.6,
        }}
      >
        The route you're looking for doesn't exist or has been moved.
      </p>

      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '9px 18px',
          borderRadius: 8,
          border: '1px solid #00b67a',
          background: 'linear-gradient(180deg,#00d68f,#00b67a)',
          color: '#06140f',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
