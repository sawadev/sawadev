import { useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { HIcon } from './icons';
import { ACCENTS } from './data';
import type { Device, Theme } from './types';
import { MobileApp } from './mobile/MobileApp';
import { DesktopIDE } from './desktop/DesktopIDE';
import { IOSDevice } from './device/IOSDevice';

/** Below this width we treat the device as a phone/tablet. */
const MOBILE_QUERY = '(max-width: 820px)';

type DevicePref = 'auto' | Device;

function usePersisted<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => (localStorage.getItem(key) as T) || fallback);
  useEffect(() => {
    localStorage.setItem(key, val);
  }, [key, val]);
  return [val, setVal];
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    m.addEventListener('change', handler);
    setMatches(m.matches);
    return () => m.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/** Scale a fixed-size artboard to fit the viewport (used for the phone preview). */
function useViewportScale(w: number, h: number, pad: number) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const s = Math.min((window.innerWidth - pad) / w, (window.innerHeight - pad) / h);
      setScale(Math.min(s, 1));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h, pad]);
  return scale;
}

/** Centered, scaled iPhone preview — only used when forcing mobile on a wide screen. */
function PhonePreview({
  theme,
  toggleTheme,
  accent,
  setAccent,
}: {
  theme: Theme;
  toggleTheme: () => void;
  accent: string;
  setAccent: (hex: string) => void;
}) {
  const W = 402;
  const H = 874;
  const scale = useViewportScale(W, H, 80);
  return (
    <div className={'stage ' + theme} style={{ position: 'fixed', inset: 0 }}>
      <div style={{ width: W * scale, height: H * scale, position: 'relative' }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
          <IOSDevice width={W} height={H} dark={theme === 'dark'}>
            <MobileApp theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />
          </IOSDevice>
        </div>
      </div>
    </div>
  );
}

/** Dev-only floating bar: force device, toggle theme, pick accent. Hidden in production. */
function DevBar({
  pref,
  setPref,
  theme,
  onToggleTheme,
  accent,
  onAccent,
}: {
  pref: DevicePref;
  setPref: (p: DevicePref) => void;
  theme: Theme;
  onToggleTheme: () => void;
  accent: string;
  onAccent: (hex: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '8px 10px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="seg">
        {(['auto', 'mobile', 'desktop'] as DevicePref[]).map((p) => (
          <button key={p} className={pref === p ? 'on' : ''} onClick={() => setPref(p)} style={{ textTransform: 'capitalize' }}>
            {p}
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
      <button onClick={onToggleTheme} className="btn btn-soft btn-icon btn-sm" title="Toggle theme">
        <HIcon name={theme === 'dark' ? 'sun' : 'moon'} size={16} color="var(--text-2)" />
      </button>
      <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
      <div style={{ display: 'flex', gap: 7 }}>
        {ACCENTS.map((a) => (
          <button
            key={a.hex}
            onClick={() => onAccent(a.hex)}
            title={a.name}
            style={{
              width: 22,
              height: 22,
              borderRadius: 12,
              background: a.hex,
              border: accent === a.hex ? '2px solid var(--text)' : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = usePersisted<Theme>('sawa.theme', 'dark');
  const [accent, setAccent] = usePersisted<string>('sawa.accent', '#7C5CF6');
  const [pref, setPref] = usePersisted<DevicePref>('sawa.device', 'auto');

  const narrow = useMediaQuery(MOBILE_QUERY);
  const auto: Device = narrow ? 'mobile' : 'desktop';
  const device: Device = pref === 'auto' ? auto : pref;
  const isMobile = device === 'mobile';
  // Frame the phone preview only when mobile is *forced* on a wide screen.
  const framedMobile = isMobile && !narrow;

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="sawa" data-theme={theme} style={{ ['--accent' as keyof CSSProperties]: accent } as CSSProperties}>
      {isMobile ? (
        framedMobile ? (
          <PhonePreview theme={theme} toggleTheme={toggleTheme} accent={accent} setAccent={setAccent} />
        ) : (
          <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
            <MobileApp theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />
          </div>
        )
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
          <DesktopIDE theme={theme} onToggleTheme={toggleTheme} />
        </div>
      )}

      {import.meta.env.DEV && (
        <DevBar pref={pref} setPref={setPref} theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />
      )}
    </div>
  );
}
