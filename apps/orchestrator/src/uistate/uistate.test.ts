import { Database } from 'bun:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { closeDb, getDb, setDb } from '../db';
import { UiStateTooLargeError, getUiState, setUiState } from './service';

beforeEach(() => {
  closeDb();
  setDb(new Database(':memory:'));
  getDb().run(
    `INSERT INTO workspaces (id, name, image, volume, lifecycle, created_at)
     VALUES ('w', 'w', 'busybox', '/tmp/w', 'always-on', 0)`,
  );
});

afterEach(() => closeDb());

describe('workspace ui-state', () => {
  it('renvoie un défaut vide si absent', () => {
    const s = getUiState('w');
    expect(s.tabs).toEqual([]);
    expect(s.active).toBeNull();
    expect(s.view).toEqual({});
  });

  it('upsert puis relit (création + mise à jour)', () => {
    setUiState('w', {
      tabs: ['a.ts'],
      active: 'a.ts',
      preview: null,
      expanded: ['src'],
      selected: { path: 'a.ts', type: 'file' },
      view: { 'a.ts': { scroll: 10, anchor: 3, head: 3 } },
    });
    const s = getUiState('w');
    expect(s.tabs).toEqual(['a.ts']);
    expect(s.expanded).toEqual(['src']);
    expect(s.view['a.ts']?.scroll).toBe(10);

    setUiState('w', { ...s, active: null });
    expect(getUiState('w').active).toBeNull();
  });

  it('rejette un blob trop gros', () => {
    const big = 'x'.repeat(70 * 1024);
    expect(() =>
      setUiState('w', {
        tabs: [big],
        active: null,
        preview: null,
        expanded: [],
        selected: null,
        view: {},
      }),
    ).toThrow(UiStateTooLargeError);
  });
});
