import type { ActionRun, ActionRunStatus, ActionRunSummary, QuickAction } from '@sawadev/shared';
import { getDb } from '../db';
import { attachExec } from '../terminal/exec-attach';
import { getManagedContainer } from '../workspaces/docker';

/** Plafond de sortie capturée par run (anti-OOM sur commandes bavardes). */
const MAX_OUTPUT = 200_000;
/** Délai de purge d'un run terminé de la mémoire (laisse le temps au dernier poll). */
const PURGE_MS = 60_000;

/** Code de sortie → statut. Pur (testable). */
export function exitToStatus(code: number): ActionRunStatus {
  return code === 0 ? 'done' : 'failed';
}

interface LiveRun {
  id: string;
  status: ActionRunStatus;
  output: string;
  exitCode: number | null;
  startedAt: number;
  endedAt: number | null;
}
/** Runs en cours (sortie streamée en mémoire ; persistés en base à la fin). */
const live = new Map<string, LiveRun>();

interface ActionRow {
  id: string;
  label: string;
  command: string;
  created_at: number;
}
interface RunRow {
  id: string;
  status: ActionRunStatus;
  exit_code: number | null;
  output: string;
  started_at: number;
  ended_at: number | null;
}

function lastRunSummary(actionId: string): ActionRunSummary | null {
  const row = getDb()
    .query<Omit<RunRow, 'output'>, [string]>(
      'SELECT id, status, exit_code, started_at, ended_at FROM action_runs WHERE action_id = ? ORDER BY started_at DESC LIMIT 1',
    )
    .get(actionId);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    exitCode: row.exit_code,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

function toAction(row: ActionRow): QuickAction {
  return {
    id: row.id,
    label: row.label,
    command: row.command,
    createdAt: row.created_at,
    lastRun: lastRunSummary(row.id),
  };
}

export function listActions(workspaceId: string): QuickAction[] {
  return getDb()
    .query<ActionRow, [string]>(
      'SELECT id, label, command, created_at FROM quick_actions WHERE workspace_id = ? ORDER BY created_at',
    )
    .all(workspaceId)
    .map(toAction);
}

function getActionRow(workspaceId: string, id: string): ActionRow | null {
  return (
    getDb()
      .query<ActionRow, [string, string]>(
        'SELECT id, label, command, created_at FROM quick_actions WHERE id = ? AND workspace_id = ?',
      )
      .get(id, workspaceId) ?? null
  );
}

export function createAction(workspaceId: string, label: string, command: string): QuickAction {
  const id = crypto.randomUUID();
  getDb().run(
    'INSERT INTO quick_actions (id, workspace_id, label, command, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, workspaceId, label, command, Date.now()],
  );
  return toAction(getActionRow(workspaceId, id) as ActionRow);
}

export function updateAction(
  workspaceId: string,
  id: string,
  label: string,
  command: string,
): QuickAction | null {
  if (!getActionRow(workspaceId, id)) return null;
  getDb().run('UPDATE quick_actions SET label = ?, command = ? WHERE id = ? AND workspace_id = ?', [
    label,
    command,
    id,
    workspaceId,
  ]);
  return toAction(getActionRow(workspaceId, id) as ActionRow);
}

export function deleteAction(workspaceId: string, id: string): boolean {
  const res = getDb().run('DELETE FROM quick_actions WHERE id = ? AND workspace_id = ?', [
    id,
    workspaceId,
  ]);
  return res.changes > 0;
}

function finishRun(run: LiveRun, code: number): void {
  if (run.endedAt) return;
  run.endedAt = Date.now();
  run.exitCode = code;
  run.status = exitToStatus(code);
  getDb().run(
    'UPDATE action_runs SET status = ?, exit_code = ?, output = ?, ended_at = ? WHERE id = ?',
    [run.status, code, run.output.slice(0, MAX_OUTPUT), run.endedAt, run.id],
  );
  setTimeout(() => live.delete(run.id), PURGE_MS);
}

/** Lance la commande d'une action (non bloquant) ; renvoie l'id du run à poller. */
export async function runAction(
  workspaceId: string,
  actionId: string,
): Promise<{ runId: string } | null> {
  const action = getActionRow(workspaceId, actionId);
  if (!action) return null;
  const container = await getManagedContainer(workspaceId);
  if (!container) return null;

  const runId = crypto.randomUUID();
  const run: LiveRun = {
    id: runId,
    status: 'active',
    output: '',
    exitCode: null,
    startedAt: Date.now(),
    endedAt: null,
  };
  live.set(runId, run);
  getDb().run(
    'INSERT INTO action_runs (id, action_id, status, output, started_at) VALUES (?, ?, ?, ?, ?)',
    [runId, actionId, 'active', '', run.startedAt],
  );

  let exec: Awaited<ReturnType<typeof container.exec>>;
  try {
    exec = await container.exec({
      Cmd: ['/bin/sh', '-lc', action.command],
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      WorkingDir: '/workspace',
    });
  } catch {
    finishRun(run, 1);
    return { runId };
  }

  attachExec(exec.id, {
    onData: (chunk) => {
      if (run.output.length < MAX_OUTPUT) run.output += chunk;
    },
    onClose: async () => {
      let code = 1;
      try {
        const info = await exec.inspect();
        code = info.ExitCode ?? 0;
      } catch {
        code = 1;
      }
      finishRun(run, code);
    },
  }).catch(() => finishRun(run, 1));

  return { runId };
}

export function getRun(runId: string): ActionRun | null {
  const r = live.get(runId);
  if (r) {
    return {
      id: r.id,
      status: r.status,
      exitCode: r.exitCode,
      output: r.output,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
    };
  }
  const row = getDb()
    .query<RunRow, [string]>(
      'SELECT id, status, exit_code, output, started_at, ended_at FROM action_runs WHERE id = ?',
    )
    .get(runId);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    exitCode: row.exit_code,
    output: row.output,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}
