import { useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { HIcon } from './icons';
import { ACCENTS } from './data';
import type { Device, Theme } from './types';
import { MobileApp } from './mobile/MobileApp';
import { DesktopIDE } from './desktop/DesktopIDE';
import { IOSDevice } from './device/IOSDevice';

function usePersisted<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => (localStorage.getItem(key) as T) || fallback);
  useEffect(() => {
    localStorage.setItem(key, val);
  }, [key, val]);
  return [val, setVal];
}

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

function DeviceSwitch({ device, onChange }: { device: Device; onChange: (d: Device) => void }) {
  return (
    <div className="devsw">
      <div className="seg" style={{ boxShadow: 'var(--shadow-md)' }}>
        <button className={device === 'mobile' ? 'on' : ''} onClick={() => onChange('mobile')}>
          <HIcon name="cpu" size={14} color="currentColor" />
          Mobile
        </button>
        <button className={device === 'desktop' ? 'on' : ''} onClick={() => onChange('desktop')}>
          <HIcon name="dock" size={14} color="currentColor" />
          Desktop
        </button>
      </div>
    </div>
  );
}

function Controls({
  theme,
  onToggleTheme,
  accent,
  onAccent,
}: {
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
        zIndex: 30,
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
  const [device, setDevice] = usePersisted<Device>('sawa.device', 'mobile');

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const isMobile = device === 'mobile';
  const W = isMobile ? 402 : 1440;
  const H = isMobile ? 874 : 900;
  const scale = useViewportScale(W, H, isMobile ? 80 : 96);

  return (
    <div className="sawa" data-theme={theme} style={{ ['--accent' as keyof CSSProperties]: accent } as CSSProperties}>
      <div className={'stage ' + theme}>
        <div style={{ width: W * scale, height: H * scale, position: 'relative' }}>
          <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
            {isMobile ? (
              <IOSDevice width={402} height={874} dark={theme === 'dark'}>
                <MobileApp theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />
              </IOSDevice>
            ) : (
              <DesktopIDE theme={theme} onToggleTheme={toggleTheme} />
            )}
          </div>
        </div>
      </div>

      <DeviceSwitch device={device} onChange={setDevice} />
      <Controls theme={theme} onToggleTheme={toggleTheme} accent={accent} onAccent={setAccent} />
    </div>
  );
}
