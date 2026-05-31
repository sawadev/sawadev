import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';
import { tryUpgradeTerminal } from './ws';

function fresh() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
}

const noopServer = { upgrade: () => true };

afterEach(() => closeDb());

describe('tryUpgradeTerminal', () => {
  it('ignore les chemins non terminal (renvoie null)', () => {
    fresh();
    const res = tryUpgradeTerminal(new Request('http://x/api/system/version'), noopServer);
    expect(res).toBeNull();
  });

  it('rejette en 401 sans session', () => {
    fresh();
    const res = tryUpgradeTerminal(new Request('http://x/ws/terminal/demo'), noopServer);
    expect(res).not.toBeNull();
    expect((res as Response).status).toBe(401);
  });
});
