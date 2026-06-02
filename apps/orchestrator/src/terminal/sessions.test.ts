import { describe, expect, it } from 'bun:test';
import { parseTerminalSessions } from './sessions';
import { terminalSessionName } from './ws';

describe('terminalSessionName', () => {
  it('préfixe par le workspace + `-t-` et assainit le termId', () => {
    expect(terminalSessionName('shop', 'a1b2')).toBe('shop-t-a1b2');
    expect(terminalSessionName('my.ws', 'x/y')).toBe('my-ws-t-x-y');
    expect(terminalSessionName('shop', '')).toBe('shop-t-main');
  });
});

describe('parseTerminalSessions', () => {
  it('ne garde que les sessions d’onglets du workspace et retire le préfixe', () => {
    const raw = ['shop-t-a1b2', 'shop-t-c3d4', 'shop-agent', 'other-t-zz', ''].join('\n');
    expect(parseTerminalSessions(raw, 'shop')).toEqual([{ id: 'a1b2' }, { id: 'c3d4' }]);
  });

  it('renvoie [] quand aucune session ne correspond', () => {
    expect(parseTerminalSessions('shop-agent\n', 'shop')).toEqual([]);
    expect(parseTerminalSessions('', 'shop')).toEqual([]);
  });
});
