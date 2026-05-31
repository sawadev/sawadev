import { existsSync } from 'node:fs';
import type { Socket } from 'bun';

/**
 * Attache un exec Docker en mode TTY via le socket Docker, **nativement Bun**.
 *
 * dockerode `exec.start({hijack})` ne fonctionne pas sous Bun (l'upgrade HTTP
 * hijacké ne se résout jamais). On parle donc directement au démon : requête
 * POST /exec/{id}/start avec `Upgrade: tcp`, puis lecture/écriture brutes sur
 * la connexion (en TTY, le flux est brut et bidirectionnel, sans démultiplexage).
 */
export interface ExecAttachment {
  write(data: string): void;
  close(): void;
}

/** Résout le socket Docker (Docker Desktop mac le place sous ~/.docker/run). */
function resolveDockerSocket(): string {
  if (Bun.env.DOCKER_SOCKET) return Bun.env.DOCKER_SOCKET;
  const userSock = `${Bun.env.HOME ?? ''}/.docker/run/docker.sock`;
  if (Bun.env.HOME && existsSync(userSock)) return userSock;
  return '/var/run/docker.sock';
}

const HEADER_SEP = '\r\n\r\n';

export async function attachExec(
  execId: string,
  handlers: { onData: (chunk: string) => void; onClose: () => void },
): Promise<ExecAttachment> {
  let headersDone = false;
  let buffer = Buffer.alloc(0);

  const body = JSON.stringify({ Detach: false, Tty: true });
  const headers = [
    `POST /exec/${execId}/start HTTP/1.1`,
    'Host: docker',
    'Content-Type: application/json',
    'Connection: Upgrade',
    'Upgrade: tcp',
    `Content-Length: ${Buffer.byteLength(body)}`,
  ].join('\r\n');
  const request = `${headers}\r\n\r\n${body}`;

  const socket: Socket = await Bun.connect({
    unix: resolveDockerSocket(),
    socket: {
      open(s) {
        s.write(request);
      },
      data(_s, data) {
        if (headersDone) {
          handlers.onData(Buffer.from(data).toString('utf8'));
          return;
        }
        // Accumule jusqu'à la fin des en-têtes HTTP (réponse 101), puis bascule
        // en mode flux brut pour le reste.
        buffer = Buffer.concat([buffer, Buffer.from(data)]);
        const sep = buffer.indexOf(HEADER_SEP);
        if (sep === -1) return;
        headersDone = true;
        const rest = buffer.subarray(sep + HEADER_SEP.length);
        buffer = Buffer.alloc(0);
        if (rest.length > 0) handlers.onData(rest.toString('utf8'));
      },
      close() {
        handlers.onClose();
      },
      error() {
        handlers.onClose();
      },
    },
  });

  return {
    write(data: string) {
      socket.write(data);
    },
    close() {
      socket.end();
    },
  };
}
