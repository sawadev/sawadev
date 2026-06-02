import type { GitFile } from '@sawadev/shared';
import { useState } from 'react';
import {
  useGitActions,
  useGitBranches,
  useGitDiff,
  useGitLog,
  useGitStatus,
} from '../../api/hooks';
import { HIcon } from '../../icons';
import { COMPACT, useElementWidth } from '../useElementWidth';
import { EmptyState } from './primitives';

type Tab = 'changes' | 'branches' | 'history';
const TABS: { k: Tab; icon: string; label: string }[] = [
  { k: 'changes', icon: 'diff', label: 'Changes' },
  { k: 'branches', icon: 'branch', label: 'Branches' },
  { k: 'history', icon: 'history', label: 'History' },
];

/** Badge de code git (M/A/D/R/?) → couleur. */
function badge(code: string): { letter: string; color: string } {
  const c = code === ' ' ? '' : code;
  const map: Record<string, string> = {
    M: 'var(--warn)',
    A: 'var(--good)',
    '?': 'var(--good)',
    D: 'var(--danger)',
    R: 'var(--accent-text)',
    U: 'var(--danger)',
  };
  return { letter: c || '•', color: map[c] ?? 'var(--muted)' };
}

function baseName(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? p : p.slice(i + 1);
}
function dirName(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? '' : p.slice(0, i);
}

/** Module Git : statut, fichiers, diff, commit, branches, historique. */
export function GitPanel({ workspaceId }: { workspaceId: string }) {
  const [ref, width] = useElementWidth();
  const compact = width > 0 && width < COMPACT;
  const [tab, setTab] = useState<Tab>('changes');
  const [diff, setDiff] = useState<{ path: string; staged: boolean } | null>(null);
  const { data: status, isLoading } = useGitStatus(workspaceId);

  if (status && !status.repo) {
    return <NoRepo workspaceId={workspaceId} />;
  }

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* segmented tabs */}
      <div style={{ flexShrink: 0, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="seg" style={{ width: '100%' }}>
          {TABS.map((t) => (
            <button
              key={t.k}
              type="button"
              className={tab === t.k ? 'on' : ''}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setTab(t.k)}
              title={t.label}
            >
              <HIcon name={t.icon} size={14} color="currentColor" />
              {!compact && t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {tab === 'changes' && (
          <Changes
            workspaceId={workspaceId}
            onOpenDiff={(path, staged) => setDiff({ path, staged })}
            loading={isLoading}
          />
        )}
        {tab === 'branches' && <Branches workspaceId={workspaceId} />}
        {tab === 'history' && <History workspaceId={workspaceId} />}
      </div>

      {diff && (
        <DiffOverlay
          workspaceId={workspaceId}
          path={diff.path}
          staged={diff.staged}
          onClose={() => setDiff(null)}
        />
      )}
    </div>
  );
}

function NoRepo({ workspaceId }: { workspaceId: string }) {
  const { init } = useGitActions(workspaceId);
  return (
    <EmptyState
      icon="branch"
      title="Not a git repository"
      desc="Initialize a repository in this workspace to track changes."
      action={
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={init.isPending}
          onClick={() => init.mutate()}
        >
          Initialize repository
        </button>
      }
    />
  );
}

function FileRow({
  file,
  badgeCode,
  staged,
  onStage,
  onOpen,
}: {
  file: GitFile;
  badgeCode: string;
  staged: boolean;
  onStage: () => void;
  onOpen: () => void;
}) {
  const b = badge(badgeCode);
  return (
    <div className="git-row">
      <span className="git-badge mono" style={{ color: b.color }}>
        {b.letter}
      </span>
      <button type="button" className="git-path" onClick={onOpen} title={file.path}>
        <span className="git-name">{baseName(file.path)}</span>
        {dirName(file.path) && <span className="git-dir">{dirName(file.path)}</span>}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm"
        title={staged ? 'Unstage' : 'Stage'}
        aria-label={staged ? 'Unstage' : 'Stage'}
        onClick={onStage}
      >
        <HIcon name={staged ? 'chevD' : 'plus'} size={14} color="var(--muted)" />
      </button>
    </div>
  );
}

function Changes({
  workspaceId,
  onOpenDiff,
  loading,
}: {
  workspaceId: string;
  onOpenDiff: (path: string, staged: boolean) => void;
  loading: boolean;
}) {
  const { data: status } = useGitStatus(workspaceId);
  const { stage, unstage, commit } = useGitActions(workspaceId);
  const [msg, setMsg] = useState('');

  if (!status) return null;
  const nothing = status.staged.length + status.unstaged.length + status.untracked.length === 0;

  const onCommit = () => {
    if (!msg.trim() || !status.staged.length) return;
    commit.mutate(msg.trim(), { onSuccess: () => setMsg('') });
  };

  if (nothing && !loading) {
    return (
      <EmptyState icon="check" title="Working tree clean" desc={`On ${status.branch ?? 'HEAD'}.`} />
    );
  }

  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="chip chip-sm">
          <HIcon name="branch" size={12} color="var(--muted)" />
          {status.branch ?? 'HEAD'}
        </span>
        {status.ahead > 0 && <span className="chip chip-sm">↑{status.ahead}</span>}
        {status.behind > 0 && <span className="chip chip-sm">↓{status.behind}</span>}
      </div>

      {status.staged.length > 0 && (
        <Section
          title="Staged"
          count={status.staged.length}
          action={
            <button type="button" className="git-link" onClick={() => unstage.mutate(undefined)}>
              Unstage all
            </button>
          }
        >
          {status.staged.map((f) => (
            <FileRow
              key={`s-${f.path}`}
              file={f}
              badgeCode={f.x}
              staged
              onStage={() => unstage.mutate(f.path)}
              onOpen={() => onOpenDiff(f.path, true)}
            />
          ))}
        </Section>
      )}

      {status.unstaged.length > 0 && (
        <Section
          title="Changes"
          count={status.unstaged.length}
          action={
            <button type="button" className="git-link" onClick={() => stage.mutate(undefined)}>
              Stage all
            </button>
          }
        >
          {status.unstaged.map((f) => (
            <FileRow
              key={`u-${f.path}`}
              file={f}
              badgeCode={f.y}
              staged={false}
              onStage={() => stage.mutate(f.path)}
              onOpen={() => onOpenDiff(f.path, false)}
            />
          ))}
        </Section>
      )}

      {status.untracked.length > 0 && (
        <Section title="Untracked" count={status.untracked.length}>
          {status.untracked.map((f) => (
            <FileRow
              key={`n-${f.path}`}
              file={f}
              badgeCode="?"
              staged={false}
              onStage={() => stage.mutate(f.path)}
              onOpen={() => onOpenDiff(f.path, false)}
            />
          ))}
        </Section>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          className="modal-input"
          style={{ marginTop: 0, minHeight: 52, resize: 'vertical', fontSize: 13 }}
          placeholder="Commit message"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!msg.trim() || !status.staged.length || commit.isPending}
          onClick={onCommit}
        >
          <HIcon name="check" size={14} color="var(--on-accent)" />
          Commit {status.staged.length > 0 ? `(${status.staged.length})` : ''}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.3 }}>
          {title.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: 'var(--faint)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Branches({ workspaceId }: { workspaceId: string }) {
  const { data: branches = [] } = useGitBranches(workspaceId);
  const { checkout } = useGitActions(workspaceId);
  const [q, setQ] = useState('');
  const shown = branches.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        className="modal-input"
        style={{ marginTop: 0, fontSize: 13 }}
        placeholder="Filter branches…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {shown.map((b) => (
        <button
          key={b.name}
          type="button"
          className="git-row git-branch"
          data-on={b.current ? '' : undefined}
          disabled={b.current || checkout.isPending}
          onClick={() => checkout.mutate(b.name)}
        >
          <HIcon
            name="branch"
            size={13}
            color={b.current ? 'var(--accent-text)' : 'var(--muted)'}
          />
          <span className="git-name" style={{ flex: 1, textAlign: 'left' }}>
            {b.name}
          </span>
          {b.current && <HIcon name="check" size={13} color="var(--accent-text)" />}
        </button>
      ))}
    </div>
  );
}

