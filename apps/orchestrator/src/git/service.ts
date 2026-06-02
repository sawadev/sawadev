import type { GitActionResult, GitBranch, GitCommit, GitFile, GitStatus } from '@sawadev/shared';
import { runInWorkspace } from '../terminal/exec-run';

const REPO = '/workspace';
/** Séparateur d'unité (0x1f) pour formater le log : absent des messages de commit. */
const US = String.fromCharCode(0x1f);

const emptyStatus = (repo: boolean): GitStatus => ({
  repo,
  branch: null,
  ahead: 0,
  behind: 0,
  staged: [],
  unstaged: [],
  untracked: [],
});

/** Parse `git status --porcelain=v1 -b`. Pur (testable). */
export function parseStatus(raw: string): GitStatus {
  if (/not a git repository/i.test(raw)) return emptyStatus(false);
  const out = emptyStatus(true);
  for (const line of raw.split('\n')) {
    if (!line) continue;
    if (line.startsWith('## ')) {
      const info = line.slice(3);
      if (info.startsWith('HEAD (no branch)')) {
        out.branch = null;
      } else {
        const m = info.match(/^(?:No commits yet on )?([^. ]+)/);
        out.branch = m ? m[1] : null;
      }
      out.ahead = Number(info.match(/ahead (\d+)/)?.[1] ?? 0);
      out.behind = Number(info.match(/behind (\d+)/)?.[1] ?? 0);
      continue;
    }
    const x = line[0];
    const y = line[1];
    let path = line.slice(3);
    if (path.includes(' -> ')) path = path.split(' -> ')[1];
    const f: GitFile = { path, x, y };
    if (x === '?' && y === '?') {
      out.untracked.push(f);
      continue;
    }
    if (x !== ' ' && x !== '?') out.staged.push(f);
    if (y !== ' ' && y !== '?') out.unstaged.push(f);
  }
  return out;
}

/** Parse `git branch --format='%(HEAD) %(refname:short)'` (marqueur + nom). Pur. */
export function parseBranches(raw: string): GitBranch[] {
  return raw
    .split('\n')
    .filter((l) => l.length > 1)
    .map((l) => ({ name: l.slice(2).trim(), current: l[0] === '*' }))
    .filter((b) => b.name);
}

/** Parse `git log --pretty=format:%H<US>%s<US>%an<US>%ar`. Pur. */
export function parseLog(raw: string): GitCommit[] {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [hash, subject, author, relative] = l.split(US);
      return {
        hash: hash ?? '',
        subject: subject ?? '',
        author: author ?? '',
        relative: relative ?? '',
      };
    })
    .filter((c) => c.hash);
}

const git = (id: string, args: string[]) => runInWorkspace(id, ['git', '-C', REPO, ...args]);

export async function getStatus(id: string): Promise<GitStatus> {
  return parseStatus(await git(id, ['status', '--porcelain=v1', '-b']));
}

export async function getBranches(id: string): Promise<GitBranch[]> {
  return parseBranches(await git(id, ['branch', '--format=%(HEAD) %(refname:short)']));
}

export async function getLog(id: string, n = 30): Promise<GitCommit[]> {
  return parseLog(
    await git(id, ['log', '--pretty=format:%H%x1f%s%x1f%an%x1f%ar', '-n', String(n)]),
  );
}

export async function getDiff(id: string, path?: string, staged?: boolean): Promise<string> {
  const args = ['diff', '--no-color'];
  if (staged) args.push('--staged');
  if (path) args.push('--', path);
  return git(id, args);
}

/** ok best-effort : pas de `fatal:`/`error:` en tête de ligne. */
function toResult(output: string): GitActionResult {
  return { ok: !/^(fatal|error):/im.test(output), output };
}

export async function stage(id: string, path?: string): Promise<GitActionResult> {
  return toResult(await git(id, path ? ['add', '--', path] : ['add', '-A']));
}

export async function unstage(id: string, path?: string): Promise<GitActionResult> {
  return toResult(
    await git(id, path ? ['restore', '--staged', '--', path] : ['restore', '--staged', '.']),
  );
}

export async function commit(id: string, message: string): Promise<GitActionResult> {
  // Message via env → pas de souci de quoting/injection.
  const out = await runInWorkspace(
    id,
    ['/bin/sh', '-lc', `git -C ${REPO} commit -m "$SAWA_MSG"`],
    [`SAWA_MSG=${message}`],
  );
  return toResult(out);
}

export async function checkout(id: string, branch: string): Promise<GitActionResult> {
  const out = await runInWorkspace(
    id,
    ['/bin/sh', '-lc', `git -C ${REPO} checkout "$SAWA_BR"`],
    [`SAWA_BR=${branch}`],
  );
  return toResult(out);
}

export async function init(id: string): Promise<GitActionResult> {
  return toResult(await git(id, ['init']));
}
