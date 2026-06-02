import type { KeyProvider } from '@sawadev/shared';
import type { CSSProperties } from 'react';
import { useApiKeys, useDeleteApiKey, useSetApiKey } from '../api/hooks';
import { HIcon } from '../icons';
import { PROVIDER_LABEL, ProviderLogo } from '../providers';

export function ApiKeysSection({
  mobile = false,
  labelStyle,
}: {
  mobile?: boolean;
  labelStyle: CSSProperties;
}) {
  const { data: keys = [] } = useApiKeys();
  const setKeyM = useSetApiKey();
  const deleteKeyM = useDeleteApiKey();
  const rowPad = mobile ? '14px 16px' : '15px 18px';

  const addKey = (provider: KeyProvider) => {
    const key = window.prompt(`Paste your ${PROVIDER_LABEL[provider]} API key`);
    if (key?.trim()) setKeyM.mutate({ provider, key: key.trim() });
  };

  return (
    <>
      <div style={labelStyle}>AI AGENTS & API KEYS</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {keys.map((k, i) => (
          <div
            key={k.provider}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: rowPad,
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
              <ProviderLogo provider={k.provider} size={18} />
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
                {!mobile && 'Remove'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => addKey(k.provider)}
              >
                <HIcon name="key" size={13} color="var(--text)" />
                {!mobile && 'Add'}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