function History({ workspaceId }: { workspaceId: string }) {
  const { data: commits = [] } = useGitLog(workspaceId);
  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {commits.map((c) => (
        <div key={c.hash} className="git-commit">
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{c.subject}</div>
          <div
            style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 11, color: 'var(--muted)' }}
          >
            <span className="mono">{c.hash.slice(0, 7)}</span>
            <span>{c.author}</span>
            <span style={{ color: 'var(--faint)' }}>{c.relative}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiffOverlay({
  workspaceId,
  path,
  staged,
  onClose,
}: {
  workspaceId: string;
  path: string;
  staged: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useGitDiff(workspaceId, path, staged);
  const lines = (data?.diff ?? '').split('\n');
  return (
    <div className="git-diff-overlay">
      <div className="git-diff-head">
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Back"
          onClick={onClose}
        >
          <HIcon name="chevL" size={16} color="var(--text-2)" />
        </button>
        <span
          className="mono"
          style={{
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {path}
        </span>
      </div>
      <div className="git-diff-body">
        {isLoading ? (
          <div style={{ padding: 16, color: 'var(--muted)', fontSize: 12.5 }}>Loading diff…</div>
        ) : !data?.diff ? (
          <div style={{ padding: 16, color: 'var(--muted)', fontSize: 12.5 }}>
            No diff (new or binary file).
          </div>
        ) : (
          <pre className="git-diff">
            {lines.map((l, i) => {
              const cls =
                l.startsWith('+') && !l.startsWith('+++')
                  ? 'add'
                  : l.startsWith('-') && !l.startsWith('---')
                    ? 'del'
                    : l.startsWith('@@')
                      ? 'hunk'
                      : '';
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: lignes de diff stables par index
                <div key={i} className={`dl ${cls}`}>
                  {l || ' '}
                </div>
              );
            })}
          </pre>
        )}
      </div>
    </div>
  );
}
