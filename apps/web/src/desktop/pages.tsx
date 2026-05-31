import type { KeyProvider } from '@sawadev/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import {
  useApiKeys,
  useAuthState,
  useCreateWorkspace,
  useDeleteApiKey,
  useDeleteWorkspace,
  useLogin,
  useLoginWithPasskey,
  useLogout,
  useRegisterPasskey,
  useSetApiKey,
  useSetup,
  useStartWorkspace,
  useStopWorkspace,
  useVersion,
  useWorkspaces,
} from '../api/hooks';
import { useUI } from '../context';
import { ACCENTS } from '../data';
import { HIcon } from '../icons';
import { PROVIDER_LABEL } from '../providers';
import { Logo, StatusDot } from '../ui';
import { stackLabel, workspaceIcon } from '../workspace-display';
import { DeskFrame } from './DesktopShell';

function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return `Trop d'essais. Réessayez dans ${err.retryAfter ?? 60}s.`;
    if (err.message === 'invalid_credentials') return 'Mot de passe incorrect.';
    if (err.message === 'weak_password') return 'Mot de passe trop court (8 caractères min).';
  }
  return 'Échec de la connexion.';
}

// ── Login ────────────────────────────────────────────────────────
export function DesktopLogin() {
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
    (setupMode ? setupM : loginM).mutate(password, {
      onSuccess,
      onError: (e) => setError(authErrorMessage(e)),
    });
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="card"
        style={{ width: 420, padding: 40, display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginBottom: 30,
          }}
        >
          <Logo size={26} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>your dev machine, in the cloud</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          {setupMode ? 'Set up sawadev' : 'Welcome back'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4, marginBottom: 28 }}>
          {setupMode ? 'Choose your admin password' : 'Sign in to your sawadev server'}
        </div>

        {!setupMode && canPasskey && (
          <>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
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
                }}
              >
                <HIcon name="finger" size={28} color="var(--accent-text)" sw={1.6} />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', height: 50, fontSize: 15 }}
                onClick={submitPasskey}
                disabled={busy}
              >
                {passkeyM.isPending ? (
                  'Authenticating…'
                ) : (
                  <>
                    <HIcon name="finger" size={18} color="var(--on-accent)" />
                    Sign in with passkey
                  </>
                )}
              </button>
              <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>
                Touch ID · Windows Hello · security key
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 18px' }}>
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
              fontSize: 14,
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
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--faint)', marginTop: 24 }}>
          self-hosted
        </div>
      </div>
    </div>
  );
}

// ── Workspaces dashboard ─────────────────────────────────────────
export function DesktopWorkspaces() {
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
    <DeskFrame>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 26 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Workspaces</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
              {isLoading ? 'Loading…' : `${running} of ${workspaces.length} running`}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNew}
            disabled={createM.isPending}
          >
            <HIcon name="plus" size={17} color="var(--on-accent)" />
            {createM.isPending ? 'Creating…' : 'New workspace'}
          </button>
        </div>

        {!isLoading && workspaces.length === 0 && (
          <div style={{ fontSize: 14, color: 'var(--faint)', padding: '24px 2px' }}>
            No workspace yet. Click “New workspace” to create one.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {workspaces.map((w) => {
            const on = w.status === 'running';
            return (
              <div
                key={w.id}
                className="card"
                style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}
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
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--elevated)',
                      border: '1px solid var(--border-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HIcon name={workspaceIcon(w.image)} size={21} color="var(--text-2)" />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
    </DeskFrame>
  );
}

// ── Settings ─────────────────────────────────────────────────────
export function DesktopSettings() {
  const nav = useNavigate();
  const { theme, toggleTheme, accent, setAccent } = useUI();
  const { data: authState } = useAuthState();
  const { data: keys = [] } = useApiKeys();
  const { data: version } = useVersion();
  const logoutM = useLogout();
  const registerPasskeyM = useRegisterPasskey();
  const setKeyM = useSetApiKey();
  const deleteKeyM = useDeleteApiKey();
  const doLogout = () => logoutM.mutate(undefined, { onSuccess: () => nav('/login') });
  const doRegisterPasskey = () => registerPasskeyM.mutate(undefined);
  const addKey = (provider: (typeof keys)[number]['provider']) => {
    const key = window.prompt(`Paste your ${PROVIDER_LABEL[provider]} API key`);
    if (key?.trim()) setKeyM.mutate({ provider, key: key.trim() });
  };
  const server: [string, string, string][] = [
    ['shield', 'Security', 'Password, passkeys, sessions'],
    ['globe', 'Domain & DNS', `${version?.channel ?? 'stable'} channel`],
    ['cpu', 'Version', `current ${version?.current ?? '—'}`],
  ];
  return (
    <DeskFrame>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 28 }}>
          Settings
        </div>

        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--muted)',
            margin: '0 2px 10px',
            letterSpacing: 0.3,
          }}
        >
          APPEARANCE
        </div>
        <div
          className="card"
          style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}
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
            margin: '26px 2px 10px',
            letterSpacing: 0.3,
          }}
        >
          AI AGENTS & API KEYS
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {keys.map((k, i) => (
            <div
              key={k.provider}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '15px 18px',
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>{PROVIDER_LABEL[k.provider]}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: k.connected ? 'var(--text-2)' : 'var(--faint)',
                    marginTop: 2,
                  }}
                >
                  {k.connected ? 'key set · encrypted' : 'no key set'}
                </div>
              </div>
              {k.connected ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => deleteKeyM.mutate(k.provider)}
                >
                  <HIcon name="trash" size={13} color="var(--danger)" />
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => addKey(k.provider)}
                >
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
            margin: '26px 2px 10px',
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
                padding: '15px 18px',
                borderTop: i ? '1px solid var(--border-soft)' : 'none',
                cursor: 'pointer',
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

        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--muted)',
            margin: '26px 2px 10px',
            letterSpacing: 0.3,
          }}
        >
          ACCOUNT
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Passkey</div>
              <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 1 }}>
                {authState?.hasPasskey
                  ? 'A passkey is registered on this account'
                  : 'Add a passkey for faster sign-in (Face ID, Touch ID…)'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={doRegisterPasskey}
              disabled={registerPasskeyM.isPending}
            >
              <HIcon name="finger" size={14} color="var(--text)" />
              {registerPasskeyM.isPending ? 'Registering…' : 'Add passkey'}
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '15px 18px',
              borderTop: '1px solid var(--border-soft)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sign out</div>
              <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 1 }}>
                End this session on the current device
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-line)' }}
              onClick={doLogout}
              disabled={logoutM.isPending}
            >
              <HIcon name="logout" size={14} color="var(--danger)" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </DeskFrame>
  );
}
