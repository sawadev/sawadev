import { useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthState } from './api/hooks';
import { UIContext, useUI } from './context';
import { ACCENTS } from './data';
import { DesktopIDE } from './desktop/DesktopIDE';
import { DesktopLogin, DesktopSettings, DesktopWorkspaces } from './desktop/pages';
import { IOSDevice } from './device/IOSDevice';
import { IPadDevice } from './device/IPadDevice';
import { HIcon } from './icons';
import { MobileDashboard, MobileIDE, MobileLogin, MobileSettings } from './mobile/pages';
import { TabletIDE } from './tablet/TabletIDE';
import type { Device, Theme } from './types';

/** Viewport breakpoints used for automatic layout detection. */
const MOBILE_QUERY = '(max-width: 700px)';
const TABLET_QUERY = '(max-width: 1100px)';

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

/** Scale a fixed-size artboard to fit the viewport (used for the device previews). */
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

/** Écran neutre pendant la résolution de l'état d'auth. */
function AuthSplash() {
  return <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }} />;
}

/** Garde : redirige vers /login si la session n'est pas valide. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isLoading } = useAuthState();
  if (isLoading) return <AuthSplash />;
  if (!data?.authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── Page wrappers: pick the variant for the active device per route ──
function LoginPage() {
  const { isMobile } = useUI();
  const { data, isLoading } = useAuthState();
  if (isLoading) return <AuthSplash />;
  // Déjà connecté : pas de raison de rester sur /login.
  if (data?.authenticated) return <Navigate to="/workspaces" replace />;
  return isMobile ? <MobileLogin /> : <DesktopLogin />;
}
function WorkspacesPage() {
  return useUI().isMobile ? <MobileDashboard /> : <DesktopWorkspaces />;
}
function IDEPage() {
  const { device } = useUI();
  if (device === 'mobile') return <MobileIDE />;
  if (device === 'tablet') return <TabletIDE />;
  return <DesktopIDE />;
}
function SettingsPage() {
  return useUI().isMobile ? <MobileSettings /> : <DesktopSettings />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/workspaces"
        element={
          <RequireAuth>
            <WorkspacesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/workspaces/:id"
        element={
          <RequireAuth>
            <IDEPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/workspaces" replace />} />
    </Routes>
  );
}

/** Centered, scaled device preview — used when forcing a smaller device on a wide screen. */
function DevicePreview({ kind, theme }: { kind: 'mobile' | 'tablet'; theme: Theme }) {
  const phone = kind === 'mobile';
  const W = phone ? 402 : 1226; // iPad content 1194 + 16px bezel each side
  const H = phone ? 874 : 866;
  const scale = useViewportScale(W, H, 80);
  return (
    <div className={`stage ${theme}`} style={{ position: 'fixed', inset: 0 }}>
      <div style={{ width: W * scale, height: H * scale, position: 'relative' }}>
        <div
          style={{
            width: W,
            height: H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {phone ? (
            <IOSDevice width={402} height={874} dark={theme === 'dark'}>
              <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                <AppRoutes />
              </div>
            </IOSDevice>
          ) : (
            <IPadDevice width={1194} height={834} dark={theme === 'dark'}>
              <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                <AppRoutes />
              </div>
            </IPadDevice>
          )}
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
  const [open, setOpen] = usePersisted<'open' | 'closed'>('sawa.devbar', 'open');

  if (open === 'closed') {
    return (
      <button
        onClick={() => setOpen('open')}
        title="Show dev controls"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '7px 9px',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
        }}
      >
        <HIcon name="gear" size={15} color="var(--text-2)" />
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 7,
            background: accent,
            border: '1px solid var(--border)',
          }}
        />
        <HIcon name="chevL" size={14} color="var(--faint)" />
      </button>
    );
  }

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
        {(['auto', 'mobile', 'tablet', 'desktop'] as DevicePref[]).map((p) => (
          <button
            key={p}
            className={pref === p ? 'on' : ''}
            onClick={() => setPref(p)}
            style={{ textTransform: 'capitalize' }}
          >
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
      <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
      <button
        onClick={() => setOpen('closed')}
        className="btn btn-ghost btn-icon btn-sm"
        title="Collapse"
      >
        <HIcon name="chevR" size={16} color="var(--faint)" />
      </button>
    </div>
  );
}

export function App() {
  const [theme, setTheme] = usePersisted<Theme>('sawa.theme', 'dark');
  const [accent, setAccent] = usePersisted<string>('sawa.accent', '#7C5CF6');
  const [pref, setPref] = usePersisted<DevicePref>('sawa.device', 'auto');

  const isNarrow = useMediaQuery(MOBILE_QUERY);
  const isTabletWidth = useMediaQuery(TABLET_QUERY);
  const auto: Device = isNarrow ? 'mobile' : isTabletWidth ? 'tablet' : 'desktop';
  const device: Device = pref === 'auto' ? auto : pref;
  const isMobile = device === 'mobile';

  // Show a device bezel only when a *smaller* device is forced on a larger screen.
  const framedMobile = device === 'mobile' && !isNarrow;
  const framedTablet = device === 'tablet' && !isTabletWidth;

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div
      className="sawa"
      data-theme={theme}
      style={{ ['--accent' as keyof CSSProperties]: accent } as CSSProperties}
    >
      <UIContext.Provider value={{ theme, toggleTheme, accent, setAccent, device, isMobile }}>
        <BrowserRouter>
          {framedMobile ? (
            <DevicePreview kind="mobile" theme={theme} />
          ) : framedTablet ? (
            <DevicePreview kind="tablet" theme={theme} />
          ) : (
            <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
              <AppRoutes />
            </div>
          )}
        </BrowserRouter>

        {import.meta.env.DEV && (
          <DevBar
            pref={pref}
            setPref={setPref}
            theme={theme}
            onToggleTheme={toggleTheme}
            accent={accent}
            onAccent={setAccent}
          />
        )}
      </UIContext.Provider>
    </div>
  );
}
