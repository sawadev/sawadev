import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SEED_MSGS, WS, buildAgentRun } from '../data';
import { DeskRail } from '../desktop/DesktopShell';
import { HIcon } from '../icons';
import { AIPane, EditorPane, FilesPane, PreviewPane, TerminalPane } from '../mobile/panes';
import type { Msg } from '../types';
import { AIMark, StatusDot } from '../ui';

const PANES: { k: string; icon: string; label: string }[] = [
  { k: 'files', icon: 'folder', label: 'Files' },
  { k: 'editor', icon: 'file', label: 'Editor' },
  { k: 'terminal', icon: 'terminal', label: 'Terminal' },
  { k: 'preview', icon: 'globe', label: 'Preview' },
];

/** Intermediate tablet layout: slim rail + single work pane + persistent AI panel. */
export function TabletIDE() {
  const { id } = useParams();
  const ws = WS.find((w) => w.id === id) ?? WS[0];

  const [tab, setTab] = useState('editor');
  const [msgs, setMsgs] = useState<Msg[]>(SEED_MSGS);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = (prompt: string) => {
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

  const leftPane = {
    files: <FilesPane onOpen={() => setTab('editor')} />,
    editor: <EditorPane onAskAI={() => {}} />,
    terminal: <TerminalPane />,
    preview: <PreviewPane />,
  }[tab];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <DeskRail />

      {/* work column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: 56,
            flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 18px',
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.1 }}>
              {ws.id}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <HIcon name="branch" size={11} color="var(--faint)" />
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{ws.branch}</span>
              <StatusDot on live />
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>running</span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="seg">
              {PANES.map((p) => (
                <button key={p.k} className={tab === p.k ? 'on' : ''} onClick={() => setTab(p.k)}>
                  <HIcon name={p.icon} size={14} color="currentColor" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-soft btn-sm">
            <HIcon name="branch" size={13} color="var(--text)" />
            Commit
          </button>
          <button className="btn btn-primary btn-sm">
            <HIcon name="play" size={14} color="var(--on-accent)" />
            Run
          </button>
        </div>
        <div
          key={tab}
          className="fade"
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          {leftPane}
        </div>
      </div>

      {/* persistent AI panel */}
      <div
        style={{
          width: 416,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 56,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '0 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <AIMark size={28} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.1 }}>AI Agent</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
              always alongside your work
            </div>
          </div>
          <HIcon name="history" size={17} color="var(--faint)" />
        </div>
        <AIPane msgs={msgs} running={running} onSend={send} />
      </div>
    </div>
  );
}
