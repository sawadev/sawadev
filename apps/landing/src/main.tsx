import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LandingPage } from './landing';
import './theme.css';
import './landing.css';

export type Theme = 'dark' | 'light';

function Root() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('sawa-lp-theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });
  const toggle = () =>
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('sawa-lp-theme', next);
      } catch {
        // ignore (mode privé)
      }
      return next;
    });

  return (
    <div className="sawa" data-theme={theme} style={{ ['--accent' as string]: '#7C5CF6' }}>
      <div className="lp-scroll">
        <LandingPage theme={theme} onToggleTheme={toggle} />
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
