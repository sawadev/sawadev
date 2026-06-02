import { type CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import {
  useAuthState,
  useChangePassword,
  useDeletePasskey,
  usePasskeys,
  useRegisterPasskey,
} from '../api/hooks';
import { useUI } from '../context';
import { BOTPAD, TOPPAD } from '../data';
import { DeskFrame } from '../desktop/DesktopShell';
import { HIcon } from '../icons';

function sectionLabelStyle(mobile: boolean, first = false): CSSProperties {
  return {
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--muted)',
    margin: first && mobile ? '14px 2px 10px' : mobile ? '22px 2px 10px' : '26px 2px 10px',
    letterSpacing: 0.3,
  };
}

function changePasswordError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message === 'invalid_credentials') return 'Current password is incorrect.';
    if (err.message === 'weak_password') return 'New password must be at least 8 characters.';
    if (err.message === 'invalid_request') return 'Please fill in all fields.';
  }
  return 'Could not update password.';
}

function SecurityContent({ mobile }: { mobile: boolean }) {
  const { data: authState } = useAuthState();
  const registerPasskeyM = useRegisterPasskey();
  const changePasswordM = useChangePassword();
  const { data: passkeys = [] } = usePasskeys();
  const deletePasskeyM = useDeletePasskey();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const rowPad = mobile ? '14px 16px' : '15px 18px';
  const doRegisterPasskey = () => registerPasskeyM.mutate(undefined);

  const submitPasswordChange = () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    changePasswordM.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordSuccess(true);
        },
        onError: (e) => setPasswordError(changePasswordError(e)),
      },
    );
  };

  return (
    <>
      <div style={sectionLabelStyle(mobile, true)}>PASSWORD</div>
      <div
        className="card"
        style={{ padding: mobile ? 16 : 18, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.45 }}>
          Change the admin password used to sign in to this sawadev server.
        </div>
        <label className="field">
          <HIcon name="lock" size={16} color="var(--faint)" />
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
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
        <label className="field">
          <HIcon name="lock" size={16} color="var(--faint)" />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (8+ chars)"
            autoComplete="new-password"
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
        <label className="field">
          <HIcon name="lock" size={16} color="var(--faint)" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitPasswordChange();
            }}
            placeholder="Confirm new password"
            autoComplete="new-password"
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
        {passwordError && (
          <div style={{ color: 'var(--danger)', fontSize: 13 }}>{passwordError}</div>
        )}
        {passwordSuccess && (
          <div style={{ color: 'var(--good)', fontSize: 13 }}>Password updated.</div>
        )}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={submitPasswordChange}
          disabled={changePasswordM.isPending}
        >
          {changePasswordM.isPending ? 'Updating…' : 'Update password'}
        </button>
      </div>

      <div style={sectionLabelStyle(mobile)}>PASSKEYS</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: rowPad }}>
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
        {passkeys.map((pk) => (
          <div
            key={pk.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: mobile ? '12px 16px' : '12px 18px',
              borderTop: '1px solid var(--border-soft)',
            }}
          >
            <HIcon name="finger" size={16} color="var(--muted)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{pk.label || 'Passkey'}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>
                {pk.id.slice(0, 16)}…
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              title="Remove passkey"
              onClick={() => {
                if (window.confirm('Remove this passkey?')) deletePasskeyM.mutate(pk.id);
              }}
            >
              <HIcon name="trash" size={14} color="var(--danger)" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function SecuritySettings() {
  const nav = useNavigate();
  const { isMobile } = useUI();

  if (isMobile) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
        }}
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
              type="button"
              onClick={() => nav('/settings')}
              className="btn btn-ghost btn-icon"
              style={{ width: 34, height: 34 }}
            >
              <HIcon name="back" size={20} color="var(--text-2)" />
            </button>
            <div style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>Security</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: `4px 18px ${BOTPAD + 16}px` }}>
          <SecurityContent mobile />
        </div>
      </div>
    );
  }

  return (
    <DeskFrame>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 60px' }}>
        <button
          type="button"
          onClick={() => nav('/settings')}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 16, paddingLeft: 0 }}
        >
          <HIcon name="chevL" size={16} color="var(--text-2)" />
          Settings
        </button>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 28 }}>
          Security
        </div>
        <SecurityContent mobile={false} />
      </div>
    </DeskFrame>
  );
}
