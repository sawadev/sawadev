import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import {
  useAuthState,
  useCreateWorkspace,
  useDeleteWorkspace,
  useLogin,
  useLoginWithPasskey,
  useLogout,
  useRegisterPasskey,
  useSetup,
  useStartWorkspace,
  useStopWorkspace,
  useWorkspaces,
} from '../api/hooks';
import { useUI } from '../context';
import { ACCENTS, BOTPAD, SEED_MSGS, TOPPAD, WS, buildAgentRun } from '../data';
import { FileTree } from '../editor/FileTree';
import { WorkspaceFileEditor } from '../editor/WorkspaceFileEditor';
import { HIcon } from '../icons';
import { WorkspacePreview } from '../preview/WorkspacePreview';
import { WorkspaceTerminal } from '../terminal/Terminal';
import type { Msg } from '../types';
import { Logo, StatusDot, UserMark } from '../ui';
import { stackLabel, workspaceIcon } from '../workspace-display';
import { AIPane } from './panes';

/** Traduit une erreur d'API en message lisible pour l'écran de login. */
function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return `Trop d'essais. Réessayez dans ${err.retryAfter ?? 60}s.`;
    if (err.message === 'invalid_credentials') return 'Mot de passe incorrect.';
    if (err.message === 'weak_password') return 'Mot de passe trop court (8 caractères min).';
  }
  return 'Échec de la connexion.';
}

// ── Login ────────────────────────────────────────────────────────
export function MobileLogin() {
  const nav = useNavigate();
  const { data: state } = useAuthState();
  const setupMode = state?.setupDone === false;
  const canPasskey = state?.hasPasskey === true;

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginM = useLogin();
  const setupM = useSetup();
  const passkeyM = useLoginWithPasskey();
  const busy = loginM.isPending || setupM.isPending || passkeyM.isPending;

  const onSuccess = () => nav('/workspaces');

  const submitPassword = () => {
    setError(null);
    const m = setupMode ? setupM : loginM;
    m.mutate(password, { onSuccess, onError: (e) => setError(authErrorMessage(e)) });
  };

  const submitPasskey = () => {
    setError(null);
    passkeyM.mutate(undefined, { onSuccess, onError: (e) => setError(authErrorMessage(e)) });
  };

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-grad)',
        display: 'flex',
        flexDirection: 'column',
        padding: `${TOPPAD + 10}px 28px ${BOTPAD + 14}px`,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 44,
          }}
        >
          <Logo size={28} />
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>your dev machine, in the cloud</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          {setupMode ? 'Set up sawadev' : 'Welcome back'}
        </div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', marginTop: 4, marginBottom: 32 }}>
          {setupMode ? 'Choose your admin password' : 'Sign in to your sawadev server'}
        </div>

        {!setupMode && canPasskey && (
          <>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 20,
                  background: 'var(--accent-soft)',
                  border: '1.5px solid var(--accent-line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HIcon name="finger" size={32} color="var(--accent-text)" sw={1.6} />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', height: 52, fontSize: 15.5 }}
                onClick={submitPasskey}
                disabled={busy}
              >
                {passkeyM.isPending ? (
                  'Authenticating…'
                ) : (
                  <>
                    <HIcon name="finger" size={19} color="var(--on-accent)" />
                    Sign in with passkey
                  </>
                )}
              </button>
              <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>
                Face ID · Touch ID · security key
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '26px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--faint)' }}>or use password</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}

        <label className="field">
          <HIcon name="lock" size={16} color="var(--faint)" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password) submitPassword();
            }}
            placeholder={setupMode ? 'New password (8+ chars)' : 'Password'}
            autoComplete={setupMode ? 'new-password' : 'current-password'}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              fontSize: 15,
              color: 'var(--text)',
            }}
          />
        </label>
        {error && (
          <div style={{ color: 'var(--danger, #e5484d)', fontSize: 13, marginTop: 10 }}>
            {error}
          </div>
        )}
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', marginTop: 12 }}
          onClick={submitPassword}
          disabled={busy || !password}
        >
          {setupMode ? 'Create account' : 'Continue'}
        </button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--faint)' }}>self-hosted</div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────
