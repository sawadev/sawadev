import { Database } from 'bun:sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Docker from 'dockerode';
import { resetConfigCache } from '../config';
import { closeDb, setDb } from '../db';
import { MANAGED_LABEL, getDocker, getManagedContainer } from './docker';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  startWorkspace,
  stopWorkspace,
} from './service';

/** Saute toute la suite si le démon Docker n'est pas joignable. */
async function dockerAvailable(): Promise<boolean> {
  try {
    await new Docker().ping();
    return true;
  } catch {
    return false;
  }
}

const HAVE_DOCKER = await dockerAvailable();
const WS_DIR = `/tmp/sawa-ws-it-${Date.now()}`;

describe.if(HAVE_DOCKER)('workspaces lifecycle (Docker)', () => {
  let unmanagedId: string | null = null;

  beforeAll(() => {
    process.env.WORKSPACE_IMAGE = 'busybox';
    process.env.WORKSPACES_DIR = WS_DIR;
    resetConfigCache();
    closeDb();
    setDb(new Database(':memory:'));
  });

  afterAll(async () => {
    if (unmanagedId) {
      await getDocker()
        .getContainer(unmanagedId)
        .remove({ force: true })
        .catch(() => undefined);
    }
    process.env.WORKSPACE_IMAGE = undefined;
    process.env.WORKSPACES_DIR = undefined;
    closeDb();
  });

  it('crée un workspace démarré, persistant, puis le supprime', async () => {
    const ws = await createWorkspace({ name: 'Demo Project' });
    expect(ws.id).toBe('demo-project');
    expect(ws.status).toBe('running');

    // Le conteneur existe et porte bien le label sawadev.
    const container = await getManagedContainer(ws.id);
    expect(container).not.toBeNull();
    const info = await container!.inspect();
    expect(info.Config.Labels?.[MANAGED_LABEL]).toBe('true');

    // Persistance : un fichier écrit dans le volume survit à un stop/start.
    const filePath = join(WS_DIR, ws.id, 'persist.txt');
    writeFileSync(filePath, 'survives');
    await stopWorkspace(ws.id);
    expect((await getWorkspace(ws.id))?.status).toBe('stopped');
    await startWorkspace(ws.id);
    expect((await getWorkspace(ws.id))?.status).toBe('running');
    expect(readFileSync(filePath, 'utf8')).toBe('survives');

    // On ne touche jamais un conteneur non labellisé.
    const other = await getDocker().createContainer({
      Image: 'busybox',
      name: `not-sawadev-${Date.now()}`,
      Cmd: ['tail', '-f', '/dev/null'],
      Tty: true,
    });
    unmanagedId = other.id;
    await other.start();
    // getManagedContainer ne renvoie jamais ce conteneur, quel que soit l'id testé.
    expect(await getManagedContainer('not-sawadev')).toBeNull();

    // Suppression : conteneur + volume retirés.
    expect(await deleteWorkspace(ws.id)).toBe(true);
    expect(await getWorkspace(ws.id)).toBeNull();
    expect(await getManagedContainer(ws.id)).toBeNull();
    expect(existsSync(filePath)).toBe(false);

    // Le conteneur non managé est toujours là (on n'y a pas touché).
    const stillThere = await getDocker().getContainer(unmanagedId).inspect();
    expect(stillThere.State.Running).toBe(true);
  }, 60_000);
});

if (!HAVE_DOCKER) {
  describe('workspaces lifecycle (Docker)', () => {
    it.skip('ignoré : démon Docker indisponible', () => {});
  });
}
