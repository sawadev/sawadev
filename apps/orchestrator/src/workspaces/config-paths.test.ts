import { afterEach, describe, expect, it } from 'bun:test';
import { getConfig, resetConfigCache } from '../config';

afterEach(() => {
  resetConfigCache();
  Bun.env.HOST_WORKSPACES_DIR = undefined as unknown as string;
  Bun.env.WORKSPACES_DIR = undefined as unknown as string;
});

describe('config workspaces paths', () => {
  it('hostWorkspacesDir retombe sur workspacesDir si non défini (dev)', () => {
    resetConfigCache();
    const c = getConfig();
    expect(c.hostWorkspacesDir).toBe(c.workspacesDir);
  });

  it('hostWorkspacesDir = HOST_WORKSPACES_DIR si défini (prod DooD)', () => {
    Bun.env.HOST_WORKSPACES_DIR = '/opt/sawadev/data/workspaces';
    Bun.env.WORKSPACES_DIR = '/data/workspaces';
    resetConfigCache();
    const c = getConfig();
    expect(c.workspacesDir).toBe('/data/workspaces');
    expect(c.hostWorkspacesDir).toBe('/opt/sawadev/data/workspaces');
  });
});