export function MobileDashboard() {
  const nav = useNavigate();
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const createM = useCreateWorkspace();
  const startM = useStartWorkspace();
  const stopM = useStopWorkspace();
  const deleteM = useDeleteWorkspace();

  const running = workspaces.filter((w) => w.status === 'running').length;

  const onNew = () => {
    const name = window.prompt('Workspace name?');
    if (name?.trim()) createM.mutate({ name: name.trim() });
  };

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
    >
      <div style={{ paddingTop: TOPPAD, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 18px 14px' }}>
          <Logo size={19} />
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => nav('/settings')}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
          >
            <UserMark size={38} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 18px 24px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, marginBottom: 2 }}>
          Workspaces
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 18 }}>
          {isLoading ? 'Loading…' : `${running} of ${workspaces.length} running`}
        </div>

        {!isLoading && workspaces.length === 0 && (
          <div style={{ fontSize: 14, color: 'var(--faint)', padding: '24px 0' }}>
            No workspace yet. Tap “New” to create one.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workspaces.map((w) => {
            const on = w.status === 'running';
            return (
              <div
                key={w.id}
                className="card"
                style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 13 }}
              >
                <button
                  type="button"
                  onClick={() => nav(`/workspaces/${w.id}`)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HIcon name={workspaceIcon(w.image)} size={20} color="var(--text-2)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{w.name}</div>
                    <div
                      className="mono"
                      style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}
                    >
                      {w.id}
                    </div>
                  </div>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chip chip-sm">{stackLabel(w.image)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot on={on} live={on} />
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                      {w.status}
                    </span>
                  </div>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => (on ? stopM.mutate(w.id) : startM.mutate(w.id))}
                  >
                    {on ? 'Stop' : 'Start'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => {
                      if (window.confirm(`Delete ${w.name}? This removes its data.`))
                        deleteM.mutate(w.id);
                    }}
                  >
                    <HIcon name="trash" size={14} color="var(--danger)" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', right: 18, bottom: BOTPAD + 14 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNew}
          disabled={createM.isPending}
          style={{
            height: 52,
            borderRadius: 26,
            padding: '0 22px',
            boxShadow: '0 8px 24px var(--accent-soft), 0 2px 6px rgba(0,0,0,.25)',
          }}
        >
          <HIcon name="plus" size={19} color="var(--on-accent)" />
          {createM.isPending ? 'Creating…' : 'New'}
        </button>
      </div>
    </div>
  );
}

// ── IDE ──────────────────────────────────────────────────────────
const TABS: { k: string; icon: string; label: string; center?: boolean }[] = [
  { k: 'files', icon: 'folder', label: 'Files' },
  { k: 'editor', icon: 'file', label: 'Editor' },
  { k: 'ai', icon: 'sparkle', label: 'AI', center: true },
  { k: 'terminal', icon: 'terminal', label: 'Terminal' },
  { k: 'preview', icon: 'globe', label: 'Preview' },
];

