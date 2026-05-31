import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, it } from 'bun:test';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';
import { agentCmd, sessionName, terminalCmd, tryUpgradeWs } from './ws';

function fresh() {
  resetConfigCache();
  closeDb();
  setDb(new Database(':memory:'));
}

const noopServer = { upgrade: () => true };

afterEach(() => closeDb());

describe('tryUpgradeWs', () => {
  it('ignore les chemins non terminal (renvoie null)', () => {
    fresh();
    const res = tryUpgradeWs(new Request('http://x/api/system/version'), noopServer);
    expect(res).toBeNull();
  });

  it('rejette en 401 sans session', () => {
    fresh();
    const res = tryUpgradeWs(new Request('http://x/ws/terminal/demo'), noopServer);
    expect(res).not.toBeNull();
    expect((res as Response).status).toBe(401);
  });
});

describe('commandes tmux persistantes', () => {
  it("terminal : rattache/crée une session nommée d'après le workspace + repli", () => {
    const cmd = terminalCmd(sessionName('shop')).join(' ');
    expect(cmd).toContain('tmux new-session -A -s shop');
    expect(cmd).toContain('exec bash 2>/dev/null || exec sh'); // repli sans tmux
  });

  it('agent : session tmux dédiée + exécution de $AGENT_CMD', () => {
    const cmd = agentCmd(`${sessionName('shop')}-agent`).join(' ');
    expect(cmd).toContain('tmux new-session -A -s shop-agent');
    expect(cmd).toContain('$AGENT_CMD');
  });

  it('sessionName : assainit les caractères non sûrs', () => {
    expect(sessionName('my.ws:1')).toBe('my-ws-1');
    expect(sessionName('')).toBe('ws');
  });
});
