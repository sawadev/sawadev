// landing.tsx — sawadev marketing landing page (every CTA → GitHub).
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import type { Theme } from './main';
import { AIMark, Code, FILE_MIDDLEWARE, HIcon, Logo } from './ui';

/** Dépôt GitHub du projet — source unique de vérité pour tous les liens. */
const GH = 'https://github.com/duboisqpro/sawadev';

// ── small marketing atoms ────────────────────────────────────────
function GhButton({
  primary,
  big,
  children,
  style,
}: {
  primary?: boolean;
  big?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <a
      href={GH}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn ${primary ? 'btn-primary' : 'btn-outline'}`}
      style={{
        textDecoration: 'none',
        height: big ? 54 : 44,
        padding: big ? '0 26px' : '0 18px',
        fontSize: big ? 16 : 15,
        ...style,
      }}
    >
      {children}
    </a>
  );
}

function GithubGlyph({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={color}
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      <path d="M8 .2a8 8 0 00-2.53 15.6c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 008 .2z" />
    </svg>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: 'var(--accent-text)',
      }}
    >
      {children}
    </div>
  );
}

// ── NAV ──────────────────────────────────────────────────────────
function Nav({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const root = document.querySelector('.lp-scroll');
    const onScroll = () => setSolid((root ? root.scrollTop : 0) > 20);
    root?.addEventListener('scroll', onScroll);
    return () => root?.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: solid ? 'color-mix(in srgb, var(--bg) 82%, transparent)' : 'transparent',
        backdropFilter: solid ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${solid ? 'var(--border)' : 'transparent'}`,
      }}
    >
      <div
        className="lp-wrap"
        style={{ height: 68, display: 'flex', alignItems: 'center', gap: 14 }}
      >
        <Logo size={20} />
        <nav
          className="lp-navlinks"
          style={{ display: 'flex', alignItems: 'center', gap: 26, marginLeft: 28 }}
        >
          {['Features', 'Any device', 'Self-host'].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(' ', '-')}`}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-2)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {l}
            </a>
          ))}
          <a
            href={GH}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-2)',
              textDecoration: 'none',
            }}
          >
            Docs
          </a>
        </nav>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn btn-ghost btn-icon"
          aria-label="Toggle theme"
        >
          <HIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color="var(--text-2)" />
        </button>
        <a
          href={GH}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-soft btn-sm lp-star"
          style={{ textDecoration: 'none' }}
        >
          <GithubGlyph size={15} color="var(--text)" />
          <span style={{ fontWeight: 600 }}>Star</span>
          <span
            style={{
              paddingLeft: 8,
              marginLeft: 2,
              borderLeft: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
            }}
          >
            4.2k
          </span>
        </a>
        <GhButton primary>
          <GithubGlyph size={16} color="var(--on-accent)" />
          Get sawadev
        </GhButton>
      </div>
    </header>
  );
}

// ── HERO product visual ──────────────────────────────────────────
function HeroVisual() {
  return (
    <div className="lp-herovis" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: '-12% -6%',
          background: 'radial-gradient(60% 60% at 70% 30%, var(--accent-soft), transparent 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* window bar */}
        <div
          style={{
            height: 40,
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 14px',
          }}
        >
          <div style={{ display: 'flex', gap: 7 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <span
                key={c}
                style={{ width: 11, height: 11, borderRadius: 6, background: c, opacity: 0.9 }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              maxWidth: 300,
              height: 24,
              margin: '0 auto',
              borderRadius: 7,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '0 10px',
            }}
          >
            <HIcon name="lock" size={10} color="var(--faint)" />
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
              storefront-api.sawadev.io
            </span>
          </div>
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'flex', height: 360 }}>
          {/* editor side */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)',
            }}
          >
            <div
              style={{
                height: 34,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}
            >
              <HIcon name="file" size={12} color="var(--accent-text)" />
              <span className="mono" style={{ fontSize: 11.5, fontWeight: 600 }}>
                middleware.ts
              </span>
              <span className="dot" style={{ background: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '10px 6px' }}>
              <Code lines={FILE_MIDDLEWARE.slice(0, 11)} />
            </div>
            <div
              style={{
                height: 116,
                borderTop: '1px solid var(--border)',
                background: 'var(--term-bg)',
                padding: '10px 14px',
                overflow: 'hidden',
              }}
            >
              <div
                className="mono"
                style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--accent-text)' }}
              >
                $ claude "add JWT auth middleware"
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, lineHeight: 1.7, color: 'rgba(180,180,172,0.9)' }}
              >
                ● analyzing repo… ↳ read src/auth/
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--accent-text)' }}
              >
                ✎ editing middleware.ts +24 −3
              </div>
              <div className="mono" style={{ fontSize: 11, lineHeight: 1.7, color: '#7fd99a' }}>
                ✓ 14 passing (1.2s)
              </div>
            </div>
          </div>
          {/* AI side */}
          <div
            className="lp-heroai"
            style={{
              width: 270,
              flexShrink: 0,
              borderLeft: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '0 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <AIMark size={22} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>AI Agent</span>
              <div style={{ flex: 1 }} />
              <span className="chip chip-sm chip-accent" style={{ height: 20, fontSize: 10.5 }}>
                Claude Code
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '88%',
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  borderRadius: '12px 12px 4px 12px',
                  padding: '8px 11px',
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                Add JWT auth & protect /orders
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <AIMark size={20} />
                <div style={{ flex: 1, fontSize: 12, lineHeight: 1.45, color: 'var(--text-2)' }}>
                  Verifying the bearer token, then guarding the router.
                </div>
              </div>
              <div
                className="card"
                style={{
                  background: 'var(--surface)',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <HIcon name="diff" size={13} color="var(--muted)" />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>Edited</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                  middleware.ts
                </span>
                <div style={{ flex: 1 }} />
                <span className="chip chip-sm chip-accent" style={{ height: 18, fontSize: 10 }}>
                  +24
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, height: 28, fontSize: 11.5, pointerEvents: 'none' }}
                >
                  <HIcon name="check" size={12} color="var(--on-accent)" />
                  Approve
                </div>
                <div
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, height: 28, fontSize: 11.5, pointerEvents: 'none' }}
                >
                  Reject
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="lp-wrap lp-hero">
      <div className="lp-hero-copy">
        <Eyebrow>
          <span className="dot dot-on" />
          Open source · self-hosted
        </Eyebrow>
        <h1 className="lp-h1">Your dev machine lives in the cloud.</h1>
        <p className="lp-sub">
          sawadev is an AI-first remote development environment that runs on your own Linux VPS.
          Code from a phone, tablet, or any browser — your device is just a screen.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          <GhButton primary big>
            <GithubGlyph size={18} color="var(--on-accent)" />
            Get it on GitHub
          </GhButton>
          <GhButton big>
            <HIcon name="terminal" size={17} color="var(--text)" />
            Read the install guide
          </GhButton>
        </div>
        <div className="mono lp-install">
          <span style={{ color: 'var(--accent-text)' }}>$</span> curl -fsSL sawadev.io/install | sh
          <span style={{ float: 'right' }}>
            <HIcon name="copy" size={13} color="var(--faint)" />
          </span>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}

// ── DEVICES ──────────────────────────────────────────────────────
function DeviceMini({ kind }: { kind: 'phone' | 'tablet' | 'desktop' }) {
  const screen = (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, padding: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['70%', '90%', '50%', '80%'].map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: barres décoratives statiques
            <div
              key={i}
              style={{ height: 4, width: w, borderRadius: 2, background: 'var(--elevated)' }}
            />
          ))}
        </div>
        {kind !== 'phone' && (
          <div
            style={{
              width: '38%',
              borderLeft: '1px solid var(--border)',
              background: 'var(--surface-2)',
              padding: 7,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--accent)' }} />
            <div
              style={{ height: 4, width: '80%', borderRadius: 2, background: 'var(--elevated)' }}
            />
            <div
              style={{ height: 4, width: '60%', borderRadius: 2, background: 'var(--elevated)' }}
            />
          </div>
        )}
      </div>
      {kind === 'phone' && (
        <div
          style={{
            height: 22,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 3,
                background: i === 2 ? 'var(--accent)' : 'var(--elevated)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
  const dims: Record<typeof kind, [number, number, number]> = {
    phone: [78, 158, 18],
    tablet: [190, 142, 14],
    desktop: [248, 152, 10],
  };
  const [w, h, r] = dims[kind];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: r,
          padding: kind === 'phone' ? 5 : 7,
          background: 'var(--text)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: r - 4, overflow: 'hidden' }}>
          {screen}
        </div>
      </div>
      {kind === 'desktop' && (
        <div
          style={{ width: 60, height: 6, borderRadius: '0 0 4px 4px', background: 'var(--text)' }}
        />
      )}
    </div>
  );
}

function Devices() {
  return (
    <section
      id="any-device"
      className="lp-section"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="lp-wrap">
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
          <Eyebrow>One environment, every screen</Eyebrow>
          <h2 className="lp-h2">Seriously code from a phone.</h2>
          <p className="lp-sub" style={{ margin: '14px auto 0' }}>
            Mobile-first by design. The same workspace adapts from a one-thumb chat-driven flow on
            your phone, to a split work view on tablet, to a full multi-pane IDE on desktop.
          </p>
        </div>
        <div className="lp-devrow">
          <DeviceMini kind="phone" />
          <DeviceMini kind="tablet" />
          <DeviceMini kind="desktop" />
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ─────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: 'sparkle',
    ai: true,
    t: 'AI agents write the code',
    d: 'Drive an autonomous CLI agent — Claude Code, Cursor CLI, Codex — right from the chat panel. Watch it edit files, run commands, and approve changes.',
  },
  {
    icon: 'terminal',
    t: 'A real live terminal',
    d: 'Full xterm-style shell where your agents run. Persistent sessions, instant output, multiplexed tabs.',
  },
  {
    icon: 'file',
    t: 'Lightweight code editor',
    d: 'Syntax-highlighted editing with a fast file tree. Jump in, make a change, let the agent take it from there.',
  },
  {
    icon: 'cpu',
    t: 'Docker workspaces',
    d: 'Every project runs isolated in its own container. Always-on or auto-stop when idle to save resources.',
  },
  {
    icon: 'globe',
    t: 'Instant app previews',
    d: 'Running ports get auto-generated subdomains like project-3000.yourdomain.com. Share or preview in one click.',
  },
  {
    icon: 'finger',
    t: 'Passkey security',
    d: 'Sign in with Face ID, Touch ID, or a security key. Self-hosted, encrypted, your keys never leave your server.',
  },
];

function Features() {
  return (
    <section id="features" className="lp-section">
      <div className="lp-wrap">
        <div style={{ maxWidth: 560, marginBottom: 48 }}>
          <Eyebrow>Everything in one place</Eyebrow>
          <h2 className="lp-h2">A power tool, not a toy.</h2>
        </div>
        <div className="lp-feat-grid">
          {FEATURES.map((f) => (
            <div key={f.t} className="card lp-feat">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: f.ai ? 'var(--accent)' : 'var(--elevated)',
                  border: f.ai ? 'none' : '1px solid var(--border-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: f.ai ? '0 4px 14px var(--accent-soft)' : 'none',
                }}
              >
                <HIcon
                  name={f.icon}
                  size={22}
                  color={f.ai ? 'var(--on-accent)' : 'var(--text-2)'}
                  sw={1.6}
                />
              </div>
              <h3
                style={{ fontSize: 17, fontWeight: 700, margin: '18px 0 8px', letterSpacing: -0.2 }}
              >
                {f.t}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--muted)', margin: 0 }}>
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SELF-HOST steps ──────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    t: 'Spin up a VPS',
    d: 'Any Linux box with Docker — a $5 droplet is plenty to start.',
    cmd: 'ssh root@your-server',
  },
  {
    n: '02',
    t: 'Run the installer',
    d: 'One command sets up sawadev, TLS, and subdomain routing.',
    cmd: 'curl -fsSL sawadev.io/install | sh',
  },
  {
    n: '03',
    t: 'Open your browser',
    d: 'Register a passkey, create a workspace, start coding from anywhere.',
    cmd: 'open https://app.yourdomain.com',
  },
];

function SelfHost() {
  return (
    <section
      id="self-host"
      className="lp-section"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="lp-wrap">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
          <Eyebrow>Yours, end to end</Eyebrow>
          <h2 className="lp-h2">Self-hosted in three steps.</h2>
          <p className="lp-sub" style={{ margin: '14px auto 0' }}>
            No accounts, no vendor lock-in, no data leaving your machine. You own the server and the
            keys.
          </p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="lp-step">
              <div
                className="mono"
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-text)' }}
              >
                {s.n}
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, margin: '10px 0 8px' }}>{s.t}</h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'var(--muted)',
                  margin: '0 0 16px',
                }}
              >
                {s.d}
              </p>
              <div className="mono lp-cmd">
                <span style={{ color: 'var(--accent-text)' }}>$ </span>
                {s.cmd}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA band + footer ────────────────────────────────────────────
function CTA() {
  return (
    <section className="lp-section">
      <div className="lp-wrap">
        <div className="lp-cta">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(70% 120% at 50% 0%, var(--accent-soft), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{ position: 'relative', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}
          >
            <AIMark size={52} style={{ margin: '0 auto 22px', borderRadius: 16 }} />
            <h2 className="lp-h2" style={{ fontSize: 'clamp(28px,4vw,42px)' }}>
              Star it. Clone it. Run it.
            </h2>
            <p className="lp-sub" style={{ margin: '14px auto 28px' }}>
              sawadev is free and open source. Grab the repo, follow the install, and your cloud dev
              machine is live in minutes.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <GhButton primary big>
                <GithubGlyph size={18} color="var(--on-accent)" />
                View on GitHub
              </GhButton>
              <GhButton big>
                <HIcon name="copy" size={16} color="var(--text)" />
                Copy install command
              </GhButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div
        className="lp-wrap"
        style={{
          padding: '40px 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <Logo size={18} />
        <span style={{ fontSize: 13, color: 'var(--faint)' }}>your dev machine, in the cloud</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 22 }}>
          {['Features', 'Docs', 'Install', 'License'].map((l) => (
            <a
              key={l}
              href={GH}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13.5, color: 'var(--text-2)', textDecoration: 'none' }}
            >
              {l}
            </a>
          ))}
        </div>
        <a
          href={GH}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-soft btn-sm"
          style={{ textDecoration: 'none' }}
        >
          <GithubGlyph size={15} color="var(--text)" />
          GitHub
        </a>
      </div>
    </footer>
  );
}

export function LandingPage({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <div>
      <Nav theme={theme} onToggleTheme={onToggleTheme} />
      <Hero />
      <Devices />
      <Features />
      <SelfHost />
      <CTA />
      <Footer />
    </div>
  );
}
