import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HIcon } from '../icons';
import { Logo, StatusDot } from '../ui';
import { ACCENTS, WS } from '../data';
import { useUI } from '../context';
import { DeskFrame } from './DesktopShell';

// ── Login ────────────────────────────────────────────────────────
export function DesktopLogin() {
  const nav = useNavigate();
  const [auth, setAuth] = useState(false);
  const go = () => {
    setAuth(true);
    setTimeout(() => nav('/workspaces'), 900);
  };
  return (
    <div style={{ height: '100%', background: 'var(--bg-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 420, padding: 40, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <Logo size={26} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>your dev machine, in the cloud</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Welcome back</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4, marginBottom: 28 }}>Sign in to your sawadev server</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'var(--accent-soft)',
              border: '1.5px solid var(--accent-line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform .3s var(--ease)',
              transform: auth ? 'scale(1.08)' : 'none',
            }}
          >
            <HIcon name={auth ? 'check' : 'finger'} size={28} color="var(--accent-text)" sw={1.6} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', height: 50, fontSize: 15 }} onClick={go}>
            {auth ? (
              'Authenticating…'
            ) : (
              <>
                <HIcon name="finger" size={18} color="var(--on-accent)" />
                Sign in with passkey
              </>
            )}
          </button>
          <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>Touch ID · Windows Hello · security key</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--faint)' }}>or use password</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div className="field">
          <HIcon name="lock" size={16} color="var(--faint)" />
          <span className="ph">Password</span>
        </div>
        <button className="btn btn-outline" style={{ width: '100%', marginTop: 12 }} onClick={() => nav('/workspaces')}>
          Continue
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--faint)', marginTop: 24 }}>self-hosted · v2.4.0</div>
      </div>
    </div>
  );
}

// ── Workspaces dashboard ─────────────────────────────────────────
export function DesktopWorkspaces() {
  const nav = useNavigate();
  return (
    <DeskFrame>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 26 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Workspaces</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>2 of 3 running · 6 of 8 vCPU in use</div>
          </div>
          <button className="btn btn-primary">
            <HIcon name="plus" size={17} color="var(--on-accent)" />
            New workspace
          </button>
        </div>

        <div className="field" style={{ height: 44, marginBottom: 24, maxWidth: 360 }}>
          <HIcon name="search" size={17} color="var(--faint)" />
          <span className="ph" style={{ fontSize: 14 }}>
            Search workspaces…
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {WS.map((w, i) => (
            <div key={i} className="card chip-press" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer' }} onClick={() => nav(`/workspaces/${w.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--elevated)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HIcon name={w.icon} size={21} color="var(--text-2)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>
                    {w.id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>opened {w.last}</div>
                </div>
                <HIcon name="dotsV" size={18} color="var(--faint)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="chip chip-sm">{w.stack}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot on={w.on} live={w.on} />
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{w.on ? 'running' : 'stopped'}</span>
                </div>
                <div style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>
                  {w.res}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DeskFrame>
  );
}

// ── Settings ─────────────────────────────────────────────────────
export function DesktopSettings() {
  const nav = useNavigate();
  const { theme, toggleTheme, accent, setAccent } = useUI();
  const keys: [string, string, boolean][] = [
    ['Anthropic · Claude Code', 'sk-ant-••••4f2a', true],
    ['OpenAI · Codex CLI', 'sk-••••9c10', true],
    ['Cursor CLI', 'no key set', false],
  ];
  const server: [string, string, string][] = [
    ['shield', 'Security', 'Password, passkeys, sessions'],
    ['globe', 'Domain & DNS', 'sawadev.io · 3 subdomains'],
    ['cpu', 'Resources', '6 of 8 vCPU in use'],
  ];
  return (
    <DeskFrame>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 28 }}>Settings</div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', margin: '0 2px 10px', letterSpacing: 0.3 }}>APPEARANCE</div>
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>Theme</span>
            <div className="seg">
              <button className={theme === 'light' ? 'on' : ''} onClick={() => theme !== 'light' && toggleTheme()}>
                <HIcon name="sun" size={14} color="currentColor" />
                Light
              </button>
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => theme !== 'dark' && toggleTheme()}>
                <HIcon name="moon" size={14} color="currentColor" />
                Dark
              </button>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border-soft)' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>Accent</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {ACCENTS.map((a) => (
                <button
                  key={a.hex}
                  onClick={() => setAccent(a.hex)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 16,
                    background: a.hex,
                    border: accent === a.hex ? '2px solid var(--text)' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: accent === a.hex ? '0 0 0 2px var(--bg) inset' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', margin: '26px 2px 10px', letterSpacing: 0.3 }}>AI AGENTS & API KEYS</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {keys.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HIcon name="sparkleSm" size={17} color="var(--muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r[0]}</div>
                <div className="mono" style={{ fontSize: 11, color: r[2] ? 'var(--text-2)' : 'var(--faint)', marginTop: 2 }}>
                  {r[1]}
                </div>
              </div>
              {r[2] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--good)' }}>
                  <StatusDot on />
                  connected
                </div>
              ) : (
                <button className="btn btn-outline btn-sm">
                  <HIcon name="key" size={13} color="var(--text)" />
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', margin: '26px 2px 10px', letterSpacing: 0.3 }}>SERVER</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {server.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderTop: i ? '1px solid var(--border-soft)' : 'none', cursor: 'pointer' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HIcon name={r[0]} size={17} color="var(--muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r[1]}</div>
                <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 1 }}>{r[2]}</div>
              </div>
              <HIcon name="chevR" size={17} color="var(--faint)" />
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', margin: '26px 2px 10px', letterSpacing: 0.3 }}>ACCOUNT</div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sign out</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 1 }}>End this session on the current device</div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-line)' }} onClick={() => nav('/login')}>
            <HIcon name="logout" size={14} color="var(--danger)" />
            Log out
          </button>
        </div>
      </div>
    </DeskFrame>
  );
}
