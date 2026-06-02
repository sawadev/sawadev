import { describe, expect, it } from 'bun:test';
import { parseBranches, parseLog, parseStatus } from './service';

const US = String.fromCharCode(0x1f);

describe('parseStatus', () => {
  it('détecte un non-repo', () => {
    const s = parseStatus('fatal: not a git repository (or any of the parent directories): .git');
    expect(s.repo).toBe(false);
  });

  it('parse branche, ahead/behind et classe les fichiers', () => {
    const raw = [
      '## main...origin/main [ahead 1, behind 2]',
      'M  staged.ts',
      ' M dirty.ts',
      'MM both.ts',
      'A  new.ts',
      '?? untracked.ts',
      'R  old.ts -> renamed.ts',
    ].join('\n');
    const s = parseStatus(raw);
    expect(s.repo).toBe(true);
    expect(s.branch).toBe('main');
    expect(s.ahead).toBe(1);
    expect(s.behind).toBe(2);
    expect(s.staged.map((f) => f.path)).toEqual(['staged.ts', 'both.ts', 'new.ts', 'renamed.ts']);
    expect(s.unstaged.map((f) => f.path)).toEqual(['dirty.ts', 'both.ts']);
    expect(s.untracked.map((f) => f.path)).toEqual(['untracked.ts']);
  });

  it('gère « No commits yet »', () => {
    expect(parseStatus('## No commits yet on main').branch).toBe('main');
  });
});

describe('parseBranches', () => {
  it('marque la branche courante', () => {
    const raw = ['* main', '  dev', '  feature/x'].join('\n');
    expect(parseBranches(raw)).toEqual([
      { name: 'main', current: true },
      { name: 'dev', current: false },
      { name: 'feature/x', current: false },
    ]);
  });
});

describe('parseLog', () => {
  it('découpe les champs par séparateur d’unité', () => {
    const raw = [
      `abc123${US}Initial commit${US}Alice${US}2 days ago`,
      `def456${US}Fix bug${US}Bob${US}1 hour ago`,
    ].join('\n');
    expect(parseLog(raw)).toEqual([
      { hash: 'abc123', subject: 'Initial commit', author: 'Alice', relative: '2 days ago' },
      { hash: 'def456', subject: 'Fix bug', author: 'Bob', relative: '1 hour ago' },
    ]);
  });
});