export function MobileIDE() {
  const nav = useNavigate();
  const { id } = useParams();
  const workspaceId = id ?? '';
  const { theme, toggleTheme } = useUI();
  const ws = WS.find((w) => w.id === id) ?? WS[0];

  const [openFile, setOpenFile] = useState<string | null>(null);
  const [tab, setTab] = useState('ai');
  const [msgs, setMsgs] = useState<Msg[]>(SEED_MSGS);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = (prompt: string) => {
    setTab('ai');
    setMsgs((m) => [...m, { role: 'user', text: prompt }]);
    setRunning(true);
    const steps = buildAgentRun(prompt);
    let t = 0;
    steps.forEach((s, i) => {
      t += s.delay;
      const tid = setTimeout(() => {
        setMsgs((m) => [...m, s.msg]);
        if (i === steps.length - 1) setRunning(false);
      }, t);
      timers.current.push(tid);
    });
  };

  const pane: Record<string, JSX.Element> = {
    ai: <AIPane msgs={msgs} running={running} onSend={send} />,
    files: (
      <FileTree
        workspaceId={workspaceId}
        currentPath={openFile}
        onOpen={(p) => {
          setOpenFile(p);
          setTab('editor');
        }}
      />
    ),
    editor: <WorkspaceFileEditor workspaceId={workspaceId} path={openFile} />,
    terminal: <WorkspaceTerminal workspaceId={workspaceId} />,
    preview: <WorkspacePreview workspaceId={workspaceId} />,
  };

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
    >
      <div
        style={{
          paddingTop: TOPPAD,
          flexShrink: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 10px' }}>
          <button
            onClick={() => nav('/workspaces')}
            className="btn btn-ghost btn-icon"
            style={{ width: 34, height: 34 }}
          >
            <HIcon name="back" size={20} color="var(--text-2)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.1 }}>
              {ws.id}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <HIcon name="branch" size={11} color="var(--faint)" />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ws.branch}</span>
              <StatusDot on live />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>running</span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="btn btn-soft btn-icon"
            style={{ width: 34, height: 34 }}
          >
            <HIcon name={theme === 'dark' ? 'sun' : 'moon'} size={17} color="var(--text-2)" />
          </button>
          <button
            onClick={() => nav('/settings')}
            className="btn btn-soft btn-icon"
            style={{ width: 34, height: 34 }}
          >
            <HIcon name="dotsV" size={18} color="var(--text-2)" />
          </button>
        </div>
      </div>

      <div
        key={tab}
        className="fade"
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        {pane[tab]}
      </div>

      <div
        style={{
          flexShrink: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: `8px 8px ${BOTPAD}px`,
          gap: 2,
        }}
      >
        {TABS.map((t) => {
          const on = tab === t.k;
          if (t.center) {
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 36,
                    marginTop: -16,
                    borderRadius: 12,
                    background: 'var(--accent)',
                    boxShadow: '0 6px 18px var(--accent-soft), 0 2px 4px rgba(0,0,0,.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: on ? 'translateY(-2px)' : 'none',
                    transition: 'transform .15s var(--ease)',
                  }}
                >
                  <HIcon name="sparkle" size={21} color="var(--on-accent)" sw={1.5} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: on ? 700 : 600,
                    color: on ? 'var(--accent-text)' : 'var(--muted)',
                  }}
                >
                  {t.label}
                </span>
              </button>
            );
          }
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <HIcon
                name={t.icon}
                size={22}
                color={on ? 'var(--text)' : 'var(--faint)'}
                sw={on ? 1.9 : 1.6}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: on ? 700 : 500,
                  color: on ? 'var(--text)' : 'var(--faint)',
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────
export function MobileSettings() {
  const nav = useNavigate();
  const { theme, toggleTheme, accent, setAccent } = useUI();
  const { data: authState } = useAuthState();
  const logoutM = useLogout();
  const registerPasskeyM = useRegisterPasskey();
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
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
    >
      <div
        style={{
          paddingTop: TOPPAD,
          flexShrink: 0,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px 12px' }}>
          <button
            onClick={() => nav(-1)}
            className="btn btn-ghost btn-icon"
            style={{ width: 34, height: 34 }}
          >
            <HIcon name="back" size={20} color="var(--text-2)" />
          </button>
          <div style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Settings</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: `4px 18px ${BOTPAD + 16}px` }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--muted)',
            margin: '14px 2px 10px',
            letterSpacing: 0.3,
          }}
        >
          APPEARANCE
        </div>
        <div
          className="card"
          style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>Theme</span>
            <div className="seg">
              <button
                className={theme === 'light' ? 'on' : ''}
                onClick={() => theme !== 'light' && toggleTheme()}
              >
                <HIcon name="sun" size={14} color="currentColor" />
                Light
              </button>
              <button
                className={theme === 'dark' ? 'on' : ''}
                onClick={() => theme !== 'dark' && toggleTheme()}
              >
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

        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--muted)',
            margin: '22px 2px 10px',
            letterSpacing: 0.3,
          }}
        >
          AI AGENTS & API KEYS
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {keys.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderTop: i ? '1px solid var(--border-soft)' : 'none',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HIcon name="sparkleSm" size={17} color="var(--muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r[0]}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: r[2] ? 'var(--text-2)' : 'var(--faint)',
                    marginTop: 2,
                  }}
                >
                  {r[1]}
                </div>
              </div>
              {r[2] ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--good)',
                  }}
                >
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

        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--muted)',
            margin: '22px 2px 10px',
            letterSpacing: 0.3,
          }}
        >
          SERVER
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {server.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderTop: i ? '1px solid var(--border-soft)' : 'none',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
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

        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', marginTop: 26, height: 48 }}
          onClick={() => registerPasskeyM.mutate(undefined)}
          disabled={registerPasskeyM.isPending}
        >
          <HIcon name="finger" size={17} color="var(--text)" />
          {authState?.hasPasskey
            ? 'Add another passkey'
            : registerPasskeyM.isPending
              ? 'Registering…'
              : 'Add a passkey'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          style={{
            width: '100%',
            marginTop: 12,
            height: 48,
            color: 'var(--danger)',
            borderColor: 'var(--danger-line)',
          }}
          onClick={() => logoutM.mutate(undefined, { onSuccess: () => nav('/login') })}
          disabled={logoutM.isPending}
        >
          <HIcon name="logout" size={17} color="var(--danger)" />
          Log out
        </button>
      </div>
    </div>
  );
}
