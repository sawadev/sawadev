import { getManagedContainer } from '../workspaces/docker';
import { attachExec } from './exec-attach';

/** Délai max d'une commande one-shot (filet de sécurité si le flux ne se ferme pas). */
const RUN_TIMEOUT_MS = 5000;

/**
 * Exécute une commande **non interactive** dans le conteneur d'un workspace et
 * **capture** sa sortie (stdout+stderr fusionnés, mode TTY). Réutilise la plomberie
 * socket de `attachExec` (l'exec hijacké de dockerode ne fonctionne pas sous Bun).
 * Conçu pour des commandes courtes (`tmux list-sessions`, git…) ; `timeoutMs` permet
 * d'allonger pour des commandes plus lentes (ex. agent en mode print).
 * Renvoie une chaîne vide si le workspace est absent.
 */
export async function runInWorkspace(
  workspaceId: string,
  cmd: string[],
  env?: string[],
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<string> {
  const container = await getManagedContainer(workspaceId);
  if (!container) return '';
  // Conteneur arrêté/absent → exec impossible : on renvoie une sortie vide (pas d'erreur).
  let execId: string;
  try {
    const exec = await container.exec({
      Cmd: cmd,
      Env: env,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      WorkingDir: '/workspace',
    });
    execId = exec.id;
  } catch {
    return '';
  }

  return new Promise<string>((resolve) => {
    let out = '';
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(out);
    };
    const timer = setTimeout(done, timeoutMs);
    attachExec(execId, {
      onData: (chunk) => {
        out += chunk;
      },
      onClose: done,
    }).catch(done);
  });
}
