import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../api/hooks';
import { HIcon } from '../icons';

export function SignOutSection({
  mobile = false,
  labelStyle,
}: {
  mobile?: boolean;
  labelStyle?: CSSProperties;
}) {
  const nav = useNavigate();
  const logoutM = useLogout();
  const rowPad = mobile ? '14px 16px' : '15px 18px';

  if (mobile) {
    return (
      <button
        type="button"
        className="btn btn-outline"
        style={{
          width: '100%',
          marginTop: 26,
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
    );
  }

  return (
    <>
      {labelStyle && <div style={labelStyle}>ACCOUNT</div>}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: rowPad }}>
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
            onClick={() => logoutM.mutate(undefined, { onSuccess: () => nav('/login') })}
            disabled={logoutM.isPending}
          >
            <HIcon name="logout" size={14} color="var(--danger)" />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
